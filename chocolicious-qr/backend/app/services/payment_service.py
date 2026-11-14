"""
Razorpay Test Mode integration.

Two responsibilities, matching the two API routes:
  1. create_payment_order() - price the cart from the database (reusing
     order_service.resolve_and_price(), never trusting a client-sent
     amount), open a Razorpay order for that amount, and remember what
     was priced.
  2. verify_and_create_order() - verify the payment signature
     server-side, then hand off to order_service.create_order() - the
     existing, unmodified single source of truth for order creation -
     using the items captured in step 1, not anything resent by the
     client at verify time.

No webhook handling yet (out of scope for this step, per plan) - the
frontend calling /payments/verify after Razorpay's checkout handler
fires is currently the only way a payment gets confirmed.
"""
import hashlib
import hmac
import json
import os

import razorpay

from ..models import db, Order
from ..models.payment_intent import PaymentIntent, STATUS_CREATED, STATUS_PAID
from .order_service import resolve_and_price, create_order


class PaymentError(Exception):
    """Raised for any problem creating or verifying a Razorpay payment."""


def _get_credentials():
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise PaymentError(
            "Razorpay is not configured. Copy backend/.env.example to "
            "backend/.env and fill in RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET."
        )
    return key_id, key_secret


def create_payment_order(order_type, raw_items):
    """
    order_service.OrderValidationError propagates straight up from
    resolve_and_price() - the route treats it the same as it already
    does for /api/orders.
    """
    resolved_lines, total_amount = resolve_and_price(order_type, raw_items)

    key_id, key_secret = _get_credentials()

    # Razorpay wants the smallest currency unit (paise for INR).
    # total_amount is a Decimal (SQLAlchemy Numeric), so this multiply
    # is exact - no float rounding surprises.
    amount_paise = int(total_amount * 100)

    client = razorpay.Client(auth=(key_id, key_secret))
    try:
        razorpay_order = client.order.create(
            {"amount": amount_paise, "currency": "INR", "payment_capture": 1}
        )
    except Exception as exc:  # the razorpay SDK raises its own error types
        raise PaymentError(f"Could not create Razorpay order: {exc}") from exc

    # Store only ids/quantities - names and prices get re-resolved from
    # the database again inside create_order() at verify time, exactly
    # like the free/demo path already does.
    items_for_storage = [
        {
            "product_id": line["product_id"],
            "variant_id": line["variant_id"],
            "quantity": line["quantity"],
        }
        for line in resolved_lines
    ]

    intent = PaymentIntent(
        razorpay_order_id=razorpay_order["id"],
        order_type=order_type,
        items_json=json.dumps(items_for_storage),
        amount=total_amount,
        currency="INR",
        status=STATUS_CREATED,
    )
    db.session.add(intent)
    db.session.commit()

    return {
        "razorpay_order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": key_id,
    }


def _verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    _key_id, key_secret = _get_credentials()
    payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(key_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_signature, razorpay_signature or "")


def verify_and_create_order(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    intent = PaymentIntent.query.filter_by(razorpay_order_id=razorpay_order_id).first()
    if intent is None:
        raise PaymentError("Unknown Razorpay order.")

    # Idempotency check comes before signature verification on purpose:
    # a legitimate repeated call (client retry, Razorpay's handler
    # firing twice) should short-circuit to the same result every time,
    # not re-run verification. NOTE: this check-then-act is not safe
    # against two truly concurrent verify calls racing each other
    # (would need a DB-level lock for that) - acceptable at this
    # single-shop, low-concurrency stage, same tradeoff already
    # documented for token generation in order_service.py.
    if intent.status == STATUS_PAID and intent.order_id is not None:
        existing_order = Order.query.get(intent.order_id)
        if existing_order is not None:
            return existing_order

    if not _verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        raise PaymentError("Payment signature verification failed.")

    items = json.loads(intent.items_json)
    order = create_order(intent.order_type, items)

    intent.status = STATUS_PAID
    intent.order_id = order.id
    db.session.commit()

    return order
