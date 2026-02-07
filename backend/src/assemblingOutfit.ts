/**
 * Input format:
 * {
 *   items: Array<{ id: string, title: string, category: string, price: number, currency: string, shop: string, url?: string, attributes?: Record<string, string | number | boolean> }>,
 *   constraints?: { budget?: { currency: string, max: number }, mustHaves?: string[], niceToHaves?: string[] }
 * }
 *
 * Output format:
 * {
 *   outfitOptions: Array<{
 *     id: string,
 *     items: Array<{ itemId: string }>,
 *     totalPrice: { currency: string, amount: number },
 *     notes?: string[]
 *   }>,
 *   infeasibleReason?: string
 * }
 *
 * Communicates with:
 * - searchAgent.ts (receives items)
 * - rankingEngine.ts (sends outfit options for ranking)
 */

// 1) Types
export type Item = {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  shop: string;
  url?: string;
  attributes?: Record<string, string | number | boolean>;
};

export type AssembleInput = {
  items: Item[];
  constraints?: {
    budget?: { currency: string; max: number };
    mustHaves?: string[];
    niceToHaves?: string[];
  };
};

export type OutfitOption = {
  id: string;
  items: Array<{ itemId: string }>;
  totalPrice: { currency: string; amount: number };
  notes?: string[];
};

export type AssembleOutput = {
  outfitOptions: OutfitOption[];
  infeasibleReason?: string;
};

export const REQUIRED_CATEGORIES = [
  "jacket",
  "pants",
  "boots",
  "gloves",
  "baseLayer",
] as const;

// 2) Constants + defaults
const DEFAULT_CURRENCY = "USD";
const DEFAULT_TOP_K = 5;
const DEFAULT_NUM_OPTIONS = 5;
const MAX_COMBINATIONS = 2000;
const USE_LLM_NOTES = false;

// 3) Public function
export function assembleOutfits(input: AssembleInput): AssembleOutput {
  const validation = validateInput(input);
  if (validation.infeasibleReason) {
    return { outfitOptions: [], infeasibleReason: validation.infeasibleReason };
  }

  const { currency, budgetMax } = validation;
  const grouped = groupByCategory(input.items);
  const missingCategory = REQUIRED_CATEGORIES.find(
    (category) => !grouped[category] || grouped[category].length === 0
  );
  if (missingCategory) {
    return {
      outfitOptions: [],
      infeasibleReason: `Missing required category: ${missingCategory}`,
    };
  }

  const mustHaves = input.constraints?.mustHaves ?? [];
  const niceToHaves = input.constraints?.niceToHaves ?? [];
  const filtered = filterByMustHaves(grouped, mustHaves);
  for (const category of REQUIRED_CATEGORIES) {
    if (!filtered[category] || filtered[category].length === 0) {
      return {
        outfitOptions: [],
        infeasibleReason: `No items match must-haves for category: ${category}`,
      };
    }
  }

  const topK = pickTopKPerCategory(filtered, niceToHaves, DEFAULT_TOP_K);
  const combinations = buildCombinations(topK, MAX_COMBINATIONS);
  const feasible = priceAndFilterByBudget(combinations, budgetMax);

  if (feasible.length === 0) {
    return { outfitOptions: [], infeasibleReason: "No feasible outfit under budget." };
  }

  const options = feasible.map((combo) => {
    const itemIds = combo.items.map((item) => item.id);
    const notes = annotateNotes(combo.items, input.constraints, currency, budgetMax);
    return {
      id: deterministicId(itemIds),
      items: itemIds.map((itemId) => ({ itemId })),
      totalPrice: { currency, amount: combo.totalPrice },
      notes: notes.length > 0 ? notes : undefined,
    };
  });

  const sorted = options
    .slice()
    .sort((a, b) => a.totalPrice.amount - b.totalPrice.amount || a.id.localeCompare(b.id));

  return { outfitOptions: sorted.slice(0, DEFAULT_NUM_OPTIONS) };
}

// 4) Helper functions
const validateInput = (
  input: AssembleInput
): { infeasibleReason?: string; currency: string; budgetMax: number } => {
  if (!input.items || input.items.length === 0) {
    return { infeasibleReason: "No items provided.", currency: DEFAULT_CURRENCY, budgetMax: Infinity };
  }

  const budget = input.constraints?.budget;
  const currencies = new Set(input.items.map((item) => item.currency));
  const currency = budget?.currency ?? input.items[0].currency ?? DEFAULT_CURRENCY;

  if (budget && currencies.size > 1) {
    return {
      infeasibleReason: "Mixed item currencies not supported with a budget constraint.",
      currency,
      budgetMax: budget.max,
    };
  }

  const budgetMax = budget?.max ?? Infinity;
  return { currency, budgetMax };
};

const groupByCategory = (items: Item[]): Record<string, Item[]> => {
  const grouped: Record<string, Item[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  return grouped;
};

const filterByMustHaves = (
  grouped: Record<string, Item[]>,
  mustHaves: string[]
): Record<string, Item[]> => {
  if (mustHaves.length === 0) return grouped;

  const filtered: Record<string, Item[]> = {};
  for (const [category, items] of Object.entries(grouped)) {
    filtered[category] = items.filter((item) => {
      const attrs = item.attributes ?? {};
      const rawTags = attrs.featureTags;
      const tags = Array.isArray(rawTags) ? rawTags.map(String) : [];
      return mustHaves.every((must) => attrs[must] === true || tags.includes(must));
    });
  }
  return filtered;
};

const pickTopKPerCategory = (
  grouped: Record<string, Item[]>,
  niceToHaves: string[],
  topK: number
): Record<string, Item[]> => {
  const scoredByCategory: Record<string, Item[]> = {};
  for (const [category, items] of Object.entries(grouped)) {
    const sorted = items
      .slice()
      .sort((a, b) => {
        const scoreA = heuristicScore(a, niceToHaves);
        const scoreB = heuristicScore(b, niceToHaves);
        if (scoreA !== scoreB) return scoreB - scoreA;
        if (a.price !== b.price) return a.price - b.price;
        return a.id.localeCompare(b.id);
      });
    scoredByCategory[category] = sorted.slice(0, topK);
  }
  return scoredByCategory;
};

const buildCombinations = (
  grouped: Record<string, Item[]>,
  limit: number
): Array<Item[]> => {
  const results: Array<Item[]> = [];
  const categories = REQUIRED_CATEGORIES as readonly string[];

  const backtrack = (index: number, current: Item[]) => {
    if (results.length >= limit) return;
    if (index === categories.length) {
      results.push(current.slice());
      return;
    }
    const category = categories[index];
    const items = grouped[category] ?? [];
    for (const item of items) {
      current.push(item);
      backtrack(index + 1, current);
      current.pop();
      if (results.length >= limit) return;
    }
  };

  backtrack(0, []);
  return results;
};

const priceAndFilterByBudget = (
  combinations: Array<Item[]>,
  budgetMax: number
): Array<{ items: Item[]; totalPrice: number }> => {
  const feasible: Array<{ items: Item[]; totalPrice: number }> = [];
  for (const combo of combinations) {
    const total = combo.reduce((sum, item) => sum + item.price, 0);
    if (total <= budgetMax) {
      feasible.push({ items: combo, totalPrice: total });
    }
  }
  return feasible;
};

const annotateNotes = (
  outfitItems: Item[],
  constraints: AssembleInput["constraints"] | undefined,
  currency: string,
  budgetMax: number
): string[] => {
  const notes: string[] = [];
  const mustHaves = constraints?.mustHaves ?? [];
  const niceToHaves = constraints?.niceToHaves ?? [];

  for (const must of mustHaves) {
    const matched = outfitItems.every((item) => item.attributes?.[must] === true);
    if (matched) notes.push(`Includes must-have: ${must}`);
  }

  for (const nice of niceToHaves) {
    const matched = outfitItems.some((item) => item.attributes?.[nice] === true);
    if (matched) notes.push(`Includes nice-to-have: ${nice}`);
  }

  if (Number.isFinite(budgetMax)) {
    const total = outfitItems.reduce((sum, item) => sum + item.price, 0);
    const remaining = budgetMax - total;
    if (remaining >= 0) {
      notes.push(`Meets budget with ${currency} ${remaining.toFixed(2)} remaining`);
    }
  }

  const shops = new Set(outfitItems.map((item) => item.shop));
  if (shops.size === 1) {
    notes.push(`All items from same shop: ${outfitItems[0].shop}`);
  }

  return notes;
};

const deterministicId = (itemIds: string[]): string =>
  itemIds.slice().sort().join("|");

const heuristicScore = (item: Item, niceToHaves: string[]): number => {
  let score = 0;
  for (const nice of niceToHaves) {
    if (item.attributes?.[nice] === true) score += 1;
  }
  score += Math.max(0, 1000 - item.price) / 1000;
  return score;
};

// 5) Optional LLM hook (stub only; OFF by default)
async function llmStyleCoherenceNotes(
  _outfit: Item[],
  _constraints: AssembleInput["constraints"]
): Promise<string[]> {
  if (USE_LLM_NOTES) {
    throw new Error("LLM notes not configured");
  }
  return [];
}

// 6) Basic unit-test-friendly exports
export {
  validateInput,
  groupByCategory,
  filterByMustHaves,
  pickTopKPerCategory,
  buildCombinations,
  priceAndFilterByBudget,
  annotateNotes,
  deterministicId,
};

// 7) Suggested test commands:
// npm test
// npx vitest run src/assemblingOutfit.test.ts
/**
 * - Input format: { items: Array<{ id: string, title: string, category: string, price: number, currency: string, shop: string, url?: string, attributes?: Record<string, string | number | boolean> }>, constraints?: { budget?: { currency: string, max: number }, mustHaves?: string[], niceToHaves?: string[] } }
 * - Output format: { outfitOptions: Array<{ id: string, items: Array<{ itemId: string }>, totalPrice: { currency: string, amount: number }, notes?: string[] }>, infeasibleReason?: string }
 * - Communicates with: searchAgent.ts (receives items), rankingEngine.ts (sends outfit options for ranking)
 */

