import { describe, expect, it } from "vitest";
import { assembleOutfits, Item, REQUIRED_CATEGORIES } from "./assemblingOutfit";

const baseItems: Item[] = [
  {
    id: "j1",
    title: "Jacket One",
    category: "jacket",
    price: 200,
    currency: "USD",
    shop: "alpineMart",
    attributes: { waterproof: true },
  },
  {
    id: "p1",
    title: "Pants One",
    category: "pants",
    price: 150,
    currency: "USD",
    shop: "alpineMart",
    attributes: { waterproof: true },
  },
  {
    id: "b1",
    title: "Boots One",
    category: "boots",
    price: 180,
    currency: "USD",
    shop: "alpineMart",
    attributes: { waterproof: true },
  },
  {
    id: "g1",
    title: "Gloves One",
    category: "gloves",
    price: 60,
    currency: "USD",
    shop: "alpineMart",
    attributes: { waterproof: true },
  },
  {
    id: "bl1",
    title: "Base Layer One",
    category: "baseLayer",
    price: 40,
    currency: "USD",
    shop: "alpineMart",
    attributes: { waterproof: true },
  },
];

describe("assembleOutfits", () => {
  it("returns infeasibleReason when category missing", () => {
    const items = baseItems.filter((item) => item.category !== "boots");
    const result = assembleOutfits({ items });
    expect(result.outfitOptions.length).toBe(0);
    expect(result.infeasibleReason).toBe("Missing required category: boots");
  });

  it("filters by must-haves and respects budget", () => {
    const result = assembleOutfits({
      items: baseItems,
      constraints: {
        budget: { currency: "USD", max: 700 },
        mustHaves: ["waterproof"],
      },
    });

    expect(result.outfitOptions.length).toBeGreaterThan(0);
    const outfit = result.outfitOptions[0];
    const total = outfit.totalPrice.amount;
    expect(total).toBeLessThanOrEqual(700);
    expect(outfit.items.length).toBe(REQUIRED_CATEGORIES.length);
  });
});
