/**
 * Opens Razorpay's Checkout modal (loaded via the <script> tag in
 * index.html - Razorpay requires their hosted script, not an
 * npm-bundled copy). Isolated here the same way utils/tokenCaller.js
 * isolates browser speech synthesis, so the payment UI wiring in
 * OrderSummary.jsx stays simple.
 */
export function openRazorpayCheckout({ razorpayOrderId, amount, currency, keyId, onSuccess, onDismiss }) {
  if (typeof window === "undefined" || !window.Razorpay) {
    throw new Error(
      "Razorpay checkout couldn't load. Check your internet connection and try again."
    );
  }

  const rzp = new window.Razorpay({
    key: keyId,
    order_id: razorpayOrderId,
    amount,
    currency,
    name: "Chocolicious Davangere",
    description: "Order payment",
    theme: { color: "#d4a24c" },
    handler: (response) => {
      onSuccess({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      },
    },
  });

  rzp.on("payment.failed", (response) => {
    if (onDismiss) onDismiss(response.error?.description || "Payment failed.");
  });

  rzp.open();
}
