import OwnerOrderCard from "./OwnerOrderCard.jsx";

export default function OrderList({ orders, onOpenDetail }) {
  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">No orders yet &#127850;</p>
        <p className="empty-state__subtitle">New customer orders will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="owner-order-list">
      {orders.map((order) => (
        <OwnerOrderCard order={order} key={order.id} onOpenDetail={onOpenDetail} />
      ))}
    </div>
  );
}
