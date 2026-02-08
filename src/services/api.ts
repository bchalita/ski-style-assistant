import type { BackendItem } from "@/types";

export type { BackendItem };

// Supabase config - these are publishable (public) keys, safe to store in code
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://iqbsjfvmutibnnxvvxyi.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYnNqZnZtdXRpYm5ueHZ2eHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTg3OTIsImV4cCI6MjA4NjA3NDc5Mn0.Lir5Bjs4SnvpVXqhvIqXPNH9MX6eqYnxqpaisJIgfDc";

async function invokeEdgeFunction(functionName: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
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
