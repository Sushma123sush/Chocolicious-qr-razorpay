import { ORDER_TYPES } from "../../services/orderConstants.js";

const LABELS = {
  [ORDER_TYPES.DINE_IN]: "Dine In",
  [ORDER_TYPES.PARCEL]: "Parcel",
};

export default function OrderTypeBadge({ orderType }) {
  const modifier = orderType === ORDER_TYPES.DINE_IN ? "dine-in" : "parcel";
  return <span className={`type-badge type-badge--${modifier}`}>{LABELS[orderType] ?? orderType}</span>;
}
