export default function QuantityControl({ quantity, onIncrement, onDecrement, label }) {
  const ariaLabel = label ? `${label} quantity` : "Quantity";

  return (
    <div className="qty-control" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className="qty-btn qty-btn--minus"
        onClick={onDecrement}
        disabled={quantity <= 0}
        aria-label={`Decrease ${ariaLabel}`}
      >
        &minus;
      </button>
      <span className="qty-value" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className="qty-btn qty-btn--plus"
        onClick={onIncrement}
        aria-label={`Increase ${ariaLabel}`}
      >
        +
      </button>
    </div>
  );
}
