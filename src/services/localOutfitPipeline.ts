// Client-side outfit pipeline: search → assemble → rank (no backend needed)

import { loadCatalog, type SearchItem, type ShopId, type AttributeValue } from "./catalogLoader";
import type { RequestAgentOutput } from "./localRequestAgent";
import type { BackendItem } from "@/types";

export interface OutfitOptionBackend {
  id: string;
  items: Array<{ itemId: string }>;
  totalPrice: { currency: string; amount: number };
  notes?: string[];
}

export interface RankedOutfit {
  outfitId: string;
  score: number;
  explanation: string;
}

export interface OutfitPipelineResult {
  items: BackendItem[];
  outfitOptions: OutfitOptionBackend[];
  ranked: RankedOutfit[];
  recommendedOutfitId?: string;
  infeasibleReason?: string;
}

// ===== SEARCH =====
const CATEGORY_ORDER = ["jacket", "pants", "boots", "gloves", "baselayer", "base_bottom"];
const SHOPS: ShopId[] = ["alpineMart", "snowBase", "peakShop"];
const BASE_DATE = "2026-02-01";

function toLower(v: unknown): string | undefined { return typeof v === "string" ? v.trim().toLowerCase() : undefined; }
function parseDate(v: string): Date | null { const d = new Date(`${v}T00:00:00Z`); return isNaN(d.getTime()) ? null : d; }
function addDays(base: string, days: number): Date | null { const d = parseDate(base); if (!d) return null; d.setUTCDate(d.getUTCDate() + days); return d; }

function matchesAttributes(item: SearchItem, attrs?: Record<string, AttributeValue>): boolean {
  if (!attrs) return true;
  const ia = item.attributes ?? {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    if (key === "size") { const s = toLower(value); const sizes = ia.sizes; const list = Array.isArray(sizes) ? sizes : []; if (!list.some(e => toLower(e) === s)) return false; continue; }
    if (typeof value === "string") { if (toLower(ia[key]) !== toLower(value)) return false; continue; }
    if (ia[key] !== value) return false;
  }
  return true;
}

function queryShop(catalog: Record<ShopId, SearchItem[]>, shop: ShopId, categories: string[], budget?: { currency: string; max: number }, deadline?: string, attributes?: Record<string, AttributeValue>): SearchItem[] {
  const items = catalog[shop] ?? [];
  const deadlineDate = deadline ? parseDate(deadline) : null;
  const variants: Record<string, AttributeValue>[] = [attributes ?? {}];
  if (attributes?.color) { const { color: _, ...rest } = attributes; variants.push(rest); }
  if (attributes?.brand) { const { brand: _, ...rest } = attributes; variants.push(rest); }
  if (attributes?.color && attributes?.brand) { const { color: _c, brand: _b, ...rest } = attributes; variants.push(rest); }

  for (const variant of variants) {
    const filtered = items.filter(item => {
      if (categories.length > 0 && !categories.includes(item.category)) return false;
      if (budget && item.price > budget.max) return false;
      if (budget && item.currency !== budget.currency) return false;
      if (deadlineDate) { const dm = Number(item.attributes?.deliveryDaysMax); const arrival = addDays(BASE_DATE, dm); if (!arrival || arrival > deadlineDate) return false; }
      return matchesAttributes(item, variant);
    });
    if (filtered.length > 0) return filtered;
  }
  return [];
}

function scoreItem(item: SearchItem, prefColor?: string, prefBrand?: string, budgetMax?: number): number {
  let score = 0;
  const a = item.attributes ?? {};
  if (prefColor && toLower(a.color) === prefColor) score += 30;
  if (prefBrand && toLower(a.brand) === prefBrand) score += 15;
  if (a.waterproof === true) score += 20;
  if (budgetMax) score += Math.min(10, Math.max(0, 10 * (1 - item.price / budgetMax)));
  return score;
}

function searchAgent(catalog: Record<ShopId, SearchItem[]>, input: { budget?: { currency: string; max: number }; deadline?: string; preferences?: Record<string, unknown>; mustHaves?: string[]; niceToHaves?: string[] }): { items: SearchItem[] } {
  const prefColor = toLower(input.preferences?.color);
  const prefBrand = toLower(input.preferences?.brand);
  const attrs: Record<string, AttributeValue> = {};
  if (prefColor) attrs.color = prefColor;
  if (prefBrand) attrs.brand = prefBrand;
  const prefSize = toLower(input.preferences?.size);
  if (prefSize) attrs.size = prefSize;

  const allItems: SearchItem[] = [];
  for (const shop of SHOPS) {
    allItems.push(...queryShop(catalog, shop, CATEGORY_ORDER, input.budget, input.deadline, Object.keys(attrs).length > 0 ? attrs : undefined));
  }

  const ranked = allItems.sort((a, b) => {
    const sd = scoreItem(b, prefColor, prefBrand, input.budget?.max) - scoreItem(a, prefColor, prefBrand, input.budget?.max);
    return sd !== 0 ? sd : a.price - b.price;
  });

  const items: SearchItem[] = [];
  for (const cat of CATEGORY_ORDER) {
    items.push(...ranked.filter(i => i.category === cat).slice(0, 10));
  }
  return { items };
}

// ===== ASSEMBLE =====
const REQUIRED_CATEGORIES = ["jacket", "pants", "boots", "gloves", "baselayer"];
const OPTIONAL_CATEGORIES = ["base_bottom"];

function assembleOutfits(items: SearchItem[], budget?: { currency: string; max: number }): { outfitOptions: OutfitOptionBackend[]; infeasibleReason?: string } {
  if (items.length === 0) return { outfitOptions: [], infeasibleReason: "No items found" };

  const grouped: Record<string, SearchItem[]> = {};
  for (const item of items) { if (!grouped[item.category]) grouped[item.category] = []; grouped[item.category].push(item); }

  const missing = REQUIRED_CATEGORIES.find(c => !grouped[c]?.length);
  if (missing) return { outfitOptions: [], infeasibleReason: `Missing category: ${missing}` };

  const comboCategories = [...REQUIRED_CATEGORIES];
  for (const cat of OPTIONAL_CATEGORIES) {
    if (grouped[cat]?.length) comboCategories.push(cat);
  }

  const topK: Record<string, SearchItem[]> = {};
  for (const cat of comboCategories) {
    const sorted = (grouped[cat] ?? []).sort((a, b) => a.price - b.price);
    topK[cat] = sorted.slice(0, 5);
  }

  const combos: SearchItem[][] = [];
  const MAX = 100;
  const bt = (idx: number, curr: SearchItem[]) => {
    if (combos.length >= MAX) return;
    if (idx === comboCategories.length) { combos.push([...curr]); return; }
    for (const item of topK[comboCategories[idx]]) { curr.push(item); bt(idx + 1, curr); curr.pop(); if (combos.length >= MAX) return; }
  };
  bt(0, []);

  const currency = budget?.currency ?? "USD";
  const allPriced = combos
    .map(c => ({ items: c, total: c.reduce((s, i) => s + i.price, 0) }))
    .sort((a, b) => a.total - b.total);

  // If budget set, prefer under-budget; if none fit, return cheapest anyway
  const budgetMax = budget?.max ?? Infinity;
  const underBudget = allPriced.filter(c => c.total <= budgetMax);
  const feasible = (underBudget.length > 0 ? underBudget : allPriced).slice(0, 5);

  if (feasible.length === 0) return { outfitOptions: [], infeasibleReason: "No outfit combinations could be generated" };

  return {
    outfitOptions: feasible.map(f => ({
      id: f.items.map(i => i.id).sort().join("|"),
      items: f.items.map(i => ({ itemId: i.id })),
      totalPrice: { currency, amount: f.total },
    })),
  };
}

// ===== RANK =====
function extractWords(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 1));
}

function computeScore(outfit: OutfitOptionBackend, allOutfits: OutfitOptionBackend[], userPrompt?: string, items?: SearchItem[], budgetMax?: number): number {
  const price = outfit.totalPrice.amount;
  let priceScore: number;
  if (budgetMax && budgetMax > 0) { priceScore = price > budgetMax ? 0 : Math.round(100 * (1 - price / budgetMax)); }
  else { const prices = allOutfits.map(o => o.totalPrice.amount); const range = Math.max(...prices) - Math.min(...prices); priceScore = range === 0 ? 100 : Math.round(100 * (1 - (price - Math.min(...prices)) / range)); }

  let coherence = 50;
  if (userPrompt?.trim() && items?.length) {
    const pw = extractWords(userPrompt);
    const ow = extractWords(outfit.items.map(({ itemId }) => { const i = items.find(x => x.id === itemId); return i ? `${i.title} ${i.category}` : ""; }).join(" "));
    if (pw.size > 0 && ow.size > 0) { let m = 0; for (const w of pw) if (ow.has(w)) m++; coherence = Math.round(Math.min(100, (m / pw.size) * 150)); }
  }

  return Math.round(0.2 * priceScore + 0.8 * coherence);
}

function rankOutfits(outfitOptions: OutfitOptionBackend[], items: SearchItem[], userPrompt?: string, budgetMax?: number): { ranked: RankedOutfit[]; recommendedOutfitId?: string } {
  const scored = outfitOptions.map(o => ({ outfit: o, score: computeScore(o, outfitOptions, userPrompt, items, budgetMax) })).sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);

  const ranked: RankedOutfit[] = top3.map(({ outfit, score }) => {
    const desc = outfit.items.map(({ itemId }) => {
      const i = items.find(x => x.id === itemId);
      return i ? `${i.category}: ${i.title} (${i.shop}, $${i.price})` : "";
    }).filter(Boolean).join(". ");
    return { outfitId: outfit.id, score, explanation: `This outfit was selected as the best match for your preferences. ${desc}` };
  });

  return { ranked, recommendedOutfitId: ranked[0]?.outfitId };
}

// ===== Convert SearchItem → BackendItem =====
function toBackendItem(item: SearchItem): BackendItem {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    price: item.price,
    currency: item.currency,
    shop: item.shop,
    url: item.url,
    attributes: item.attributes as Record<string, string | number | boolean | string[]>,
  };
}

// ===== MAIN PIPELINE =====
export async function callOutfitPipeline(
  normalizedRequest: RequestAgentOutput,
  userPrompt?: string
): Promise<OutfitPipelineResult> {
  const catalog = await loadCatalog();

  console.log("[outfit-pipeline] Starting local pipeline...");

  // 1. Search
  const searchResult = searchAgent(catalog, {
    budget: normalizedRequest.budget ?? undefined,
    deadline: normalizedRequest.deliveryDeadline ?? undefined,
    preferences: { color: normalizedRequest.preferences?.color ?? undefined },
    mustHaves: normalizedRequest.mustHaves,
    niceToHaves: normalizedRequest.niceToHaves,
  });

  console.log("[outfit-pipeline] Search found", searchResult.items.length, "items");

  if (searchResult.items.length === 0) {
    return { items: [], outfitOptions: [], ranked: [], infeasibleReason: "No items found matching your criteria" };
  }

  // 2. Assemble
  const assembleResult = assembleOutfits(searchResult.items, normalizedRequest.budget ?? undefined);
  console.log("[outfit-pipeline] Assembled", assembleResult.outfitOptions.length, "outfits");

  if (assembleResult.outfitOptions.length === 0) {
    return { items: searchResult.items.map(toBackendItem), outfitOptions: [], ranked: [], infeasibleReason: assembleResult.infeasibleReason };
  }

  // 3. Rank
  const rankResult = rankOutfits(assembleResult.outfitOptions, searchResult.items, userPrompt, normalizedRequest.budget?.max);
  console.log("[outfit-pipeline] Ranked, recommended:", rankResult.recommendedOutfitId);

  return {
    items: searchResult.items.map(toBackendItem),
    outfitOptions: assembleResult.outfitOptions,
    ranked: rankResult.ranked,
    recommendedOutfitId: rankResult.recommendedOutfitId,
  };
}
