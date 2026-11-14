import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/formatPrice.js";

export default function CartBar({ onView }) {
  const { totalItems, totalPrice } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="cart-bar">
      <button type="button" className="cart-bar__button" onClick={onView}>
        <span className="cart-bar__count">
          {totalItems} item{totalItems > 1 ? "s" : ""}
        </span>
        <span className="cart-bar__total">{formatPrice(totalPrice)}</span>
        <span className="cart-bar__cta">View order &rarr;</span>
      </button>
    </div>
  );
}
