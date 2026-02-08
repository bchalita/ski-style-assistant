import { realDatabase, RealDbInput } from "./RealDatabase";
import { assembleOutfits, AssembleInput } from "./assemblingOutfit";
import { rankOutfits } from "./rankingEngine";
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
  baseAttributes.color = searchInput.preferences.color as string;
}
if (searchInput.preferences?.brand) {
  baseAttributes.brand = searchInput.preferences.brand as string;
}

const sizePreference = searchInput.preferences?.size;
const bootCategories = ["boots"];
const nonBootCategories = REQUIRED_CATEGORIES.filter(
  (category) => category !== "boots"
);

const apiRequests: RealDbInput["apiRequests"] = [];

let bootAttributes: Record<string, string | number | boolean> = {
  ...baseAttributes,
};
if (sizePreference) bootAttributes.size = sizePreference;

// If no boots match the preferred color+size, relax color just for boots.
let relaxedBootColor = false;
if (bootAttributes.color && sizePreference) {
  const bootCheck = realDatabase({
    apiRequests: requestedShops.map((shop) => ({
      shop,
      query: {
        categories: bootCategories,
        priceMax: searchInput.budget?.max,
        attributes: bootAttributes,
      },
    })),
  }).items;
  if (bootCheck.length === 0) {
    const { color, ...rest } = bootAttributes;
    bootAttributes = { ...rest };
    relaxedBootColor = true;
  }
}

for (const shop of requestedShops) {
  if (sizePreference) {
    apiRequests.push({
      shop,
      query: {
        categories: bootCategories,
        priceMax: searchInput.budget?.max,
        attributes: bootAttributes,
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

const dbInput: RealDbInput = { apiRequests };

const dbOutput = realDatabase(dbInput);

const assembleInput: AssembleInput = {
  items: dbOutput.items.map((item) => ({
    ...item,
    attributes: item.attributes as Record<string, string | number | boolean>,
  })),
  constraints: {
    budget: searchInput.budget,
    mustHaves: searchInput.mustHaves,
    niceToHaves: searchInput.niceToHaves,
  },
};

const assembleOutput = assembleOutfits(assembleInput);

const rankingInput = {
  outfitOptions: assembleOutput.outfitOptions,
  scoringConfig: { budget: searchInput.budget?.max },
  userPrompt: "Black ski outfit size 9 boots, budget 1500",
  items: dbOutput.items,
};

const run = async () => {
  const rankingOutput = await rankOutfits(rankingInput);

  // Logs for each layer (search input -> db -> assembly -> ranking)
  console.log("searchAgent input:");
  console.log(JSON.stringify(searchInput, null, 2));
  console.log("\nDB input:");
  console.log(JSON.stringify(dbInput, null, 2));
  if (relaxedBootColor) {
    console.log("\nNote: boot color preference relaxed to find matches.");
  }
  console.log("\nDB output (items count):", dbOutput.items.length);
  console.log(JSON.stringify(dbOutput, null, 2));
  console.log("\nAssembly input:");
  console.log(JSON.stringify(assembleInput, null, 2));
  console.log("\nAssembly output:");
  console.log(JSON.stringify(assembleOutput, null, 2));
  console.log("\nRanking input:");
  console.log(JSON.stringify(rankingInput, null, 2));
  console.log("\nRanking output:");
  console.log(JSON.stringify(rankingOutput, null, 2));
};

void run();
