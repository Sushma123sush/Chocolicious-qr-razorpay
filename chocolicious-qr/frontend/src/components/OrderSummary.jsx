import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import { createPaymentOrder, verifyPayment, fetchShopConfig } from "../services/api.js";
import { openRazorpayCheckout } from "../utils/razorpayCheckout.js";
import QuantityControl from "./QuantityControl.jsx";
import OrderTypeSelect from "./OrderTypeSelect.jsx";

export default function OrderSummary({ open, onClose, onOrderPlaced }) {
  const { items, totalItems, totalPrice, setQuantity, clearCart } = useCart();
  const [orderType, setOrderType] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [parcelCharge, setParcelCharge] = useState(0);

useEffect(() => {
  fetchShopConfig()
    .then((config) => setParcelCharge(config.parcel_charge))
    .catch(() => {});
}, []);

  if (!open) return null;

  const canPlaceOrder = totalItems > 0 && orderType !== null && !placing;
  const isParcel = orderType === "PARCEL";
  const grandTotal = totalPrice + (isParcel ? parcelCharge : 0);
  const handlePlaceOrder = async () => {
    if (!canPlaceOrder) return;
    setPlacing(true);
    setError(null);

    let paymentOrder;
    try {
      paymentOrder = await createPaymentOrder({ orderType, items });
    } catch (err) {
      setError(err.message);
      setPlacing(false);
      return;
    }

    try {
      openRazorpayCheckout({
        razorpayOrderId: paymentOrder.razorpay_order_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        keyId: paymentOrder.key_id,
        onSuccess: async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
          try {
            const order = await verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
            clearCart();
            setOrderType(null);
            onOrderPlaced(order);
          } catch (err) {
            setError(err.message);
          } finally {
            setPlacing(false);
          }
        },
        onDismiss: (message) => {
          if (message) setError(message);
          setPlacing(false);
        },
      });
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  };

  return (
    <div className="summary-overlay" role="dialog" aria-modal="true" aria-label="Your order">
      <button
        type="button"
        className="summary-overlay__backdrop"
        aria-label="Close order summary"
        onClick={onClose}
      />
      <div className="summary-sheet">
        <div className="summary-sheet__handle" aria-hidden="true" />
        <div className="summary-sheet__header">
          <h2>Your Order</h2>
          <button type="button" className="summary-sheet__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {items.length === 0 ? (
          <p className="summary-empty">Your cart is empty. Add something delicious!</p>
        ) : (
          <>
            <div className="summary-list">
              {items.map((item) => (
                <div className="summary-line" key={item.key}>
                  <div className="summary-line__info">
                    <div className="summary-line__name">
                      {item.productName}
                      {item.variantName && (
                        <span className="summary-line__variant"> &middot; {item.variantName}</span>
                      )}
                    </div>
                    <div className="summary-line__unit">{formatPrice(item.unitPrice)} each</div>
                  </div>
                  <div className="summary-line__controls">
                    <QuantityControl
                      quantity={item.quantity}
                      label={item.productName}
                      onIncrement={() => setQuantity(item, item.quantity + 1)}
                      onDecrement={() => setQuantity(item, item.quantity - 1)}
                    />
                    <div className="summary-line__subtotal">
                      {formatPrice(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

                        <div className="summary-total">
              <span>Items Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>

            <div className="summary-order-type">
              <p className="summary-order-type__label">Dine in or parcel?</p>
              <OrderTypeSelect value={orderType} onChange={setOrderType} />
            </div>

            {isParcel && parcelCharge > 0 && (
  <div className="summary-line">
    <span className="summary-line__name">Parcel charge</span>
    <span className="summary-line__subtotal">{formatPrice(parcelCharge)}</span>
  </div>
)}

{isParcel && (
  <div className="summary-total">
    <span>Total</span>
    <span>{formatPrice(grandTotal)}</span>
  </div>
)}

            {error && <p className="summary-error">{error}</p>}

            <button
              type="button"
              className="summary-continue"
              disabled={!canPlaceOrder}
              onClick={handlePlaceOrder}
            >
              {placing ? "Processing\u2026" : `Pay ${formatPrice(grandTotal)} & Place Order`}
            </button>
            <p className="summary-note">
              Payment is handled securely by Razorpay (Test Mode) &mdash; no real money is charged.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
