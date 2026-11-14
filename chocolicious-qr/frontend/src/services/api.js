// Base URL for the Flask API. In dev, Vite proxies /api to the Flask
// server (see vite.config.js), so a relative path works both in dev
// and once the frontend is built and served behind the same domain.
const API_BASE = "/api";

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    // Prefer the backend's own error message when there is one
    // (e.g. order validation errors), falling back to a generic one.
    let message = `Request to ${path} failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON - keep the generic message
    }
    throw new Error(message);
  }
  return res.json();
}

export function fetchMenu() {
  return request("/menu");
}

export function fetchShopConfig() {
  return request("/config");
}

// Places a real order (temporary demo flow - no payment yet). Kept for
// local dev/testing only - the backend gates this endpoint off by
// default now that payment exists (see backend/routes/orders.py).
export function placeOrder({ orderType, items }) {
  return request("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_type: orderType,
      items: items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    }),
  });
}

// Step 1 of the Razorpay flow: prices the cart server-side and opens a
// Razorpay Test Mode order for that amount. Returns what's needed to
// open Razorpay Checkout - never a key secret.
export function createPaymentOrder({ orderType, items }) {
  return request("/payments/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_type: orderType,
      items: items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    }),
  });
}

// Step 2: after Razorpay Checkout succeeds, hand its response back to
// the backend to verify the signature and create the real order/token.
export function verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  return request("/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    }),
  });
}
