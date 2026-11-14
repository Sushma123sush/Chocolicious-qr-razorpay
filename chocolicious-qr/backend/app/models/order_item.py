from . import db


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)

    # Nullable and NOT enforced as a hard FK-with-cascade on purpose: the
    # product/variant a customer bought might later be edited, removed,
    # or re-seeded with a new id (see README "Re-seeding the menu").
    # product_name / variant_name / unit_price are snapshotted at order
    # time below, so the order stays fully readable regardless of what
    # happens to the catalog afterwards.
    product_id = db.Column(db.Integer, nullable=True)
    variant_id = db.Column(db.Integer, nullable=True)

    product_name = db.Column(db.String(160), nullable=False)
    variant_name = db.Column(db.String(80), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(8, 2), nullable=False)
    line_total = db.Column(db.Numeric(9, 2), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "product_id": self.product_id,
            "variant_id": self.variant_id,
            "product_name": self.product_name,
            "variant_name": self.variant_name,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "line_total": float(self.line_total),
        }
