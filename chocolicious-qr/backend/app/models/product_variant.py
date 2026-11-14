from . import db


class ProductVariant(db.Model):
    __tablename__ = "product_variants"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    name = db.Column(db.String(80), nullable=False)  # e.g. "Single", "Double", "Baked"
    price = db.Column(db.Numeric(8, 2), nullable=False)
    is_available = db.Column(db.Boolean, nullable=False, default=True)
    display_order = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "name": self.name,
            "price": float(self.price),
            "is_available": self.is_available,
            "display_order": self.display_order,
        }
