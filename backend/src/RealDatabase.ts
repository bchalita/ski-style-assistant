import fs from "fs";
import path from "path";

import { AttributeValue, SearchItem, ShopId } from "./searchAgent";

export type RealDbQuery = {
  categories?: string[];
  keywords?: string[];
  priceMax?: number;
  attributes?: Record<string, AttributeValue>;
};

export type RealDbInput = {
  apiRequests: Array<{ shop: string; query: RealDbQuery }>;
};

export type RealDbOutput = { items: SearchItem[] };

const SHOPS: ShopId[] = ["alpineMart", "snowBase", "peakShop"];

const CATALOG_FILES: Array<{ shop: ShopId; path: string }> = [
  {
    shop: "alpineMart",
    path: path.resolve(__dirname, "../../data/retailer_alpineMart.csv"),
  },
  {
    shop: "snowBase",
    path: path.resolve(__dirname, "../../data/retailer_snowBase.csv"),
  },
  {
    shop: "peakShop",
    path: path.resolve(__dirname, "../../data/retailer_peakShop.csv"),
  },
];

const normalizeCategory = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "base_top" || trimmed === "base_bottom" || trimmed === "base") {
    return "baseLayer";
  }
  return trimmed;
};

const normalizeCurrency = () => "USD";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");


const parseCsv = (content: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        currentField += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      currentRow.push(currentField);
      if (currentRow.some((field) => field.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
};

const buildCatalogForShop = (
  shop: ShopId,
  csvPath: string
): SearchItem[] => {
  const csv = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(csv);
  const [headerRow, ...dataRows] = rows;
  const header = headerRow.map((value) => value.trim());
  const headerIndex = new Map(header.map((value, idx) => [value, idx]));

  const get = (row: string[], key: string): string =>
    row[headerIndex.get(key) ?? -1] ?? "";

  const grouped = new Map<string, SearchItem>();

  for (const row of dataRows) {
    const itemName = get(row, "item").trim();
    const brand = get(row, "brand").trim();
    const category = normalizeCategory(get(row, "category"));
    const gender = get(row, "gender").trim();
    const deliveryDays = Number(get(row, "time_of_delivery_days"));
    const price = Number(get(row, "price"));
    const size = get(row, "size").trim();
    const color = get(row, "color").trim().toLowerCase();
    const style = get(row, "style").trim();
    const warmth = Number(get(row, "warmth"));
    const waterproofRating = Number(get(row, "waterproof"));
    const url = get(row, "url").trim();
    const image = get(row, "image").trim();

    if (!itemName || !brand || !category) continue;

    const key = [
      itemName,
      brand,
      category,
      gender,
      color,
      style,
      price,
      url,
      image,
    ].join("|");

    const id = slugify(`${itemName}-${brand}-${color}-${style}-${gender}`);

    if (!grouped.has(key)) {
      const attributes: Record<string, AttributeValue> = {
        color,
        brand,
        gender,
        style,
        sizes: [],
        deliveryDaysMin: deliveryDays,
        deliveryDaysMax: deliveryDays,
        warmth,
        waterproofRating,
        waterproof: waterproofRating > 0,
      };
      if (image) {
        attributes.image = path.join("data", image);
      }

      grouped.set(key, {
        id,
        title: itemName,
        category,
        price,
        currency: normalizeCurrency(),
        shop,
        url: url || undefined,
        attributes,
      });
    }

    const item = grouped.get(key);
    const sizes = item?.attributes?.sizes;
    if (item && Array.isArray(sizes) && size) {
      if (!sizes.includes(size)) sizes.push(size);
    }
  }

  return Array.from(grouped.values());
};

const buildCatalog = (): Record<ShopId, SearchItem[]> => {
  const catalog: Record<ShopId, SearchItem[]> = {
    alpineMart: [],
    snowBase: [],
    peakShop: [],
  };

  for (const entry of CATALOG_FILES) {
    if (!fs.existsSync(entry.path)) continue;
    catalog[entry.shop] = buildCatalogForShop(entry.shop, entry.path);
  }

  return catalog;
};

const CATALOG = buildCatalog();

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

const queryCatalog = (shop: ShopId, query: RealDbQuery): SearchItem[] => {
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

export const realDatabase = (input: RealDbInput): RealDbOutput => {
  const items: SearchItem[] = [];
  for (const request of input.apiRequests) {
    if (!SHOPS.includes(request.shop as ShopId)) continue;
    items.push(...queryCatalog(request.shop as ShopId, request.query));
  }
  return { items };
};
