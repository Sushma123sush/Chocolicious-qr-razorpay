from datetime import datetime, timezone

from . import db

# Kept intentionally minimal per product philosophy: this is a small
# self-service shop, not a restaurant POS. Only two statuses exist -
# ACTIVE (owner still needs to prepare/hand it over) and READY (owner
# has pressed "Ready & Call Token"). No PREPARING/ACCEPTED/COMPLETED.
STATUS_ACTIVE = "ACTIVE"
STATUS_READY = "READY"

ORDER_TYPE_DINE_IN = "DINE_IN"
ORDER_TYPE_PARCEL = "PARCEL"


def utcnow():
    return datetime.now(timezone.utc)


def _as_utc_iso(value):
    """
    SQLite drops tzinfo on round-trip even for DateTime(timezone=True)
    columns, so a value we stored as UTC comes back as a naive
    datetime. Every datetime this app writes is UTC (see utcnow()
    above), so it's safe to always label it as such when serializing -
    without this, `new Date(isoString)` in the browser would
    misinterpret the timestamp as local time instead of UTC.
    """
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    token_number = db.Column(db.Integer, nullable=False, unique=True)
    order_type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default=STATUS_ACTIVE)
    total_amount = db.Column(db.Numeric(9, 2), nullable=False)
    parcel_charge = db.Column(db.Numeric(8, 2), nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    ready_at = db.Column(db.DateTime(timezone=True), nullable=True)

    items = db.relationship(
        "OrderItem",
        backref="order",
        order_by="OrderItem.id",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "token_number": self.token_number,
            "order_type": self.order_type,
            "status": self.status,
            "total_amount": float(self.total_amount),
            "parcel_charge": float(self.parcel_charge),
            "created_at": _as_utc_iso(self.created_at),
            "ready_at": _as_utc_iso(self.ready_at),
            "items": [item.to_dict() for item in self.items],
        }
