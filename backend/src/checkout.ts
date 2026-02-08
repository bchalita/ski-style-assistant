/**
 * Checkout module — simulates payment processing and order confirmation.
 *
 * Input: { cartId, payment: { provider, token }, shipping: { name, address1, city, region?, postalCode, country }, contact?: { email?, phone? } }
 * Output: { orderId, status: "confirmed" | "failed", receiptUrl?, message? }
 */

import { getCart } from "./cart";

export interface CheckoutInput {
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
}

export interface CheckoutOutput {
  orderId: string;
  status: "confirmed" | "failed";
  receiptUrl?: string;
  message?: string;
}

function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function checkout(input: CheckoutInput): Promise<CheckoutOutput> {
  // Validate cart exists
  if (!input.cartId) {
    return { orderId: "", status: "failed", message: "Missing cartId" };
  }

  const cart = getCart(input.cartId);
  if (!cart) {
    return { orderId: "", status: "failed", message: "Cart not found" };
  }

  if (cart.lineItems.length === 0) {
    return { orderId: "", status: "failed", message: "Cart is empty" };
  }

  // Validate shipping
  const { shipping } = input;
  if (!shipping?.name || !shipping?.address1 || !shipping?.city || !shipping?.postalCode || !shipping?.country) {
    return { orderId: "", status: "failed", message: "Incomplete shipping address" };
  }

  // Validate payment
  if (!input.payment?.provider || !input.payment?.token) {
    return { orderId: "", status: "failed", message: "Missing payment information" };
  }

  // Simulate payment processing (always succeeds for now)
  const orderId = generateOrderId();

  return {
    orderId,
    status: "confirmed",
    receiptUrl: `https://alpine-gear.example/receipts/${orderId}`,
    message: `Order confirmed! ${cart.lineItems.length} items will be shipped to ${shipping.name} at ${shipping.city}, ${shipping.country}.`,
  };
}
