import { useOrders } from "../../context/OrderContext.jsx";
import { formatPrice } from "../../utils/formatPrice.js";
import OrderTypeBadge from "./OrderTypeBadge.jsx";

function timeAgo(isoString) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}

export default function OwnerOrderCard({ order, onOpenDetail }) {
  const { readyAndCallToken, callingOrderId, calledOrderId } = useOrders();
  const isCalling = callingOrderId === order.id;
  const justCalled = calledOrderId === order.id;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenDetail(order);
    }
  };

  const handleReady = (event) => {
    event.stopPropagation();
    readyAndCallToken(order);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`owner-card${justCalled ? " owner-card--called" : ""}`}
      onClick={() => onOpenDetail(order)}
      onKeyDown={handleKeyDown}
      aria-label={`Order for token ${order.token_number}, view details`}
    >
      <div className="owner-card__top">
        <div className="owner-card__token">
          <span className="owner-card__token-label">Token</span>
          <span className="owner-card__token-number">{order.token_number}</span>
        </div>
        <OrderTypeBadge orderType={order.order_type} />
      </div>

      <ul className="owner-card__items">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.product_name}
            {item.variant_name ? ` (${item.variant_name})` : ""} &times;{item.quantity}
          </li>
        ))}
      </ul>

      <div className="owner-card__bottom">
        <div className="owner-card__total">
          <span className="owner-card__total-label">Total</span>
          <span className="owner-card__total-value">{formatPrice(order.total_amount)}</span>
        </div>
        <span className="owner-card__time">{timeAgo(order.created_at)}</span>
      </div>

      <div className="owner-card__actions" onClick={(e) => e.stopPropagation()}>
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
  );
}
