import { formatPrice } from "../utils/formatPrice.js";

const TYPE_LABEL = {
  DINE_IN: "Dine In",
  PARCEL: "Parcel",
};

export default function OrderConfirmation({ order, onOrderAgain }) {
  return (
    <div className="confirmation-screen">
      <div className="confirmation-screen__content">
        <p className="confirmation-screen__eyebrow">Order Confirmed &#127881;</p>

        <p className="confirmation-screen__token-label">Your Token</p>
        <p className="confirmation-screen__token">{order.token_number}</p>

        <span className="confirmation-screen__type">{TYPE_LABEL[order.order_type] ?? order.order_type}</span>

        <p className="confirmation-screen__hint">
          Please wait for your order. Listen for your token number when it&rsquo;s ready.
        </p>

        <div className="confirmation-screen__summary">
          {order.items.map((item) => (
            <div className="confirmation-screen__line" key={item.id}>
              <span>
                {item.product_name}
                {item.variant_name ? ` (${item.variant_name})` : ""} &times; {item.quantity}
              </span>
              <span>{formatPrice(item.line_total)}</span>
            </div>
          ))}
          <div className="confirmation-screen__total">
            <span>Total</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        <button type="button" className="summary-continue" onClick={onOrderAgain}>
          Order Again
        </button>
      </div>
    </div>
  );
}
