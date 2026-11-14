"""
Backend logic for the owner's Menu Management screen. Kept separate
from order_service.py since it's a different concern (editing the
catalog, not placing orders).

Editing a product here NEVER touches existing OrderItem rows - those
already store their own snapshot of product_name/variant_name/
unit_price taken at order time (see order_service.py), so historical
orders keep showing exactly what was purchased regardless of later
menu edits.
"""
import os
import uuid
from werkzeug.utils import secure_filename

from ..models import db, Category, Product, ProductVariant

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB


class MenuValidationError(Exception):
    """Raised for any problem with an owner-submitted menu payload."""


def _uploads_dir():
    # backend/app/static/uploads - served automatically by Flask's
    # default static handler at /static/uploads/<filename>, then
    # re-exposed at /api/uploads/<filename> too (see routes/uploads.py)
    # so it works through the same /api proxy the rest of the app uses.
    path = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
    os.makedirs(path, exist_ok=True)
    return os.path.abspath(path)


def save_uploaded_image(file_storage):
    """
    Saves an uploaded image to local disk and returns its URL.

    Isolated in its own function so this is the only place that would
    need to change if image storage moves to S3/Cloudinary/etc. later -
    everything else just calls this and stores whatever URL it returns.
    """
    filename = file_storage.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise MenuValidationError(
            f"Image must be one of: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}."
        )

    safe_name = secure_filename(filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    dest_path = os.path.join(_uploads_dir(), unique_name)
    file_storage.save(dest_path)

    if os.path.getsize(dest_path) > MAX_IMAGE_BYTES:
        os.remove(dest_path)
        raise MenuValidationError("Image is too large (max 5MB).")

    return f"/api/uploads/{unique_name}"


def list_full_menu():
    """Every category/product/variant, including inactive/unavailable -
    the owner needs to see and re-enable those, unlike the customer view."""
    categories = Category.query.order_by(Category.display_order).all()
    return [
        {
            **category.to_dict(),
            "products": [p.to_dict() for p in category.products],
        }
        for category in categories
    ]


def _validate_price(value, field_name="price"):
    try:
        price = float(value)
    except (TypeError, ValueError):
        raise MenuValidationError(f"{field_name} must be a number.")
    if price < 0:
        raise MenuValidationError(f"{field_name} cannot be negative.")
    return price


def _validate_variants(raw_variants):
    if not isinstance(raw_variants, list) or len(raw_variants) == 0:
        raise MenuValidationError("At least one variant is required when using variants.")
    cleaned = []
    for v in raw_variants:
        name = (v or {}).get("name", "").strip()
        if not name:
            raise MenuValidationError("Each variant needs a name.")
        price = _validate_price((v or {}).get("price"), field_name=f"{name} price")
        cleaned.append({"name": name, "price": price})
    return cleaned


def _apply_pricing(product, payload):
    """
    Payload determines pricing mode by which key is present:
    - "variants" (a list) -> variant-priced product, product.price cleared
    - "price" (a number)  -> flat-priced product, existing variants cleared
    Neither present -> pricing untouched.
    """
    if "variants" in payload:
        cleaned = _validate_variants(payload["variants"])
        ProductVariant.query.filter_by(product_id=product.id).delete()
        product.price = None
        for order, v in enumerate(cleaned, start=1):
            db.session.add(
                ProductVariant(
                    product_id=product.id,
                    name=v["name"],
                    price=v["price"],
                    is_available=True,
                    display_order=order,
                )
            )
    elif "price" in payload:
        product.price = _validate_price(payload["price"])
        ProductVariant.query.filter_by(product_id=product.id).delete()


def create_product(payload):
    name = (payload.get("name") or "").strip()
    if not name:
        raise MenuValidationError("Product name is required.")

    category_id = payload.get("category_id")
    category = Category.query.get(category_id) if category_id is not None else None
    if category is None:
        raise MenuValidationError("A valid category_id is required.")

    has_variants = "variants" in payload and payload["variants"]
    has_price = "price" in payload and payload["price"] not in (None, "")
    if not has_variants and not has_price:
        raise MenuValidationError("Provide either a price or at least one variant.")

    product = Product(
        category_id=category.id,
        name=name,
        description=(payload.get("description") or None),
        section=(payload.get("section") or None),
        image_url=(payload.get("image_url") or None),
        is_available=bool(payload.get("is_available", True)),
        display_order=int(payload.get("display_order") or 0),
    )
    db.session.add(product)
    db.session.flush()  # get product.id for variants

    _apply_pricing(product, payload)

    db.session.commit()
    return product


def update_product(product_id, payload):
    product = Product.query.get(product_id)
    if product is None:
        return None

    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            raise MenuValidationError("Product name cannot be empty.")
        product.name = name

    if "category_id" in payload:
        category = Category.query.get(payload.get("category_id"))
        if category is None:
            raise MenuValidationError("A valid category_id is required.")
        product.category_id = category.id

    if "description" in payload:
        product.description = payload.get("description") or None

    if "section" in payload:
        product.section = payload.get("section") or None

    if "image_url" in payload:
        product.image_url = payload.get("image_url") or None

    if "is_available" in payload:
        product.is_available = bool(payload.get("is_available"))

    if "price" in payload or "variants" in payload:
        _apply_pricing(product, payload)

    db.session.commit()
    return product
