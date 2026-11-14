from flask import Blueprint, jsonify

from ..services.order_service import get_active_orders, get_today_stats, mark_order_ready

owner_bp = Blueprint("owner", __name__)


@owner_bp.get("/orders")
def list_active_orders():
    orders = get_active_orders()
    return jsonify([o.to_dict() for o in orders])


@owner_bp.get("/stats")
def stats():
    return jsonify(get_today_stats())


@owner_bp.patch("/orders/<int:order_id>/ready")
def ready_order(order_id):
    order = mark_order_ready(order_id)
    if order is None:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order.to_dict())
