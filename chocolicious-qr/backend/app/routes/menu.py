from flask import Blueprint, jsonify, abort

from ..models import Category, Product
from ..models.order import ORDER_TYPE_PARCEL
from ..services.order_service import get_parcel_charge

menu_bp = Blueprint("menu", __name__)

@menu_bp.get("/config")
def get_shop_config():
    """Public, read-only. Display-only - the real charge is always
    recalculated server-side at payment time."""
    return jsonify({"parcel_charge": float(get_parcel_charge(ORDER_TYPE_PARCEL))})


@menu_bp.get("/categories")
def get_categories():
    categories = (
        Category.query.filter_by(is_active=True)
        .order_by(Category.display_order)
        .all()
    )
    return jsonify([c.to_dict() for c in categories])


@menu_bp.get("/products")
def get_products():
    products = (
        Product.query.join(Category)
        .filter(Category.is_active.is_(True))
        .order_by(Product.category_id, Product.display_order)
        .all()
    )
    return jsonify([p.to_dict() for p in products])


@menu_bp.get("/products/<int:product_id>")
def get_product(product_id):
    product = Product.query.get(product_id)
    if product is None:
        abort(404, description="Product not found")
    return jsonify(product.to_dict())


@menu_bp.get("/menu")
def get_menu():
    """
    Full menu grouped by category - the single call the frontend needs.

    Includes unavailable products too (is_available: false) rather than
    hiding them - the customer UI shows them as "Unavailable" so people
    know the item exists, it just can't be ordered right now. Filtering
    happens on the frontend, not here.
    """
    categories = (
        Category.query.filter_by(is_active=True)
        .order_by(Category.display_order)
        .all()
    )
    menu = []
    for category in categories:
        products = [p.to_dict() for p in category.products]
        menu.append(
            {
                "id": category.id,
                "name": category.name,
                "display_order": category.display_order,
                "products": products,
            }
        )
    return jsonify(menu)
