import { Product, ProductCategory } from "@/types";

// Generate placeholder image URLs using category-based colors
function categoryImage(category: ProductCategory, color: string): string {
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

export const mockOutfit: Record<ProductCategory, Product> = {
  jacket: {
    id: "j1",
    name: "Summit Pro Shell Jacket",
    category: "jacket",
    price: 349,
    size: "L",
    color: "Navy",
    brand: "Arc'teryx",
    description: "Waterproof GORE-TEX shell with helmet-compatible hood",
    imageUrl: categoryImage("jacket", "navy"),
  },
  pants: {
    id: "p1",
    name: "Alpine Insulated Pants",
    category: "pants",
    price: 229,
    size: "L",
    color: "Black",
    brand: "Spyder",
    description: "Insulated ski pants with articulated knees",
    imageUrl: categoryImage("pants", "black"),
  },
  gloves: {
    id: "g1",
    name: "Fission SV Gloves",
    category: "gloves",
    price: 89,
    size: "L",
    color: "Black",
    brand: "Arc'teryx",
    description: "Waterproof insulated gloves with removable liner",
    imageUrl: categoryImage("gloves", "black"),
  },
  baselayer: {
    id: "b1",
    name: "HeatTech Ultra Warm Top",
    category: "baselayer",
    price: 49,
    size: "L",
    color: "Black",
    brand: "Uniqlo",
    description: "Moisture-wicking thermal baselayer",
    imageUrl: categoryImage("baselayer", "black"),
  },
  boots: {
    id: "bt1",
    name: "Hawx Prime 110 S",
    category: "boots",
    price: 399,
    size: "10",
    color: "Black",
    brand: "Atomic",
    description: "All-mountain performance boot with GripWalk soles",
    imageUrl: categoryImage("boots", "black"),
  },
  base_bottom: {
    id: "bb1",
    name: "Rho LT Bottom",
    category: "base_bottom",
    price: 120,
    size: "L",
    color: "Black",
    brand: "Arc'teryx",
    description: "Lightweight merino baselayer bottom",
    imageUrl: categoryImage("base_bottom", "black"),
  },
};

export const mockAlternatives: Record<ProductCategory, Product[]> = {
  jacket: [
    { id: "j2", name: "Beta AR Jacket", category: "jacket", price: 299, size: "L", color: "Black", brand: "Arc'teryx", description: "Versatile all-round shell", imageUrl: categoryImage("jacket", "black") },
    { id: "j3", name: "Titan Jacket", category: "jacket", price: 279, size: "L", color: "Blue", brand: "Spyder", description: "Lightweight insulated jacket", imageUrl: categoryImage("jacket", "blue") },
    { id: "j4", name: "McMurdo Parka", category: "jacket", price: 319, size: "L", color: "Green", brand: "The North Face", description: "Down insulated parka", imageUrl: categoryImage("jacket", "green") },
  ],
  pants: [
    { id: "p2", name: "Dare Pants", category: "pants", price: 199, size: "L", color: "Black", brand: "Spyder", description: "Durable ski pants", imageUrl: categoryImage("pants", "black") },
    { id: "p3", name: "Sabre Pant", category: "pants", price: 249, size: "L", color: "Red", brand: "Arc'teryx", description: "Freeride ski pant", imageUrl: categoryImage("pants", "red") },
  ],
  gloves: [
    { id: "g2", name: "Overweb GTX Gloves", category: "gloves", price: 79, size: "L", color: "Red", brand: "Spyder", description: "GORE-TEX ski gloves", imageUrl: categoryImage("gloves", "red") },
    { id: "g3", name: "Traverse GTX Gloves", category: "gloves", price: 69, size: "L", color: "Gray", brand: "Spyder", description: "Versatile winter gloves", imageUrl: categoryImage("gloves", "gray") },
  ],
  baselayer: [
    { id: "b2", name: "Rho LT Bottom", category: "baselayer", price: 59, size: "L", color: "Black", brand: "Arc'teryx", description: "Lightweight merino bottom", imageUrl: categoryImage("baselayer", "black") },
  ],
  boots: [
    { id: "bt2", name: "Speedmachine 110", category: "boots", price: 379, size: "10", color: "Black", brand: "Nordica", description: "All-mountain boot", imageUrl: categoryImage("boots", "black") },
  ],
  base_bottom: [
    { id: "bb2", name: "Momentum Baselayer Pants", category: "base_bottom", price: 80, size: "L", color: "Black", brand: "Spyder", description: "Stretch baselayer bottom", imageUrl: categoryImage("base_bottom", "black") },
  ],
};
