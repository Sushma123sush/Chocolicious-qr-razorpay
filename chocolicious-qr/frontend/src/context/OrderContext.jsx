import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getActiveOrders, getTodayStats, markOrderReady } from "../services/orderService.js";
import { speakTokenAnnouncement } from "../utils/tokenCaller.js";

const OrderContext = createContext(null);

const POLL_INTERVAL_MS = 7000;
// How long the "✓ Token X called" confirmation stays on the card before
// it's removed from Current Orders and filed under Recently Ready.
const CONFIRMATION_DISPLAY_MS = 1800;
const RECENTLY_READY_LIMIT = 5;

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [recentlyReady, setRecentlyReady] = useState([]);
  const [stats, setStats] = useState({ orders_today: 0, sales_today: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callingOrderId, setCallingOrderId] = useState(null);
  const [calledOrderId, setCalledOrderId] = useState(null);

  // Orders marked ready are removed from `orders` after a short delay
  // (see CONFIRMATION_DISPLAY_MS); the periodic poll below can land in
  // the middle of that delay, so we track "currently animating out"
  // order ids and don't let a poll response bring one back early.
  const pendingRemovalIds = useRef(new Set());

  const refresh = useCallback(async () => {
    try {
      const [activeOrders, todayStats] = await Promise.all([getActiveOrders(), getTodayStats()]);
      setOrders(activeOrders.filter((o) => !pendingRemovalIds.current.has(o.id)));
      setStats(todayStats);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const readyAndCallToken = useCallback(
    async (order) => {
      setCallingOrderId(order.id);
      try {
        // 1. Backend first - the database is the source of truth.
        const updated = await markOrderReady(order.id);

        // 2. Only after that succeeds: announce + visual confirmation.
        speakTokenAnnouncement(updated.token_number);
        setCalledOrderId(order.id);
        pendingRemovalIds.current.add(order.id);

        // 3. After a beat, move it out of Current Orders.
        setTimeout(() => {
          setOrders((prev) => prev.filter((o) => o.id !== order.id));
          setRecentlyReady((prev) => [updated, ...prev].slice(0, RECENTLY_READY_LIMIT));
          setCalledOrderId(null);
          pendingRemovalIds.current.delete(order.id);
        }, CONFIRMATION_DISPLAY_MS);

        // 4. Reconcile with the backend in the background (counts etc.)
        refresh();
      } catch (err) {
        setError(err.message);
      } finally {
        setCallingOrderId(null);
      }
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      orders,
      recentlyReady,
      stats,
      loading,
      error,
      callingOrderId,
      calledOrderId,
      readyAndCallToken,
    }),
    [orders, recentlyReady, stats, loading, error, callingOrderId, calledOrderId, readyAndCallToken]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within an OrderProvider");
  return ctx;
}
