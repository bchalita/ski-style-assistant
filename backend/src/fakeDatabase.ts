/**
 * - Input format: { apiRequests: Array<{ shop: string, query: { categories?: string[], keywords?: string[], priceMax?: number, attributes?: Record<string, string | number | boolean> } }> } // expects at least 3 distinct shops
 * - Output format: { items: Array<{ id: string, title: string, category: string, price: number, currency: string, shop: string, url?: string, attributes?: Record<string, string | number | boolean> }> }
 * - Communicates with: searchAgent.ts (receives simulated API requests; returns items)
 */

import { CATALOG, SearchItem, ShopId } from "./searchAgent";

export type FakeDbQuery = {
  categories?: string[];
  keywords?: string[];
  priceMax?: number;
  attributes?: Record<string, string | number | boolean>;
};

export type FakeDbInput = {
  apiRequests: Array<{ shop: string; query: FakeDbQuery }>;
};

export type FakeDbOutput = { items: SearchItem[] };

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
  attributes?: Record<string, string | number | boolean>
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
