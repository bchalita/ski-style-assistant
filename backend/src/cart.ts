/**
 * - Input format: { selection: { outfitId: string, itemIds: string[] }, user?: { userId?: string }, currency?: string }
 * - Output format: { cartId: string, lineItems: Array<{ itemId: string, quantity: number }>, totals?: { currency: string, subtotal: number, tax?: number, shipping?: number, total: number } }
 * - Communicates with: rankingEngine.ts (receives selection), checkout.ts (provides cart for checkout)
 */

// --- Step 1: Types, createCartFromSelection, getCart ---

/** One line item in the cart */
export interface LineItem {
  itemId: string;
  quantity: number;
}

/** Cart totals */
export interface CartTotals {
  currency: string;
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
}

/** Full cart representation */
export interface Cart {
  cartId: string;
  lineItems: LineItem[];
  totals?: CartTotals;
}

/** Input to createCartFromSelection */
export interface CreateCartInput {
  selection: { outfitId: string; itemIds: string[]; subtotal?: number };
  user?: { userId?: string };
  currency?: string;
}

/** In-memory store: cartId -> Cart (MVP; later: DB) */
const cartStore = new Map<string, Cart>();

/** Simple ID generator (timestamp + random for uniqueness) */
function generateCartId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates a cart from an outfit selection.
 * - Each item gets quantity 1.
 * - Totals: subtotal from selection.subtotal or 0, tax/shipping as placeholders.
 */
export function createCartFromSelection(input: CreateCartInput): Cart {
  const { selection, currency = "USD" } = input;
  const { outfitId: _outfitId, itemIds, subtotal = 0 } = selection;

  const lineItems: LineItem[] = itemIds.map((itemId) => ({ itemId, quantity: 1 }));

  const tax = 0;
  const shipping = 0;
  const total = subtotal + tax + shipping;

  const totals: CartTotals = {
    currency,
    subtotal,
    tax,
    shipping,
    total,
  };

  const cartId = generateCartId();
  const cart: Cart = { cartId, lineItems, totals };

  cartStore.set(cartId, cart);
  return cart;
}

/**
 * Returns a cart by ID, or null if not found.
 */
export function getCart(cartId: string): Cart | null {
  return cartStore.get(cartId) ?? null;
}
