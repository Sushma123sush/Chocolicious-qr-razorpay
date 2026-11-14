import { ownerRequest } from "./ownerApiClient.js";

export function getActiveOrders() {
  return ownerRequest("/owner/orders");
}
export function getTodayStats() {
  return ownerRequest("/owner/stats");
}
export function markOrderReady(orderId) {
  return ownerRequest(`/owner/orders/${orderId}/ready`, { method: "PATCH" });
}