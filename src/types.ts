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
