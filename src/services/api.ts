import type { BackendItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export type { BackendItem };

// --- Request Agent ---

export interface RequestAgentItems {
  jackets: "yes" | "no" | "optional";
  pants: "yes" | "no" | "optional";
  baseLayer: "yes" | "no" | "optional";
  gloves: "yes" | "no" | "optional";
  boots: "yes" | "no" | "optional";
}

export interface RequestAgentOutput {
  budget: { currency: string; max: number } | null;
  deliveryDeadline: string | null;
  items: RequestAgentItems;
  preferences: { color: string | null };
  mustHaves: string[];
  niceToHaves: string[];
  clarifyingQuestion: string | null;
}

export async function callRequestAgent(
  userRequest: string,
  context?: {
    previousMessages?: string[];
    previousOutput?: RequestAgentOutput;
  }
): Promise<RequestAgentOutput> {
  const { data, error } = await supabase.functions.invoke("request-agent", {
    body: { userRequest, context },
  });
  if (error) throw new Error(error.message || "Request agent failed");
  return data;
}

// --- Outfit Pipeline ---

export interface OutfitOptionBackend {
  id: string;
  items: Array<{ itemId: string }>;
  totalPrice: { currency: string; amount: number };
  notes?: string[];
}

export interface RankedOutfit {
  outfitId: string;
  score: number;
  explanation: string;
}

export interface OutfitPipelineResult {
  items: BackendItem[];
  outfitOptions: OutfitOptionBackend[];
  ranked: RankedOutfit[];
  recommendedOutfitId?: string;
  infeasibleReason?: string;
}

export async function callOutfitPipeline(
  normalizedRequest: RequestAgentOutput,
  userPrompt?: string
): Promise<OutfitPipelineResult> {
  const { data, error } = await supabase.functions.invoke("outfit-pipeline", {
    body: { normalizedRequest, userPrompt },
  });
  if (error) throw new Error(error.message || "Outfit pipeline failed");
  return data;
}

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

export async function callCreateCart(selection: {
  outfitId?: string;
  itemIds: string[];
  subtotal?: number;
}): Promise<CartResult> {
  // Will be moved to edge function later
  throw new Error("Cart not yet implemented as edge function");
}

// --- Checkout ---

export interface CheckoutResult {
  orderId: string;
  status: "confirmed" | "failed";
  receiptUrl?: string;
  message?: string;
}

export async function callCheckout(data: {
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
  // Will be moved to edge function later
  throw new Error("Checkout not yet implemented as edge function");
}
