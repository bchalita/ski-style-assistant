import type { BackendItem } from "@/types";

export type { BackendItem };

// Helper to get Supabase functions URL and key
function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Backend not configured. Please refresh the page.");
  }
  return { url, key };
}

async function invokeEdgeFunction(functionName: string, body: unknown) {
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${functionName} failed (${res.status}): ${text}`);
  }
  return res.json();
}

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
  return invokeEdgeFunction("request-agent", { userRequest, context });
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
  return invokeEdgeFunction("outfit-pipeline", { normalizedRequest, userPrompt });
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
