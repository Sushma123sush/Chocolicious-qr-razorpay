const OPTIONS = [
  { value: "DINE_IN", label: "Dine In" },
  { value: "PARCEL", label: "Parcel" },
];

export default function OrderTypeSelect({ value, onChange }) {
  return (
    <div className="order-type-select" role="radiogroup" aria-label="Dine in or parcel">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`order-type-option${value === opt.value ? " order-type-option--active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
