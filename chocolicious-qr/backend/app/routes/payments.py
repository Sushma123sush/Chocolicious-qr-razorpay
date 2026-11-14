from flask import Blueprint, jsonify, request

from ..services.order_service import OrderValidationError
from ..services.payment_service import (
    create_payment_order,
    verify_and_create_order,
    PaymentError,
)

payments_bp = Blueprint("payments", __name__)


@payments_bp.post("/payments/create")
def create_payment():
    """
    Body: { "order_type": "DINE_IN" | "PARCEL", "items": [{product_id, variant_id, quantity}] }
    Prices the cart server-side (same logic /api/orders uses) and opens
    a Razorpay Test Mode order for that amount. Returns just enough for
    the frontend to open Razorpay Checkout - the key secret never
    appears in this response.
    """
    payload = request.get_json(silent=True) or {}
    order_type = payload.get("order_type")
    items = payload.get("items")

    try:
        result = create_payment_order(order_type, items)
    except OrderValidationError as exc:
        return jsonify({"error": str(exc)}), 400
    except PaymentError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(result), 201


@payments_bp.post("/payments/verify")
def verify_payment():
    """
    Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    Verifies the signature server-side using the Razorpay key secret,
    then creates the real order (token included) from the items that
    were priced at /payments/create time. Safe to call more than once
    for the same payment - see payment_service.verify_and_create_order.
    """
    payload = request.get_json(silent=True) or {}
    razorpay_order_id = payload.get("razorpay_order_id")
    razorpay_payment_id = payload.get("razorpay_payment_id")
    razorpay_signature = payload.get("razorpay_signature")

    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        return (
            jsonify(
                {
                    "error": "razorpay_order_id, razorpay_payment_id and "
                    "razorpay_signature are all required."
                }
            ),
            400,
        )

    try:
        order = verify_and_create_order(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    except PaymentError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(order.to_dict()), 201
