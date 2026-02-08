export type ProductCategory = "jacket" | "pants" | "gloves" | "baselayer" | "boots";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  size: string;
  color: string;
  brand: string;
  description: string;
  imageUrl: string;
  shop?: string;
}

export interface Constraints {
  budget?: number;
  size?: string;
  bootSize?: string;
  colors?: string[];
  brands?: string[];
  deliveryDate?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  quickReplies?: string[];
}

export type AppScreen = "chat" | "loading" | "results" | "checkout";

// --- Backend mapping ---

/** Matches the shape returned by the backend search agent */
export interface BackendItem {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  shop: string;
  url?: string;
  attributes?: Record<string, string | number | boolean | string[]>;
}

const CATEGORY_MAP: Record<string, ProductCategory> = {
  jacket: "jacket",
  pants: "pants",
  gloves: "gloves",
  baselayer: "baselayer",
  baseLayer: "baselayer",
  boots: "boots",
};

function categoryImage(category: string, color: string): string {
  const bgColors: Record<string, string> = {
    black: "1a1a2e",
    navy: "0a1628",
    red: "8b1a1a",
    blue: "1e3a5f",
    gray: "4a4a4a",
    white: "e8e8e8",
    green: "1a4a2e",
    orange: "8b4513",
  };
  const bg = bgColors[color.toLowerCase()] || "3a7bd5";
  const label = encodeURIComponent(`${category} - ${color}`);
  return `https://placehold.co/400x400/${bg}/ffffff?text=${label}`;
}

export function mapBackendItemToProduct(item: BackendItem): Product {
  const attrs = item.attributes ?? {};
  const color = String(attrs.color ?? "");
  const size = String(attrs.size ?? "");
  const brand = String(attrs.brand ?? "");
  const category = CATEGORY_MAP[item.category] ?? "jacket";
  const imageUrl = String(attrs.imageUrl ?? "") || categoryImage(category, color);

  return {
    id: item.id,
    name: item.title,
    category,
    price: item.price,
    size,
    color,
    brand,
    description: `${item.title} from ${item.shop}`,
    imageUrl,
    shop: item.shop,
  };
}
