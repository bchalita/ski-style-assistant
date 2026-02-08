import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ===== TYPES =====
type AttributeValue = string | number | boolean | string[];
type SearchItem = { id: string; title: string; category: string; price: number; currency: string; shop: string; url?: string; attributes?: Record<string, AttributeValue> };
type ShopId = "alpineMart" | "snowBase" | "peakShop";
type OutfitOption = { id: string; items: Array<{ itemId: string }>; totalPrice: { currency: string; amount: number }; notes?: string[] };
type RankedOutfit = { outfitId: string; score: number; explanation: string };

// ===== PRODUCT CATALOG (inline from fakeDatabase) =====
const CATALOG: Record<ShopId, SearchItem[]> = {
  alpineMart: [
    { id: "am-jacket-1", title: "Aurora Shell Jacket", category: "jacket", price: 289, currency: "USD", shop: "alpineMart", attributes: { color: "black", brand: "NorthPeak", sizes: ["s","m","l"], deliveryDaysMin: 2, deliveryDaysMax: 5, waterproof: true } },
    { id: "am-jacket-2", title: "Summit Insulated Jacket", category: "jacket", price: 319, currency: "USD", shop: "alpineMart", attributes: { color: "blue", brand: "GlacierWool", sizes: ["m","l","xl"], deliveryDaysMin: 3, deliveryDaysMax: 6, waterproof: false } },
    { id: "am-pants-1", title: "RidgeLine Pants", category: "pants", price: 199, currency: "USD", shop: "alpineMart", attributes: { color: "black", brand: "NorthPeak", sizes: ["s","m","l","xl"], deliveryDaysMin: 2, deliveryDaysMax: 4, waterproof: true } },
    { id: "am-pants-2", title: "GlacierEdge Pants", category: "pants", price: 219, currency: "USD", shop: "alpineMart", attributes: { color: "white", brand: "IceForge", sizes: ["m","l"], deliveryDaysMin: 4, deliveryDaysMax: 7, waterproof: true } },
    { id: "am-boots-1", title: "FrostGrip Boots", category: "boots", price: 249, currency: "USD", shop: "alpineMart", attributes: { color: "black", brand: "RidgeWorks", sizes: ["8","9","10","11"], deliveryDaysMin: 3, deliveryDaysMax: 5, waterproof: true } },
    { id: "am-boots-2", title: "SummitLock Boots", category: "boots", price: 279, currency: "USD", shop: "alpineMart", attributes: { color: "green", brand: "AlpinePro", sizes: ["7","8","9"], deliveryDaysMin: 5, deliveryDaysMax: 8, waterproof: false } },
    { id: "am-gloves-1", title: "SummitGrip Gloves", category: "gloves", price: 89, currency: "USD", shop: "alpineMart", attributes: { color: "red", brand: "AlpinePro", sizes: ["s","m","l"], deliveryDaysMin: 2, deliveryDaysMax: 3, waterproof: true } },
    { id: "am-gloves-2", title: "FrostLock Gloves", category: "gloves", price: 74, currency: "USD", shop: "alpineMart", attributes: { color: "blue", brand: "ColdTrail", sizes: ["s","m","l","xl"], deliveryDaysMin: 3, deliveryDaysMax: 6, waterproof: true } },
    { id: "am-base-1", title: "ThermoCore Base Top", category: "baseLayer", price: 79, currency: "USD", shop: "alpineMart", attributes: { color: "black", brand: "GlacierWool", sizes: ["s","m","l"], deliveryDaysMin: 1, deliveryDaysMax: 3, waterproof: false } },
    { id: "am-base-2", title: "ThermoCore Base Bottom", category: "baseLayer", price: 69, currency: "USD", shop: "alpineMart", attributes: { color: "black", brand: "GlacierWool", sizes: ["s","m","l","xl"], deliveryDaysMin: 1, deliveryDaysMax: 3, waterproof: false } },
  ],
  snowBase: [
    { id: "sb-jacket-1", title: "NorthWind Jacket", category: "jacket", price: 299, currency: "USD", shop: "snowBase", attributes: { color: "black", brand: "IceForge", sizes: ["m","l","xl"], deliveryDaysMin: 4, deliveryDaysMax: 9, waterproof: true } },
    { id: "sb-jacket-2", title: "DriftGuard Jacket", category: "jacket", price: 249, currency: "USD", shop: "snowBase", attributes: { color: "green", brand: "SnowPulse", sizes: ["s","m","l"], deliveryDaysMin: 3, deliveryDaysMax: 6, waterproof: true } },
    { id: "sb-pants-1", title: "TrailFlex Pants", category: "pants", price: 189, currency: "USD", shop: "snowBase", attributes: { color: "black", brand: "RidgeWorks", sizes: ["s","m","l"], deliveryDaysMin: 2, deliveryDaysMax: 4, waterproof: true } },
    { id: "sb-pants-2", title: "DriftGuard Pants", category: "pants", price: 179, currency: "USD", shop: "snowBase", attributes: { color: "blue", brand: "SnowPulse", sizes: ["m","l"], deliveryDaysMin: 4, deliveryDaysMax: 7, waterproof: false } },
    { id: "sb-boots-1", title: "IceTrack Boots", category: "boots", price: 239, currency: "USD", shop: "snowBase", attributes: { color: "black", brand: "IceForge", sizes: ["8","9","10"], deliveryDaysMin: 2, deliveryDaysMax: 6, waterproof: true } },
    { id: "sb-boots-2", title: "SummitRise Boots", category: "boots", price: 259, currency: "USD", shop: "snowBase", attributes: { color: "yellow", brand: "PeakWear", sizes: ["7","8","9","10"], deliveryDaysMin: 5, deliveryDaysMax: 8, waterproof: false } },
    { id: "sb-gloves-1", title: "PolarShield Gloves", category: "gloves", price: 95, currency: "USD", shop: "snowBase", attributes: { color: "black", brand: "RidgeWorks", sizes: ["s","m","l"], deliveryDaysMin: 4, deliveryDaysMax: 6, waterproof: true } },
    { id: "sb-gloves-2", title: "AlpineLite Gloves", category: "gloves", price: 69, currency: "USD", shop: "snowBase", attributes: { color: "white", brand: "PeakWear", sizes: ["s","m","l","xl"], deliveryDaysMin: 2, deliveryDaysMax: 4, waterproof: false } },
    { id: "sb-base-1", title: "HeatFlex Base Top", category: "baseLayer", price: 64, currency: "USD", shop: "snowBase", attributes: { color: "black", brand: "PeakWear", sizes: ["s","m","l","xl"], deliveryDaysMin: 1, deliveryDaysMax: 2, waterproof: false } },
    { id: "sb-base-2", title: "HeatFlex Base Bottom", category: "baseLayer", price: 58, currency: "USD", shop: "snowBase", attributes: { color: "black", brand: "PeakWear", sizes: ["s","m","l","xl"], deliveryDaysMin: 1, deliveryDaysMax: 2, waterproof: false } },
  ],
  peakShop: [
    { id: "ps-jacket-1", title: "StormShield Jacket", category: "jacket", price: 279, currency: "USD", shop: "peakShop", attributes: { color: "black", brand: "NorthPeak", sizes: ["s","m","l","xl"], deliveryDaysMin: 2, deliveryDaysMax: 4, waterproof: true } },
    { id: "ps-jacket-2", title: "SummitArc Jacket", category: "jacket", price: 269, currency: "USD", shop: "peakShop", attributes: { color: "red", brand: "AlpinePro", sizes: ["s","m","l"], deliveryDaysMin: 3, deliveryDaysMax: 5, waterproof: true } },
    { id: "ps-pants-1", title: "SummitTrack Pants", category: "pants", price: 205, currency: "USD", shop: "peakShop", attributes: { color: "black", brand: "GlacierWool", sizes: ["s","m","l"], deliveryDaysMin: 3, deliveryDaysMax: 6, waterproof: true } },
    { id: "ps-pants-2", title: "IceTrack Pants", category: "pants", price: 189, currency: "USD", shop: "peakShop", attributes: { color: "blue", brand: "RidgeWorks", sizes: ["m","l","xl"], deliveryDaysMin: 4, deliveryDaysMax: 7, waterproof: false } },
    { id: "ps-boots-1", title: "RidgeLock Boots", category: "boots", price: 269, currency: "USD", shop: "peakShop", attributes: { color: "black", brand: "RidgeWorks", sizes: ["8","9","10","11"], deliveryDaysMin: 2, deliveryDaysMax: 5, waterproof: true } },
    { id: "ps-boots-2", title: "AlpineRise Boots", category: "boots", price: 289, currency: "USD", shop: "peakShop", attributes: { color: "white", brand: "AlpinePro", sizes: ["7","8","9"], deliveryDaysMin: 5, deliveryDaysMax: 9, waterproof: false } },
    { id: "ps-gloves-1", title: "ColdTrail Gloves", category: "gloves", price: 79, currency: "USD", shop: "peakShop", attributes: { color: "blue", brand: "ColdTrail", sizes: ["s","m","l"], deliveryDaysMin: 2, deliveryDaysMax: 4, waterproof: true } },
    { id: "ps-gloves-2", title: "SummitGrip Gloves", category: "gloves", price: 92, currency: "USD", shop: "peakShop", attributes: { color: "black", brand: "AlpinePro", sizes: ["s","m","l","xl"], deliveryDaysMin: 3, deliveryDaysMax: 6, waterproof: true } },
    { id: "ps-base-1", title: "MerinoWarm Base Top", category: "baseLayer", price: 85, currency: "USD", shop: "peakShop", attributes: { color: "black", brand: "NordicMerino", sizes: ["s","m","l","xl"], deliveryDaysMin: 1, deliveryDaysMax: 3, waterproof: false } },
    { id: "ps-base-2", title: "MerinoWarm Base Bottom", category: "baseLayer", price: 75, currency: "USD", shop: "peakShop", attributes: { color: "black", brand: "NordicMerino", sizes: ["s","m","l","xl"], deliveryDaysMin: 1, deliveryDaysMax: 3, waterproof: false } },
  ],
};

// ===== SEARCH AGENT =====
const CATEGORY_ORDER = ["jacket", "pants", "boots", "gloves", "baseLayer"];
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

function queryShop(shop: ShopId, categories: string[], budget?: { currency: string; max: number }, deadline?: string, attributes?: Record<string, AttributeValue>): SearchItem[] {
  const items = CATALOG[shop] ?? [];
  const deadlineDate = deadline ? parseDate(deadline) : null;
  // Try with attributes, then without color, then without brand, then bare
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

function searchAgent(input: { budget?: { currency: string; max: number }; deadline?: string; preferences?: Record<string, unknown>; mustHaves?: string[]; niceToHaves?: string[] }): { items: SearchItem[] } {
  const prefColor = toLower(input.preferences?.color);
  const prefBrand = toLower(input.preferences?.brand);
  const attrs: Record<string, AttributeValue> = {};
  if (prefColor) attrs.color = prefColor;
  if (prefBrand) attrs.brand = prefBrand;
  const prefSize = toLower(input.preferences?.size);
  if (prefSize) attrs.size = prefSize;

  const allItems: SearchItem[] = [];
  for (const shop of SHOPS) {
    allItems.push(...queryShop(shop, CATEGORY_ORDER, input.budget, input.deadline, Object.keys(attrs).length > 0 ? attrs : undefined));
  }

  // Rank and dedupe per category
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

// ===== ASSEMBLING OUTFITS =====
const REQUIRED_CATEGORIES = ["jacket", "pants", "boots", "gloves", "baseLayer"];

function assembleOutfits(items: SearchItem[], budget?: { currency: string; max: number }): { outfitOptions: OutfitOption[]; infeasibleReason?: string } {
  if (items.length === 0) return { outfitOptions: [], infeasibleReason: "No items found" };

  const grouped: Record<string, SearchItem[]> = {};
  for (const item of items) { if (!grouped[item.category]) grouped[item.category] = []; grouped[item.category].push(item); }

  const missing = REQUIRED_CATEGORIES.find(c => !grouped[c]?.length);
  if (missing) return { outfitOptions: [], infeasibleReason: `Missing category: ${missing}` };

  // Pick top 3 per category, build combinations (limited)
  const topK: Record<string, SearchItem[]> = {};
  for (const cat of REQUIRED_CATEGORIES) {
    topK[cat] = (grouped[cat] ?? []).slice(0, 3);
  }

  const combos: SearchItem[][] = [];
  const MAX = 100;
  const bt = (idx: number, curr: SearchItem[]) => {
    if (combos.length >= MAX) return;
    if (idx === REQUIRED_CATEGORIES.length) { combos.push([...curr]); return; }
    for (const item of topK[REQUIRED_CATEGORIES[idx]]) { curr.push(item); bt(idx + 1, curr); curr.pop(); if (combos.length >= MAX) return; }
  };
  bt(0, []);

  const budgetMax = budget?.max ?? Infinity;
  const currency = budget?.currency ?? "USD";
  const feasible = combos
    .map(c => ({ items: c, total: c.reduce((s, i) => s + i.price, 0) }))
    .filter(c => c.total <= budgetMax)
    .sort((a, b) => a.total - b.total)
    .slice(0, 5);

  if (feasible.length === 0) return { outfitOptions: [], infeasibleReason: "No outfit fits under budget" };

  return {
    outfitOptions: feasible.map(f => ({
      id: f.items.map(i => i.id).sort().join("|"),
      items: f.items.map(i => ({ itemId: i.id })),
      totalPrice: { currency, amount: f.total },
    })),
  };
}

// ===== RANKING ENGINE =====
function extractWords(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 1));
}

function computeScore(outfit: OutfitOption, allOutfits: OutfitOption[], userPrompt?: string, items?: SearchItem[], budgetMax?: number): number {
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

async function generateExplanation(userPrompt: string, outfitDesc: string): Promise<string> {
  try {
    const res = await fetch(`https://iqbsjfvmutibnnxvvxyi.supabase.co/functions/v1/ai-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a fashion assistant. In 2-3 short sentences, give a friendly opinion on how well this outfit matches the user's request. Be concise." },
          { role: "user", content: `User request: "${userPrompt}"\n\nOutfit: ${outfitDesc}\n\nBrief opinion:` },
        ],
        max_tokens: 100,
        temperature: 0.5,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "This outfit matches your criteria well.";
  } catch (e) {
    console.error("[outfit-pipeline] AI explanation error:", e);
    return "This outfit was selected as the best match for your preferences.";
  }
}

async function rankOutfits(outfitOptions: OutfitOption[], items: SearchItem[], userPrompt?: string, budgetMax?: number): Promise<{ ranked: RankedOutfit[]; recommendedOutfitId?: string }> {
  const scored = outfitOptions.map(o => ({ outfit: o, score: computeScore(o, outfitOptions, userPrompt, items, budgetMax) })).sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);

  const ranked: RankedOutfit[] = await Promise.all(top3.map(async ({ outfit, score }) => {
    let explanation: string;
    if (userPrompt?.trim() && items.length) {
      const desc = outfit.items.map(({ itemId }) => { const i = items.find(x => x.id === itemId); return i ? `${i.category}: ${i.title} (${i.shop}, $${i.price})` : ""; }).filter(Boolean).join(". ");
      explanation = await generateExplanation(userPrompt, desc);
    } else {
      explanation = `Price: $${outfit.totalPrice.amount}. Score: ${score}.`;
    }
    return { outfitId: outfit.id, score, explanation };
  }));

  return { ranked, recommendedOutfitId: ranked[0]?.outfitId };
}

// ===== MAIN HANDLER =====
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { normalizedRequest, userPrompt } = await req.json();
    if (!normalizedRequest) {
      return new Response(JSON.stringify({ error: "Missing normalizedRequest" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log("[outfit-pipeline] Starting pipeline...");

    // 1. Search
    const searchResult = searchAgent({
      budget: normalizedRequest.budget ?? undefined,
      deadline: normalizedRequest.deliveryDeadline ?? undefined,
      preferences: { color: normalizedRequest.preferences?.color ?? undefined },
      mustHaves: normalizedRequest.mustHaves,
      niceToHaves: normalizedRequest.niceToHaves,
    });

    console.log("[outfit-pipeline] Search found", searchResult.items.length, "items");

    if (searchResult.items.length === 0) {
      return new Response(JSON.stringify({ items: [], outfitOptions: [], ranked: [], infeasibleReason: "No items found matching your criteria" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Assemble
    const assembleResult = assembleOutfits(searchResult.items, normalizedRequest.budget ?? undefined);
    console.log("[outfit-pipeline] Assembled", assembleResult.outfitOptions.length, "outfits");

    if (assembleResult.outfitOptions.length === 0) {
      return new Response(JSON.stringify({ items: searchResult.items, outfitOptions: [], ranked: [], infeasibleReason: assembleResult.infeasibleReason }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Rank
    const rankResult = await rankOutfits(assembleResult.outfitOptions, searchResult.items, userPrompt, normalizedRequest.budget?.max);
    console.log("[outfit-pipeline] Ranked, recommended:", rankResult.recommendedOutfitId);

    return new Response(JSON.stringify({
      items: searchResult.items,
      outfitOptions: assembleResult.outfitOptions,
      ranked: rankResult.ranked,
      recommendedOutfitId: rankResult.recommendedOutfitId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error("[outfit-pipeline] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
