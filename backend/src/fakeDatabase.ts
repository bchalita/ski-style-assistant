/**
 * - Input format: { apiRequests: Array<{ shop: string, query: { categories?: string[], keywords?: string[], priceMax?: number, attributes?: Record<string, string | number | boolean> } }> } // expects at least 3 distinct shops
 * - Output format: { items: Array<{ id: string, title: string, category: string, price: number, currency: string, shop: string, url?: string, attributes?: Record<string, string | number | boolean> }> }
 * - Communicates with: searchAgent.ts (receives simulated API requests; returns items)
 */

import { AttributeValue, SearchItem, ShopId } from "./searchAgent";

export type FakeDbQuery = {
  categories?: string[];
  keywords?: string[];
  priceMax?: number;
  attributes?: Record<string, AttributeValue>;
};

export type FakeDbInput = {
  apiRequests: Array<{ shop: string; query: FakeDbQuery }>;
};

export type FakeDbOutput = { items: SearchItem[] };

const CATALOG: Record<ShopId, SearchItem[]> = {
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

const toLower = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return value.trim().toLowerCase();
};

const includesKeyword = (text: string, keywords: string[]): boolean => {
  const haystack = text.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
};

const matchesAttributes = (
  item: SearchItem,
  attributes?: Record<string, AttributeValue>
): boolean => {
  if (!attributes) return true;
  const itemAttrs = item.attributes ?? {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue;
    const itemValue = itemAttrs[key];
    if (key === "size") {
      const size = toLower(value);
      const sizes = itemAttrs.sizes;
      const list = Array.isArray(sizes) ? sizes : sizes ? [sizes] : [];
      if (!list.some((entry) => toLower(entry) === size)) return false;
      continue;
    }
    if (typeof value === "string") {
      if (toLower(itemValue) !== toLower(value)) return false;
      continue;
    }
    if (itemValue !== value) return false;
  }

  return true;
};

const queryCatalog = (shop: ShopId, query: FakeDbQuery): SearchItem[] => {
  const items = CATALOG[shop] ?? [];
  const categories = query.categories ?? [];
  const keywords = (query.keywords ?? []).map((word) => word.toLowerCase());
  const priceMax = query.priceMax;

  return items.filter((item) => {
    if (categories.length > 0 && !categories.includes(item.category)) {
      return false;
    }
    if (typeof priceMax === "number" && item.price > priceMax) {
      return false;
    }
    if (keywords.length > 0) {
      const searchable = [
        item.title,
        item.category,
        String(item.attributes?.brand ?? ""),
      ].join(" ");
      if (!includesKeyword(searchable, keywords)) return false;
    }
    return matchesAttributes(item, query.attributes);
  });
};

export const fakeDatabase = (input: FakeDbInput): FakeDbOutput => {
  const items: SearchItem[] = [];
  for (const request of input.apiRequests) {
    if (!(request.shop in CATALOG)) continue;
    items.push(...queryCatalog(request.shop as ShopId, request.query));
  }
  return { items };
};

const isVitest = typeof process !== "undefined" && process.env.VITEST;

void (async () => {
  if (!isVitest) return;
  // @ts-expect-error - vitest types provided at test time
  const { describe, expect, it } = await import("vitest");

  describe("fakeDatabase", () => {
    it("filters by shop, category, price, and attributes", () => {
      const result = fakeDatabase({
        apiRequests: [
          {
            shop: "alpineMart",
            query: {
              categories: ["jacket"],
              priceMax: 300,
              attributes: { color: "black", size: "m" },
            },
          },
        ],
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every((item) => item.shop === "alpineMart")).toBe(
        true
      );
      expect(result.items.every((item) => item.category === "jacket")).toBe(
        true
      );
      expect(result.items.every((item) => item.price <= 300)).toBe(true);
      expect(
        result.items.every((item) => item.attributes?.color === "black")
      ).toBe(true);
    });
  });
})();
