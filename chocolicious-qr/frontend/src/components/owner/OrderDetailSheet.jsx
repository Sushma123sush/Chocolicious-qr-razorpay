import { useOrders } from "../../context/OrderContext.jsx";
import { formatPrice } from "../../utils/formatPrice.js";
import OrderTypeBadge from "./OrderTypeBadge.jsx";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function OrderDetailSheet({ order, onClose }) {
  const { readyAndCallToken, callingOrderId, calledOrderId } = useOrders();

  if (!order) return null;

  const isCalling = callingOrderId === order.id;
  const justCalled = calledOrderId === order.id;

  const handleReady = () => {
    readyAndCallToken(order);
  };

  return (
    <div className="summary-overlay" role="dialog" aria-modal="true" aria-label={`Order ${order.token_number} details`}>
      <button
        type="button"
        className="summary-overlay__backdrop"
        aria-label="Close order details"
        onClick={onClose}
      />
      <div className="summary-sheet owner-detail-sheet">
        <div className="summary-sheet__handle" aria-hidden="true" />
        <div className="summary-sheet__header">
          <div>
            <p className="owner-detail-sheet__token-label">Token</p>
            <h2 className="owner-detail-sheet__token">{order.token_number}</h2>
          </div>
          <button type="button" className="summary-sheet__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="owner-detail-sheet__meta">
          <OrderTypeBadge orderType={order.order_type} />
          <span className="owner-detail-sheet__time">{formatTime(order.created_at)}</span>
        </div>

        <h3 className="owner-detail-sheet__section-title">Order Items</h3>
        <div className="summary-list">
          {order.items.map((item) => (
            <div className="summary-line" key={item.id}>
              <div className="summary-line__info">
                <div className="summary-line__name">
                  {item.product_name}
                  {item.variant_name && <span className="summary-line__variant"> &middot; {item.variant_name}</span>}
                </div>
                <div className="summary-line__unit">
                  {formatPrice(item.unit_price)} &times; {item.quantity}
                </div>
              </div>
              <div className="summary-line__subtotal">{formatPrice(item.line_total)}</div>
            </div>
          ))}
        </div>

        <div className="summary-total">
          <span>Total</span>
          <span>{formatPrice(order.total_amount)}</span>
        </div>

        <div className="owner-detail-sheet__actions">
          {justCalled ? (
            <div className="owner-card__called-flag" role="status">
              &#10003; Token {order.token_number} Called
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--full"
              onClick={handleReady}
              disabled={isCalling}
            >
              {isCalling ? "Marking Ready\u2026" : "Ready & Call Token \u{1F50A}"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
