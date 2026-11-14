import os

from flask import Blueprint, jsonify, request

from ..services.order_service import create_order, OrderValidationError

orders_bp = Blueprint("orders", __name__)


@orders_bp.post("/orders")
def place_order():
    """
    Direct order creation, bypassing payment entirely.

    Disabled by default now that the Razorpay Test Mode flow exists
    (see routes/payments.py) - real orders should be created via
    POST /api/payments/create -> Razorpay Checkout -> POST
    /api/payments/verify, not here, so nobody can create an order for
    free by hitting this endpoint directly.

    Kept in place (not deleted) so local development/testing can still
    deliberately re-enable it by setting ALLOW_DIRECT_ORDER_CREATION=true
    in backend/.env. Never set that in a real deployment.
    """
    if os.environ.get("ALLOW_DIRECT_ORDER_CREATION", "").strip().lower() != "true":
        return (
            jsonify(
                {
                    "error": "Direct order creation is disabled. Orders must be "
                    "placed through the payment flow: POST /api/payments/create, "
                    "complete checkout, then POST /api/payments/verify."
                }
            ),
            403,
        )

    payload = request.get_json(silent=True) or {}
    order_type = payload.get("order_type")
    items = payload.get("items")

    try:
        order = create_order(order_type, items)
    except OrderValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(order.to_dict()), 201
