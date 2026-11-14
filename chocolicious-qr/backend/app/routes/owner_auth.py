from flask import Blueprint, jsonify, request
from ..services.auth_service import check_owner_credentials, issue_owner_token, AuthConfigError

owner_auth_bp = Blueprint("owner_auth", __name__)


@owner_auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "")
    password = payload.get("password", "")

    try:
        valid = check_owner_credentials(username, password)
    except AuthConfigError as exc:
        return jsonify({"error": str(exc)}), 500

    if not valid:
        return jsonify({"error": "Invalid username or password."}), 401

    return jsonify({"token": issue_owner_token()})