import { useState } from "react";
import { OrderProvider, useOrders } from "../../context/OrderContext.jsx";
import DashboardHeader from "../../components/owner/DashboardHeader.jsx";
import StatsCards from "../../components/owner/StatsCards.jsx";
import OrderList from "../../components/owner/OrderList.jsx";
import RecentlyReady from "../../components/owner/RecentlyReady.jsx";
import OrderDetailSheet from "../../components/owner/OrderDetailSheet.jsx";
import MenuManagement from "../../components/owner/MenuManagement.jsx";
import "./owner.css";

function OrdersView() {
  const { orders, recentlyReady, stats, loading, error } = useOrders();
  const [detailOrder, setDetailOrder] = useState(null);

  // Keep the detail sheet's data in sync if the order it's showing
  // changes (e.g. tapping "Ready & Call Token" inside the sheet).
  const liveDetailOrder = detailOrder ? orders.find((o) => o.id === detailOrder.id) ?? null : null;

  if (loading) {
    return (
      <div className="state-message">
        <p>Loading orders&hellip;</p>
      </div>
    );
  }

  return (
    <>
      <StatsCards stats={stats} />
      {error && <p className="owner-error">Couldn&rsquo;t reach the server: {error}</p>}

      <h2 className="owner-section-title">Current Orders</h2>
      <main className="owner-main">
        <OrderList orders={orders} onOpenDetail={setDetailOrder} />
      </main>

      <RecentlyReady orders={recentlyReady} />

      <OrderDetailSheet order={liveDetailOrder} onClose={() => setDetailOrder(null)} />
    </>
  );
}

function DashboardContent() {
  const [view, setView] = useState("orders");

  return (
    <div className="owner-dashboard">
      <DashboardHeader />

      <div className="owner-tabs" role="tablist" aria-label="Owner dashboard section">
        <button
          type="button"
          role="tab"
          aria-selected={view === "orders"}
          className={`owner-tab${view === "orders" ? " owner-tab--active" : ""}`}
          onClick={() => setView("orders")}
        >
          Orders
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "menu"}
          className={`owner-tab${view === "menu" ? " owner-tab--active" : ""}`}
          onClick={() => setView("menu")}
        >
          Menu
        </button>
      </div>

      {view === "orders" ? <OrdersView /> : <MenuManagement />}
    </div>
  );
}

export default function OwnerDashboard() {
  return (
    <OrderProvider>
      <DashboardContent />
    </OrderProvider>
  );
}
