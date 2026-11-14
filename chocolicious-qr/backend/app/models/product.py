from . import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    name = db.Column(db.String(160), nullable=False)
    description = db.Column(db.String(300), nullable=True)
    image_url = db.Column(db.String(300), nullable=True)

    # Simple flat price. NULL when the product only sells through variants
    # (e.g. single/double scoop, no-bake/baked cheesecake).
    price = db.Column(db.Numeric(8, 2), nullable=True)

    # Optional sub-grouping label used only where the source menu itself
    # groups items under a heading inside a category (e.g. "Velvet Special"
    # inside Natural Ice Cream, "Brew Scoops" inside Classic Scoops).
    # Left NULL for categories that don't have sub-headings.
    section = db.Column(db.String(120), nullable=True)

    is_available = db.Column(db.Boolean, nullable=False, default=True)
    display_order = db.Column(db.Integer, nullable=False, default=0)

    variants = db.relationship(
        "ProductVariant",
        backref="product",
        order_by="ProductVariant.display_order",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "category_id": self.category_id,
            "name": self.name,
            "description": self.description,
            "image_url": self.image_url,
            "price": float(self.price) if self.price is not None else None,
            "section": self.section,
            "is_available": self.is_available,
            "display_order": self.display_order,
            "variants": [v.to_dict() for v in self.variants],
        }
