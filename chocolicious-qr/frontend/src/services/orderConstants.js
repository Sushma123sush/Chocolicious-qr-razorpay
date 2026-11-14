// Mirrors the backend constants in backend/app/models/order.py. Kept as
// a tiny standalone module (not tied to any data source) since both the
// customer order-type picker and the owner dashboard need these, and
// neither should import from the other's code.

export const ORDER_TYPES = {
  DINE_IN: "DINE_IN",
  PARCEL: "PARCEL",
};

export const ORDER_STATUSES = {
  ACTIVE: "ACTIVE",
  READY: "READY",
};
