import json

from flask import Blueprint, jsonify, request

from ..services.menu_admin_service import (
    list_full_menu,
    create_product,
    update_product,
    save_uploaded_image,
    MenuValidationError,
)

owner_menu_bp = Blueprint("owner_menu", __name__)


def _parse_payload():
    """
    Accepts either JSON (application/json) or multipart/form-data (when
    an image file is attached). For multipart requests, everything
    except the file arrives as form fields; "variants" arrives as a
    JSON-encoded string since HTML forms can't nest structured data.
    """
    if request.content_type and "multipart/form-data" in request.content_type:
        payload = {}
        form = request.form
        if "name" in form:
            payload["name"] = form.get("name")
        if "category_id" in form:
            payload["category_id"] = form.get("category_id", type=int)
        if "description" in form:
            payload["description"] = form.get("description")
        if "section" in form:
            payload["section"] = form.get("section")
        if "is_available" in form:
            payload["is_available"] = form.get("is_available") in ("true", "1", "on")
        if "price" in form and form.get("price") != "":
            payload["price"] = form.get("price")
        if "variants" in form and form.get("variants"):
            try:
                payload["variants"] = json.loads(form.get("variants"))
            except (TypeError, ValueError):
                raise MenuValidationError("variants must be valid JSON.")
        return payload, request.files.get("image")

    payload = request.get_json(silent=True) or {}
    return payload, None


@owner_menu_bp.get("/menu")
def get_full_menu():
    return jsonify(list_full_menu())


@owner_menu_bp.post("/menu")
def post_product():
    try:
        payload, image_file = _parse_payload()
        if image_file and image_file.filename:
            payload["image_url"] = save_uploaded_image(image_file)
        product = create_product(payload)
    except MenuValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(product.to_dict()), 201


@owner_menu_bp.patch("/menu/<int:product_id>")
def patch_product(product_id):
    try:
        payload, image_file = _parse_payload()
        if image_file and image_file.filename:
            payload["image_url"] = save_uploaded_image(image_file)
        product = update_product(product_id, payload)
    except MenuValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    if product is None:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(product.to_dict())
