from datetime import datetime, timezone

from . import db

STATUS_CREATED = "CREATED"
STATUS_PAID = "PAID"


def utcnow():
    return datetime.now(timezone.utc)


class PaymentIntent(db.Model):
    """
    Bridges POST /api/payments/create and POST /api/payments/verify.

    /payments/create prices the cart from the database and opens a
    Razorpay order for that amount, then stores a row here holding
    exactly what was priced (order_type + items) against the resulting
    razorpay_order_id.

    /payments/verify looks this row up by razorpay_order_id - it never
    re-trusts items sent by the client at verify time - and, once the
    signature checks out, hands those stored items to the existing
    order_service.create_order() to make the real Order.

    `status` + `order_id` together make verify idempotent: if this
    intent has already produced an Order, a repeated verify call
    (e.g. the client retrying, or Razorpay's handler firing twice)
    returns that same Order instead of creating a second one.
    """

    __tablename__ = "payment_intents"

    id = db.Column(db.Integer, primary_key=True)
    razorpay_order_id = db.Column(db.String(64), nullable=False, unique=True)
    order_type = db.Column(db.String(20), nullable=False)
    items_json = db.Column(db.Text, nullable=False)  # [{product_id, variant_id, quantity}, ...]
    amount = db.Column(db.Numeric(9, 2), nullable=False)  # rupees - matches Order.total_amount
    currency = db.Column(db.String(10), nullable=False, default="INR")
    status = db.Column(db.String(20), nullable=False, default=STATUS_CREATED)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "razorpay_order_id": self.razorpay_order_id,
            "order_type": self.order_type,
            "amount": float(self.amount),
            "currency": self.currency,
            "status": self.status,
            "order_id": self.order_id,
        }
