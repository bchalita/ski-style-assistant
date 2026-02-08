// API layer - now uses local modules instead of Supabase edge functions

export { callRequestAgent } from "./localRequestAgent";
export type { RequestAgentOutput, RequestAgentItems } from "./localRequestAgent";
export { callOutfitPipeline } from "./localOutfitPipeline";
export type { OutfitPipelineResult, OutfitOptionBackend, RankedOutfit } from "./localOutfitPipeline";

// Re-export BackendItem for compatibility
export type { BackendItem } from "@/types";

// --- Cart (kept for future use) ---

export interface CartResult {
  cartId: string;
  lineItems: Array<{ itemId: string; quantity: number }>;
  totals?: {
    currency: string;
    subtotal: number;
    tax?: number;
    shipping?: number;
    total: number;
  };
}

export async function callCreateCart(_selection: {
  outfitId?: string;
  itemIds: string[];
  subtotal?: number;
}): Promise<CartResult> {
  throw new Error("Cart not yet implemented");
}

// --- Checkout ---

export interface CheckoutResult {
  orderId: string;
  status: "confirmed" | "failed";
  receiptUrl?: string;
  message?: string;
}

export async function callCheckout(_data: {
  cartId: string;
  payment: { provider: string; token: string };
  shipping: {
    name: string;
    address1: string;
    city: string;
    region?: string;
    postalCode: string;
    country: string;
  };
  contact?: { email?: string; phone?: string };
}): Promise<CheckoutResult> {
  throw new Error("Checkout not yet implemented");
}
