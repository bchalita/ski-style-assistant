const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
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

export function callRequestAgent(
  userRequest: string,
  context?: {
    previousMessages?: string[];
    previousOutput?: RequestAgentOutput;
  }
): Promise<RequestAgentOutput> {
  return post("/api/request-agent", { userRequest, context });
}

// --- Outfit Pipeline ---

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

export function callOutfitPipeline(
  normalizedRequest: RequestAgentOutput,
  userPrompt?: string
): Promise<OutfitPipelineResult> {
  return post("/api/outfits", { normalizedRequest, userPrompt });
}

// --- Cart ---

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

export function callCreateCart(selection: {
  outfitId?: string;
  itemIds: string[];
  subtotal?: number;
}): Promise<CartResult> {
  return post("/api/cart", { selection });
}

// --- Checkout ---

export interface CheckoutResult {
  orderId: string;
  status: "confirmed" | "failed";
  receiptUrl?: string;
  message?: string;
}

export function callCheckout(data: {
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
  return post("/api/checkout", data);
}
