// Loads product catalog from CSV files in public/data/ (sourced from data/ folder)

export type AttributeValue = string | number | boolean | string[];

export interface SearchItem {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  shop: string;
  url?: string;
  attributes?: Record<string, AttributeValue>;
}

export type ShopId = "alpineMart" | "snowBase" | "peakShop";

const SHOPS: { shop: ShopId; file: string }[] = [
  { shop: "alpineMart", file: "/data/retailer_alpineMart.csv" },
  { shop: "snowBase", file: "/data/retailer_snowBase.csv" },
  { shop: "peakShop", file: "/data/retailer_peakShop.csv" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategory(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === "base_top") return "baselayer";
  if (t === "base_bottom") return "base_bottom";
  return t;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseCsvToCatalog(csv: string, shop: ShopId): SearchItem[] {
  const lines = csv.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map(h => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const grouped = new Map<string, SearchItem>();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const itemName = fields[idx("item")]?.trim() || "";
    const brand = fields[idx("brand")]?.trim() || "";
    const category = normalizeCategory(fields[idx("category")] || "");
    const deliveryDays = Number(fields[idx("time_of_delivery_days")] || 0);
    const price = Number(fields[idx("price")] || 0);
    const size = fields[idx("size")]?.trim() || "";
    const color = fields[idx("color")]?.trim().toLowerCase() || "";
    const style = fields[idx("style")]?.trim() || "";
    const warmth = Number(fields[idx("warmth")] || 0);
    const waterproofRating = Number(fields[idx("waterproof")] || 0);
    const url = fields[idx("url")]?.trim() || "";
    const image = fields[idx("image")]?.trim() || "";

    if (!itemName || !brand || !category || !price) continue;

    const key = [itemName, brand, category, color, style, price, image].join("|");
    const id = slugify(`${shop}-${itemName}-${color}-${style}`.slice(0, 60));

    if (!grouped.has(key)) {
      const attributes: Record<string, AttributeValue> = {
        color,
        brand,
        style,
        sizes: [] as string[],
        deliveryDaysMin: deliveryDays,
        deliveryDaysMax: deliveryDays,
        warmth,
        waterproofRating,
        waterproof: waterproofRating > 0,
      };
      if (image) attributes.image = image;

      grouped.set(key, {
        id,
        title: itemName,
        category,
        price,
        currency: "USD",
        shop,
        url: url || undefined,
        attributes,
      });
    }

    const item = grouped.get(key)!;
    const sizes = item.attributes!.sizes as string[];
    if (size && !sizes.includes(size)) sizes.push(size);
    const curMin = item.attributes!.deliveryDaysMin as number;
    const curMax = item.attributes!.deliveryDaysMax as number;
    if (deliveryDays < curMin) item.attributes!.deliveryDaysMin = deliveryDays;
    if (deliveryDays > curMax) item.attributes!.deliveryDaysMax = deliveryDays;
  }

  return Array.from(grouped.values());
}

let catalogCache: Record<ShopId, SearchItem[]> | null = null;

export async function loadCatalog(): Promise<Record<ShopId, SearchItem[]>> {
  if (catalogCache) return catalogCache;

  const catalog: Record<ShopId, SearchItem[]> = {
    alpineMart: [],
    snowBase: [],
    peakShop: [],
  };

  await Promise.all(
    SHOPS.map(async ({ shop, file }) => {
      try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
        const csv = await res.text();
        catalog[shop] = parseCsvToCatalog(csv, shop);
        console.log(`[catalog] Loaded ${catalog[shop].length} items from ${shop}`);
      } catch (err) {
        console.error(`[catalog] Error loading ${file}:`, err);
      }
    })
  );

  catalogCache = catalog;
  return catalog;
}
