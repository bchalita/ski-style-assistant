/**
 * - Input format: { outfitOptions: Array<{ id: string, items: Array<{ itemId: string }>, totalPrice: { currency: string, amount: number }, notes?: string[] }>, scoringConfig?: { weights?: Record<string, number> }, userPrompt?: string, items?: Item[] }
 * - Output format: { ranked: Array<{ outfitId: string, score: number, explanation: string }>, recommendedOutfitId?: string }
 * - Communicates with: assemblingOutfit.ts (receives outfit options), cart.ts (sends recommended/selected outfit for cart creation)
 * - Uses OpenAI API for top-3 outfit explanations (requires OPENAI_API_KEY in .env)
 */

import OpenAI from "openai";

// --- Step 1: Types and function signature ---

/** Price shape (matches shared Money type from README) */
interface Money {
  currency: string;
  amount: number;
}

/** Catalog item (subset needed for coherence scoring + OpenAI description) */
export interface Item {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  shop: string;
  url?: string;
  attributes?: Record<string, string | number | boolean | string[]>;
}

/** A single outfit option produced by assemblingOutfit.ts */
export interface OutfitOption {
  id: string;
  items: Array<{ itemId: string }>;
  totalPrice: Money;
  notes?: string[];
}

/** One entry in the ranked results */
export interface RankedOutfit {
  outfitId: string;
  score: number;
  explanation: string;
}

/** Full output of the ranking engine */
export interface RankingResult {
  ranked: RankedOutfit[];
  recommendedOutfitId?: string;
}

/** Optional scoring configuration */
export interface ScoringConfig {
  weights?: Record<string, number>;
  budget?: number; // max budget in same currency unit as items
}

/** Input to rankOutfits */
export interface RankOutfitsInput {
  outfitOptions: OutfitOption[];
  scoringConfig?: ScoringConfig;
  /** User's original request (for coherence + OpenAI explanation) */
  userPrompt?: string;
  /** Full item catalog (for coherence + outfit description to OpenAI) */
  items?: Item[];
}

// --- Step 2: Price-based scoring ---

function computePriceScore(
  outfit: OutfitOption,
  allOutfits: OutfitOption[],
  budget?: number
): number {
  const price = outfit.totalPrice.amount;
  if (budget !== undefined && budget > 0) {
    if (price > budget) return 0;
    return Math.round(100 * (1 - price / budget));
  }
  const prices = allOutfits.map((o) => o.totalPrice.amount);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  if (range === 0) return 100;
  return Math.round(100 * (1 - (price - minPrice) / range));
}

// --- Coherence scoring (prompt vs outfit) ---

/** Extracts lowercase words from text for keyword matching */
function extractWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

/**
 * Computes coherence score (0–100) between user prompt and outfit.
 * Uses keyword overlap: prompt words vs item titles/categories.
 * Returns 50 (neutral) if no prompt or items.
 */
function computeCoherenceScore(
  outfit: OutfitOption,
  userPrompt: string | undefined,
  items: Item[] | undefined
): number {
  if (!userPrompt?.trim() || !items?.length) return 50;

  const promptWords = extractWords(userPrompt);
  if (promptWords.size === 0) return 50;

  const outfitTexts: string[] = [];
  for (const { itemId } of outfit.items) {
    const item = items.find((i) => i.id === itemId);
    if (item) outfitTexts.push(item.title, item.category);
  }
  const outfitWords = extractWords(outfitTexts.join(" "));
  if (outfitWords.size === 0) return 50;

  let matchCount = 0;
  for (const w of promptWords) {
    if (outfitWords.has(w)) matchCount++;
  }
  const overlapRatio = matchCount / promptWords.size;
  return Math.round(Math.min(100, overlapRatio * 150)); // cap 100, boost partial matches
}

// --- Combined scoring ---

const DEFAULT_WEIGHTS = { price: 0.2, coherence: 0.8 };

function computeCombinedScore(
  outfit: OutfitOption,
  allOutfits: OutfitOption[],
  input: RankOutfitsInput
): number {
  const { scoringConfig, userPrompt, items } = input;
  const budget = scoringConfig?.budget;
  const weights = scoringConfig?.weights ?? DEFAULT_WEIGHTS;

  const priceScore = computePriceScore(outfit, allOutfits, budget);
  const coherenceScore = computeCoherenceScore(outfit, userPrompt, items);

  const wPrice = weights.price ?? DEFAULT_WEIGHTS.price;
  const wCoherence = weights.coherence ?? DEFAULT_WEIGHTS.coherence;
  return Math.round(wPrice * priceScore + wCoherence * coherenceScore);
}

// --- OpenAI explanation for top outfits ---

/** Builds a short text description of an outfit for the prompt */
function describeOutfit(outfit: OutfitOption, items: Item[]): string {
  const parts: string[] = [];
  for (const { itemId } of outfit.items) {
    const item = items.find((i) => i.id === itemId);
    if (item) parts.push(`${item.category}: ${item.title} (${item.shop}, ${item.currency} ${item.price})`);
  }
  const total = outfit.totalPrice;
  parts.push(`Total: ${total.currency} ${total.amount}`);
  return parts.join(". ");
}

async function generateExplanationWithOpenAI(
  userPrompt: string,
  outfitDescription: string,
  outfitId: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return `Outfit ${outfitId}: ${outfitDescription.slice(0, 80)}...`;
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a fashion assistant. In 2-3 short sentences, give a friendly opinion on how well this outfit matches the user's request. Be concise and helpful.",
      },
      {
        role: "user",
        content: `User request: "${userPrompt}"\n\nOutfit: ${outfitDescription}\n\nBrief opinion:`,
      },
    ],
    max_tokens: 80,
  });

  const text = response.choices[0]?.message?.content?.trim();
  return text || `Outfit ${outfitId} matches your criteria.`;
}

// --- Main ranking function (now async) ---

/**
 * Ranks outfit options by price + coherence, takes top 3, and uses OpenAI for explanations.
 */
export async function rankOutfits(input: RankOutfitsInput): Promise<RankingResult> {
  if (!input.outfitOptions || input.outfitOptions.length === 0) {
    return { ranked: [] };
  }

  const { outfitOptions, userPrompt, items } = input;

  const scored = outfitOptions.map((outfit) => ({
    outfit,
    score: computeCombinedScore(outfit, outfitOptions, input),
  }));

  scored.sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score;
  const topTier = scored.filter((s) => s.score === topScore);
  const rest = scored.filter((s) => s.score !== topScore);
  if (topTier.length > 1) {
    const randomIndex = Math.floor(Math.random() * topTier.length);
    const [chosen] = topTier.splice(randomIndex, 1);
    topTier.unshift(chosen);
  }
  const ordered = [...topTier, ...rest];

  const top3 = ordered.slice(0, 3);

  const ranked: RankedOutfit[] = await Promise.all(
    top3.map(async ({ outfit, score }) => {
      let explanation: string;
      if (userPrompt?.trim() && items?.length) {
        const desc = describeOutfit(outfit, items);
        explanation = await generateExplanationWithOpenAI(userPrompt, desc, outfit.id);
      } else {
        const priceStr = `${outfit.totalPrice.currency} ${outfit.totalPrice.amount}`;
        explanation = `Price: ${priceStr}. Score: ${score}.`;
      }
      return { outfitId: outfit.id, score, explanation };
    })
  );

  return {
    ranked,
    recommendedOutfitId: ranked[0]?.outfitId,
  };
}
