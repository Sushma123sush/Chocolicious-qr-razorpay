import { ownerRequest } from "./ownerApiClient.js";

export function getOwnerMenu() {
  return ownerRequest("/owner/menu");
}

function buildRequestInit(method, payload) {
  if (payload instanceof FormData) return { method, body: payload };
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
}

export function createProduct(payload) {
  return ownerRequest("/owner/menu", buildRequestInit("POST", payload));
}
export function updateProduct(productId, payload) {
  return ownerRequest(`/owner/menu/${productId}`, buildRequestInit("PATCH", payload));
}
export function setProductAvailability(productId, isAvailable) {
  return updateProduct(productId, { is_available: isAvailable });
}