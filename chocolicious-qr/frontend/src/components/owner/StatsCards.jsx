import { formatPrice } from "../../utils/formatPrice.js";

export default function StatsCards({ stats }) {
  const cards = [
    { label: "Today's Orders", value: stats.orders_today },
    { label: "Today's Sales", value: formatPrice(stats.sales_today) },
  ];

  return (
    <div className="stats-cards">
      {cards.map((card) => (
        <div className="stat-card" key={card.label}>
          <span className="stat-card__value">{card.value}</span>
          <span className="stat-card__label">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
