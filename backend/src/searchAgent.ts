/**
 * - Input format: { budget?: { currency: string, max: number }, deadline?: string, preferences?: Record<string, string | number | boolean>, mustHaves?: string[], niceToHaves?: string[] }
 * - Output format: { items: Array<{ id: string, title: string, category: string, price: number, currency: string, shop: string, url?: string, attributes?: Record<string, string | number | boolean> }>, missingInfo?: string[], queryMeta?: { requestedShops: string[], attemptedRequests: number } }
 * - Communicates with: requestAgent.ts (receives normalized request / may ask for missing info), fakeDatabase.ts (requests items; simulates API requests for >= 3 shops), assemblingOutfit.ts (passes items forward)
 */

export type SearchInput = {
  budget?: { currency: string; max: number };
  deadline?: string;
  preferences?: Record<string, string | number | boolean>;
  mustHaves?: string[];
  niceToHaves?: string[];
};

export type SearchItem = {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  shop: string;
  url?: string;
  attributes?: Record<string, string | number | boolean>;
};

export type SearchOutput = {
  items: Array<{
    id: string;
    title: string;
    category: string;
    price: number;
    currency: string;
    shop: string;
    url?: string;
    attributes?: Record<string, string | number | boolean>;
  }>;
  missingInfo?: string[];
  queryMeta?: { requestedShops: string[]; attemptedRequests: number };
};

export type ShopId = "alpineMart" | "snowBase" | "peakShop";

type ShopQuery = {
  categories: string[];
  budget?: { currency: string; max: number };
  deadline?: string;
  preferences: Record<string, string | number | boolean>;
  mustHaves: string[];
  niceToHaves: string[];
};

const BASE_DATE = "2026-02-01";
const SHOPS: ShopId[] = ["alpineMart", "snowBase", "peakShop"];

export const CATALOG: Record<ShopId, SearchItem[]> = {
  alpineMart: [
    {
      id: "am-jacket-1",
      title: "Aurora Shell Jacket",
      category: "jacket",
      price: 289,
      currency: "USD",
      shop: "alpineMart",
      url: "https://example.com/am/aurora-shell-jacket",
      attributes: {
        color: "black",
        brand: "NorthPeak",
        sizes: ["s", "m", "l"],
        deliveryDaysMin: 2,
        deliveryDaysMax: 5,
        waterproof: true,
      },
    },
    {
      id: "am-jacket-2",
      title: "Summit Insulated Jacket",
      category: "jacket",
      price: 319,
      currency: "USD",
      shop: "alpineMart",
      url: "https://example.com/am/summit-insulated-jacket",
      attributes: {
        color: "blue",
        brand: "GlacierWool",
        sizes: ["m", "l", "xl"],
        deliveryDaysMin: 3,
        deliveryDaysMax: 6,
        waterproof: false,
      },
    },
    {
      id: "am-pants-1",
      title: "RidgeLine Pants",
      category: "pants",
      price: 199,
      currency: "USD",
      shop: "alpineMart",
      url: "https://example.com/am/ridgeline-pants",
      attributes: {
        color: "black",
        brand: "NorthPeak",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 2,
        deliveryDaysMax: 4,
        waterproof: true,
      },
    },
    {
      id: "am-pants-2",
      title: "GlacierEdge Pants",
      category: "pants",
      price: 219,
      currency: "USD",
      shop: "alpineMart",
      url: "https://example.com/am/glacieredge-pants",
      attributes: {
        color: "white",
        brand: "IceForge",
        sizes: ["m", "l"],
        deliveryDaysMin: 4,
        deliveryDaysMax: 7,
        waterproof: true,
      },
    },
    {
      id: "am-boots-1",
      title: "FrostGrip Boots",
      category: "boots",
      price: 249,
      currency: "USD",
      shop: "alpineMart",
      attributes: {
        color: "black",
        brand: "RidgeWorks",
        sizes: ["8", "9", "10", "11"],
        deliveryDaysMin: 3,
        deliveryDaysMax: 5,
        waterproof: true,
      },
    },
    {
      id: "am-boots-2",
      title: "SummitLock Boots",
      category: "boots",
      price: 279,
      currency: "USD",
      shop: "alpineMart",
      attributes: {
        color: "green",
        brand: "AlpinePro",
        sizes: ["7", "8", "9"],
        deliveryDaysMin: 5,
        deliveryDaysMax: 8,
        waterproof: false,
      },
    },
    {
      id: "am-gloves-1",
      title: "SummitGrip Gloves",
      category: "gloves",
      price: 89,
      currency: "USD",
      shop: "alpineMart",
      attributes: {
        color: "red",
        brand: "AlpinePro",
        sizes: ["s", "m", "l"],
        deliveryDaysMin: 2,
        deliveryDaysMax: 3,
        waterproof: true,
      },
    },
    {
      id: "am-gloves-2",
      title: "FrostLock Gloves",
      category: "gloves",
      price: 74,
      currency: "USD",
      shop: "alpineMart",
      attributes: {
        color: "blue",
        brand: "ColdTrail",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 3,
        deliveryDaysMax: 6,
        waterproof: true,
      },
    },
    {
      id: "am-base-1",
      title: "ThermoCore Base Top",
      category: "baseLayer",
      price: 79,
      currency: "USD",
      shop: "alpineMart",
      attributes: {
        color: "black",
        brand: "GlacierWool",
        sizes: ["s", "m", "l"],
        deliveryDaysMin: 1,
        deliveryDaysMax: 3,
        waterproof: false,
      },
    },
    {
      id: "am-base-2",
      title: "ThermoCore Base Bottom",
      category: "baseLayer",
      price: 69,
      currency: "USD",
      shop: "alpineMart",
      attributes: {
        color: "black",
        brand: "GlacierWool",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 1,
        deliveryDaysMax: 3,
        waterproof: false,
      },
    },
  ],
  snowBase: [
    {
      id: "sb-jacket-1",
      title: "NorthWind Jacket",
      category: "jacket",
      price: 299,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "black",
        brand: "IceForge",
        sizes: ["m", "l", "xl"],
        deliveryDaysMin: 4,
        deliveryDaysMax: 9,
        waterproof: true,
      },
    },
    {
      id: "sb-jacket-2",
      title: "DriftGuard Jacket",
      category: "jacket",
      price: 249,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "green",
        brand: "SnowPulse",
        sizes: ["s", "m", "l"],
        deliveryDaysMin: 3,
        deliveryDaysMax: 6,
        waterproof: true,
      },
    },
    {
      id: "sb-pants-1",
      title: "TrailFlex Pants",
      category: "pants",
      price: 189,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "black",
        brand: "RidgeWorks",
        sizes: ["s", "m", "l"],
        deliveryDaysMin: 2,
        deliveryDaysMax: 4,
        waterproof: true,
      },
    },
    {
      id: "sb-pants-2",
      title: "DriftGuard Pants",
      category: "pants",
      price: 179,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "blue",
        brand: "SnowPulse",
        sizes: ["m", "l"],
        deliveryDaysMin: 4,
        deliveryDaysMax: 7,
        waterproof: false,
      },
    },
    {
      id: "sb-boots-1",
      title: "IceTrack Boots",
      category: "boots",
      price: 239,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "black",
        brand: "IceForge",
        sizes: ["8", "9", "10"],
        deliveryDaysMin: 2,
        deliveryDaysMax: 6,
        waterproof: true,
      },
    },
    {
      id: "sb-boots-2",
      title: "SummitRise Boots",
      category: "boots",
      price: 259,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "yellow",
        brand: "PeakWear",
        sizes: ["7", "8", "9", "10"],
        deliveryDaysMin: 5,
        deliveryDaysMax: 8,
        waterproof: false,
      },
    },
    {
      id: "sb-gloves-1",
      title: "PolarShield Gloves",
      category: "gloves",
      price: 95,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "black",
        brand: "RidgeWorks",
        sizes: ["s", "m", "l"],
        deliveryDaysMin: 4,
        deliveryDaysMax: 6,
        waterproof: true,
      },
    },
    {
      id: "sb-gloves-2",
      title: "AlpineLite Gloves",
      category: "gloves",
      price: 69,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "white",
        brand: "PeakWear",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 2,
        deliveryDaysMax: 4,
        waterproof: false,
      },
    },
    {
      id: "sb-base-1",
      title: "HeatFlex Base Top",
      category: "baseLayer",
      price: 64,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "black",
        brand: "PeakWear",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 1,
        deliveryDaysMax: 2,
        waterproof: false,
      },
    },
    {
      id: "sb-base-2",
      title: "HeatFlex Base Bottom",
      category: "baseLayer",
      price: 58,
      currency: "USD",
      shop: "snowBase",
      attributes: {
        color: "black",
        brand: "PeakWear",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 1,
        deliveryDaysMax: 2,
        waterproof: false,
      },
    },
  ],
  peakShop: [
    {
      id: "ps-jacket-1",
      title: "StormShield Jacket",
      category: "jacket",
      price: 279,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "black",
        brand: "NorthPeak",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 2,
        deliveryDaysMax: 4,
        waterproof: true,
      },
    },
    {
      id: "ps-jacket-2",
      title: "SummitArc Jacket",
      category: "jacket",
      price: 269,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "red",
        brand: "AlpinePro",
        sizes: ["s", "m", "l"],
        deliveryDaysMin: 3,
        deliveryDaysMax: 5,
        waterproof: true,
      },
    },
    {
      id: "ps-pants-1",
      title: "SummitTrack Pants",
      category: "pants",
      price: 205,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "black",
        brand: "GlacierWool",
        sizes: ["s", "m", "l"],
        deliveryDaysMin: 3,
        deliveryDaysMax: 6,
        waterproof: true,
      },
    },
    {
      id: "ps-pants-2",
      title: "IceTrack Pants",
      category: "pants",
      price: 189,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "blue",
        brand: "RidgeWorks",
        sizes: ["m", "l", "xl"],
        deliveryDaysMin: 4,
        deliveryDaysMax: 7,
        waterproof: false,
      },
    },
    {
      id: "ps-boots-1",
      title: "RidgeLock Boots",
      category: "boots",
      price: 269,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "black",
        brand: "RidgeWorks",
        sizes: ["8", "9", "10", "11"],
        deliveryDaysMin: 2,
        deliveryDaysMax: 5,
        waterproof: true,
      },
    },
    {
      id: "ps-boots-2",
      title: "AlpineRise Boots",
      category: "boots",
      price: 289,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "white",
        brand: "AlpinePro",
        sizes: ["7", "8", "9"],
        deliveryDaysMin: 5,
        deliveryDaysMax: 9,
        waterproof: false,
      },
    },
    {
      id: "ps-gloves-1",
      title: "ColdTrail Gloves",
      category: "gloves",
      price: 79,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "blue",
        brand: "ColdTrail",
        sizes: ["s", "m", "l"],
        deliveryDaysMin: 2,
        deliveryDaysMax: 4,
        waterproof: true,
      },
    },
    {
      id: "ps-gloves-2",
      title: "SummitGrip Gloves",
      category: "gloves",
      price: 92,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "black",
        brand: "AlpinePro",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 3,
        deliveryDaysMax: 6,
        waterproof: true,
      },
    },
    {
      id: "ps-base-1",
      title: "MerinoWarm Base Top",
      category: "baseLayer",
      price: 85,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "black",
        brand: "NordicMerino",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 1,
        deliveryDaysMax: 3,
        waterproof: false,
      },
    },
    {
      id: "ps-base-2",
      title: "MerinoWarm Base Bottom",
      category: "baseLayer",
      price: 75,
      currency: "USD",
      shop: "peakShop",
      attributes: {
        color: "black",
        brand: "NordicMerino",
        sizes: ["s", "m", "l", "xl"],
        deliveryDaysMin: 1,
        deliveryDaysMax: 3,
        waterproof: false,
      },
    },
  ],
};

const CATEGORY_ORDER = ["jacket", "pants", "boots", "gloves", "baseLayer"];

const isValidShopId = (value: string): value is ShopId =>
  SHOPS.includes(value as ShopId);

const toLowerString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return value.trim().toLowerCase();
};

const normalizeInput = (input: SearchInput): ShopQuery => {
  const preferences = { ...(input.preferences ?? {}) };
  const normalized: ShopQuery = {
    categories: CATEGORY_ORDER.slice(),
    budget: input.budget,
    deadline: input.deadline,
    preferences,
    mustHaves: input.mustHaves ?? [],
    niceToHaves: input.niceToHaves ?? [],
  };

  const color = toLowerString(preferences.color);
  if (color) preferences.color = color;
  const brand = toLowerString(preferences.brand);
  if (brand) preferences.brand = brand;
  const size = toLowerString(preferences.size);
  if (size) preferences.size = size;

  return normalized;
};

const getMissingInfo = (input: ShopQuery): string[] => {
  const missing: string[] = [];
  if (!input.budget?.currency || typeof input.budget.max !== "number") {
    missing.push("budget");
  }
  if (!input.deadline) missing.push("deadline");
  if (!input.preferences.color) missing.push("preferences.color");
  if (!input.preferences.size) missing.push("preferences.size");
  return missing;
};

const parseDate = (value: string): Date | null => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (base: string, days: number): Date | null => {
  const date = parseDate(base);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const queryShop = (shop: ShopId, query: ShopQuery): SearchItem[] => {
  const items = CATALOG[shop] ?? [];
  const budget = query.budget;
  const deadline = query.deadline ? parseDate(query.deadline) : null;
  const prefColor = toLowerString(query.preferences.color);
  const prefBrand = toLowerString(query.preferences.brand);
  const prefSize = toLowerString(query.preferences.size);

  return items.filter((item) => {
    if (!query.categories.includes(item.category)) return false;
    if (budget) {
      if (item.currency !== budget.currency) return false;
      if (item.price > budget.max) return false;
    }
    const attributes = item.attributes ?? {};
    if (prefColor && toLowerString(attributes.color) !== prefColor) return false;
    if (prefBrand && toLowerString(attributes.brand) !== prefBrand) return false;
    if (prefSize) {
      const sizes = attributes.sizes;
      const sizeList = Array.isArray(sizes) ? sizes : [sizes];
      const hasSize = sizeList.some(
        (size) => toLowerString(size) === prefSize
      );
      if (!hasSize) return false;
    }
    if (deadline) {
      const deliveryDaysMax = Number(attributes.deliveryDaysMax);
      const arrival = addDays(BASE_DATE, deliveryDaysMax);
      if (!arrival || arrival > deadline) return false;
    }
    return true;
  });
};

const scoreItem = (item: SearchItem, input: ShopQuery): number => {
  let score = 0;
  const attributes = item.attributes ?? {};
  const prefColor = toLowerString(input.preferences.color);
  const prefBrand = toLowerString(input.preferences.brand);

  if (prefColor && toLowerString(attributes.color) === prefColor) score += 30;
  if (prefBrand && toLowerString(attributes.brand) === prefBrand) score += 15;

  if (
    input.mustHaves.includes("waterproof") &&
    attributes.waterproof === true
  ) {
    score += 20;
  }

  for (const nice of input.niceToHaves) {
    if (nice === "waterproof" && attributes.waterproof === true) {
      score += 5;
    }
  }

  if (input.budget?.max) {
    const priceFactor = 10 * (1 - item.price / input.budget.max);
    score += Math.min(10, Math.max(0, priceFactor));
  }

  return score;
};

const rankItems = (items: SearchItem[], input: ShopQuery): SearchItem[] =>
  items
    .slice()
    .sort((a, b) => {
      const scoreDiff = scoreItem(b, input) - scoreItem(a, input);
      if (scoreDiff !== 0) return scoreDiff;
      if (a.price !== b.price) return a.price - b.price;
      return a.id.localeCompare(b.id);
    });

export const searchAgent = (input: SearchInput): SearchOutput => {
  const normalized = normalizeInput(input);
  const missing = getMissingInfo(normalized);
  if (missing.length > 0) {
    return {
      items: [],
      missingInfo: missing,
      queryMeta: { requestedShops: [], attemptedRequests: 0 },
    };
  }

  const prefShops = normalized.preferences.shops;
  const requestedShops = Array.isArray(prefShops)
    ? prefShops.filter((shop) => typeof shop === "string").filter(isValidShopId)
    : SHOPS.slice();

  let attemptedRequests = 0;
  const allItems: SearchItem[] = [];

  for (const shop of requestedShops) {
    attemptedRequests += 1;
    allItems.push(...queryShop(shop, normalized));
  }

  const ranked = rankItems(allItems, normalized);
  const items: SearchItem[] = [];

  for (const category of CATEGORY_ORDER) {
    const categoryItems = ranked.filter((item) => item.category === category);
    items.push(...categoryItems.slice(0, 10));
  }

  return { items, queryMeta: { requestedShops, attemptedRequests } };
};

const isVitest = typeof process !== "undefined" && process.env.VITEST;

void (async () => {
  if (!isVitest) return;
  const { describe, expect, it } = await import("vitest");

  describe("searchAgent", () => {
    it("returns missing info when required fields absent", () => {
      const result = searchAgent({ budget: { currency: "USD", max: 400 } });
      expect(result.items.length).toBe(0);
      expect(result.missingInfo).toEqual(
        expect.arrayContaining([
          "deadline",
          "preferences.color",
          "preferences.size",
        ])
      );
      expect(result.queryMeta?.attemptedRequests).toBe(0);
    });

    it("returns deterministic results and queries >= 3 shops", () => {
      const envBudget = Number(process.env.TEST_BUDGET_MAX);
      const budgetMax = Number.isFinite(envBudget) ? envBudget : 400;
      const input: SearchInput = {
        budget: { currency: "USD", max: budgetMax },
        deadline: "2026-02-10",
        preferences: { color: "black", size: "m" },
      };
      const first = searchAgent(input);
      const second = searchAgent(input);
      if (process.env.PRINT_OUTPUT === "1") {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(first, null, 2));
      }
      expect(first.queryMeta?.requestedShops.length).toBeGreaterThanOrEqual(3);
      expect(first.queryMeta?.attemptedRequests).toBe(
        first.queryMeta?.requestedShops.length
      );
      const categories = new Set(first.items.map((item) => item.category));
      expect(categories.size).toBeGreaterThan(1);
      expect(first).toEqual(second);
    });

    it("respects shop restriction", () => {
      const input: SearchInput = {
        budget: { currency: "USD", max: 400 },
        deadline: "2026-02-10",
        preferences: { color: "black", size: "m", shops: ["snowBase"] },
      };
      const result = searchAgent(input);
      expect(result.queryMeta?.requestedShops).toEqual(["snowBase"]);
      expect(result.queryMeta?.attemptedRequests).toBe(1);
    });

    it("filters by deadline deterministically", () => {
      const input: SearchInput = {
        budget: { currency: "USD", max: 400 },
        deadline: "2026-02-03",
        preferences: { color: "black", size: "m" },
      };
      const result = searchAgent(input);
      expect(
        result.items.find((item) => item.id === "sb-jacket-1")
      ).toBeUndefined();
    });
  });
})();

