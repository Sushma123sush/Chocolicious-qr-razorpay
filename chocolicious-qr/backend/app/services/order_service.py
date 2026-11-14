"""
All order-related business logic lives here, kept out of the route
handlers so the routes stay thin.

Security-critical rule: this module NEVER trusts a price or total sent
by the client. Every price is looked up fresh from Product /
ProductVariant, and the order total is computed here from those
looked-up prices - not from anything the frontend calculated.
"""
from datetime import datetime, timezone
from sqlalchemy import func

from ..models import db, Product, ProductVariant, Order, OrderItem
from ..models.order import STATUS_ACTIVE, STATUS_READY, ORDER_TYPE_DINE_IN, ORDER_TYPE_PARCEL


class OrderValidationError(Exception):
    """Raised for any problem with a client-submitted order payload."""


VALID_ORDER_TYPES = {ORDER_TYPE_DINE_IN, ORDER_TYPE_PARCEL}

from decimal import Decimal, InvalidOperation
import os
# (add these two imports at the top of the file alongside the existing ones)

DEFAULT_PARCEL_CHARGE = Decimal("10")


def get_parcel_charge(order_type):
    """Extra charge for Parcel orders (₹0 for Dine In). Configurable
    via PARCEL_CHARGE in backend/.env."""
    if order_type != ORDER_TYPE_PARCEL:
        return Decimal("0")
    raw = os.environ.get("PARCEL_CHARGE")
    if raw is None or raw.strip() == "":
        return DEFAULT_PARCEL_CHARGE
    try:
        value = Decimal(raw)
    except InvalidOperation:
        return DEFAULT_PARCEL_CHARGE
    return value if value >= 0 else DEFAULT_PARCEL_CHARGE

def _next_token_number():
    """
    Simplest reliable strategy for this dev/demo stage: a single
    globally-increasing sequence (1, 2, 3, ...), not reset daily.

    Uses MAX(token_number) + 1 rather than COUNT(*) so a deleted/edited
    order can never cause a duplicate token. Not safe against a real
    race between two simultaneous orders (would need a DB-level
    sequence or row locking for that) - acceptable for this phase's
    single-shop, low-concurrency demo. See README for the daily-reset
    alternative if that's preferred later.
    """
    current_max = db.session.query(func.max(Order.token_number)).scalar()
    return (current_max or 0) + 1


def _resolve_line(item_payload):
    """
    Looks up one cart line against the database and returns the
    authoritative (name, variant_name, unit_price) for it. Raises
    OrderValidationError if anything about the line is invalid.
    """
    product_id = item_payload.get("product_id")
    variant_id = item_payload.get("variant_id")
    quantity = item_payload.get("quantity")

    if not isinstance(product_id, int):
        raise OrderValidationError("Each item needs a valid product_id.")
    if not isinstance(quantity, int) or quantity < 1:
        raise OrderValidationError("Each item needs a quantity of at least 1.")

    product = Product.query.get(product_id)
    if product is None or not product.is_available:
        raise OrderValidationError(f"Product {product_id} is not available.")

    if variant_id is not None:
        variant = ProductVariant.query.get(variant_id)
        if (
            variant is None
            or variant.product_id != product.id
            or not variant.is_available
        ):
            raise OrderValidationError(
                f"Variant {variant_id} is not available for product {product_id}."
            )
        unit_price = variant.price
        variant_name = variant.name
    else:
        if product.price is None:
            raise OrderValidationError(
                f"Product {product_id} requires a variant to be selected."
            )
        unit_price = product.price
        variant_name = None

    return {
        "product_id": product.id,
        "variant_id": variant_id,
        "product_name": product.name,
        "variant_name": variant_name,
        "unit_price": unit_price,
        "quantity": quantity,
    }


def resolve_and_price(order_type, raw_items):
    """
    Validates a cart against the database and prices it. This is the
    one place order totals get computed - both the free/demo
    create_order() path below and the Razorpay payment_service call
    this, so the two can never compute a total differently or drift
    apart over time.

    Returns (resolved_lines, total_amount). Raises OrderValidationError.
    """
    if order_type not in VALID_ORDER_TYPES:
        raise OrderValidationError("order_type must be DINE_IN or PARCEL.")

    if not raw_items or not isinstance(raw_items, list):
        raise OrderValidationError("An order needs at least one item.")

    resolved_lines = [_resolve_line(item) for item in raw_items]
    items_total = sum(line["unit_price"] * line["quantity"] for line in resolved_lines)
    total_amount = items_total + get_parcel_charge(order_type)
    return resolved_lines, total_amount


def create_order(order_type, raw_items):
    resolved_lines, total_amount = resolve_and_price(order_type, raw_items)
    parcel_charge = get_parcel_charge(order_type)  # already folded into total_amount; stored for display

    order = Order(
        token_number=_next_token_number(),
        order_type=order_type,
        status=STATUS_ACTIVE,
        total_amount=total_amount,
        parcel_charge=parcel_charge,
    )
    db.session.add(order)
    db.session.flush()  # get order.id

    for line in resolved_lines:
        db.session.add(
            OrderItem(
                order_id=order.id,
                product_id=line["product_id"],
                variant_id=line["variant_id"],
                product_name=line["product_name"],
                variant_name=line["variant_name"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                line_total=line["unit_price"] * line["quantity"],
            )
        )

    db.session.commit()
    return order


def get_active_orders():
    return (
        Order.query.filter_by(status=STATUS_ACTIVE)
        .order_by(Order.created_at.asc())
        .all()
    )


def mark_order_ready(order_id):
    order = Order.query.get(order_id)
    if order is None:
        return None
    order.status = STATUS_READY
    order.ready_at = datetime.now(timezone.utc)
    db.session.commit()
    return order


def get_today_stats():
    """
    Today's order count / sales, computed from real Order rows created
    today (server-local calendar day via UTC date - fine for a
    single-shop deployment).

    Both ACTIVE and READY orders count, and no code change was needed
    here to make that correct: Order rows are now only ever created
    after a verified Razorpay payment (via payment_service, or through
    the gated /api/orders fallback - see routes/orders.py), so every
    row in this table already represents a real, paid sale.
    """
    today = datetime.now(timezone.utc).date()
    orders_today = Order.query.filter(func.date(Order.created_at) == today.isoformat()).all()
    return {
        "orders_today": len(orders_today),
        "sales_today": float(sum(o.total_amount for o in orders_today)),
    }
