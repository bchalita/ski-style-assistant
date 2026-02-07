import { fakeDatabase, FakeDbInput } from "./fakeDatabase";
import { assembleOutfits, AssembleInput } from "./assemblingOutfit";
import type { SearchInput } from "./searchAgent";

const SHOPS = ["alpineMart", "snowBase", "peakShop"] as const;
const REQUIRED_CATEGORIES = ["jacket", "pants", "boots", "gloves", "baseLayer"];

const searchInput: SearchInput = {
  budget: { currency: "USD", max: 1500 },
  deadline: "2026-02-10",
  preferences: { color: "black", size: "9" },
  mustHaves: [],
  niceToHaves: ["waterproof"],
};

const requestedShops = Array.isArray(searchInput.preferences?.shops)
  ? searchInput.preferences?.shops.filter((shop) =>
      SHOPS.includes(shop as (typeof SHOPS)[number])
    )
  : [...SHOPS];

const baseAttributes: Record<string, string | number | boolean> = {};
if (searchInput.preferences?.color) {
  baseAttributes.color = searchInput.preferences.color;
}
if (searchInput.preferences?.brand) {
  baseAttributes.brand = searchInput.preferences.brand;
}

const sizePreference = searchInput.preferences?.size;
const bootCategories = ["boots"];
const nonBootCategories = REQUIRED_CATEGORIES.filter(
  (category) => category !== "boots"
);

const apiRequests: FakeDbInput["apiRequests"] = [];
for (const shop of requestedShops) {
  if (sizePreference) {
    apiRequests.push({
      shop,
      query: {
        categories: bootCategories,
        priceMax: searchInput.budget?.max,
        attributes: { ...baseAttributes, size: sizePreference },
      },
    });
  }
  apiRequests.push({
    shop,
    query: {
      categories: nonBootCategories,
      priceMax: searchInput.budget?.max,
      attributes: baseAttributes,
    },
  });
}

const dbInput: FakeDbInput = { apiRequests };

const dbOutput = fakeDatabase(dbInput);

const assembleInput: AssembleInput = {
  items: dbOutput.items,
  constraints: {
    budget: searchInput.budget,
    mustHaves: searchInput.mustHaves,
    niceToHaves: searchInput.niceToHaves,
  },
};

const assembleOutput = assembleOutfits(assembleInput);

// Logs for each layer (search input -> db -> assembly -> output)
console.log("searchAgent input:");
console.log(JSON.stringify(searchInput, null, 2));
console.log("\nDB input:");
console.log(JSON.stringify(dbInput, null, 2));
console.log("\nDB output (items count):", dbOutput.items.length);
console.log(JSON.stringify(dbOutput, null, 2));
console.log("\nAssembly input:");
console.log(JSON.stringify(assembleInput, null, 2));
console.log("\nAssembly output:");
console.log(JSON.stringify(assembleOutput, null, 2));
