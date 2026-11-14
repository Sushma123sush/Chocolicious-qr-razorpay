export default function RecentlyReady({ orders }) {
  if (orders.length === 0) return null;

  return (
    <div className="recently-ready">
      <h3 className="recently-ready__title">Recently Ready</h3>
      <ul className="recently-ready__list">
        {orders.map((order) => (
          <li key={order.id} className="recently-ready__item">
            &#10003; Token {order.token_number} &mdash; Ready
          </li>
        ))}
      </ul>
    </div>
  );
}
