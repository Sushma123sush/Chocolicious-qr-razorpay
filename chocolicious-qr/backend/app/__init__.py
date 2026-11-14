"""
Chocolicious QR Ordering - Flask application factory.

Menu browsing (categories/products/variants), real order placement via
Razorpay Test Mode payment verification, and the owner dashboard's
order/stats/menu-management endpoints. No auth or notifications yet -
see README.
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from .models import db
from .services.auth_service import verify_owner_token

# Loaded once, as early as possible, so RAZORPAY_KEY_ID /
# RAZORPAY_KEY_SECRET (see backend/.env.example) are available via
# os.environ.get(...) by the time any request comes in. Path is
# explicit rather than relying on cwd, since run.py is expected to be
# launched from the backend/ directory but shouldn't have to be.
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


def create_app(test_config=None):
    app = Flask(__name__)

    basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
    os.makedirs(basedir, exist_ok=True)
    db_path = os.path.join(basedir, "chocolicious.db")

    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{db_path}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JSON_SORT_KEYS=False,
        MAX_CONTENT_LENGTH=8 * 1024 * 1024,  # 8MB request cap (covers a 5MB image + form fields)
    )

    if test_config:
        app.config.update(test_config)

    # Allow the Vite dev server to call the API during development.
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    from .routes.menu import menu_bp
    from .routes.orders import orders_bp
    from .routes.owner import owner_bp
    from .routes.owner_menu import owner_menu_bp
    from .routes.uploads import uploads_bp
    from .routes.payments import payments_bp
    from .routes.owner_auth import owner_auth_bp

    app.register_blueprint(menu_bp, url_prefix="/api")
    app.register_blueprint(orders_bp, url_prefix="/api")
    app.register_blueprint(owner_bp, url_prefix="/api/owner")
    app.register_blueprint(owner_menu_bp, url_prefix="/api/owner")
    app.register_blueprint(uploads_bp, url_prefix="/api")
    app.register_blueprint(payments_bp, url_prefix="/api")
    app.register_blueprint(owner_auth_bp, url_prefix="/api/owner")

    OWNER_AUTH_EXEMPT_PATHS = {"/api/owner/login"}

    @app.before_request
    def require_owner_auth():
        if request.method == "OPTIONS":
            return None
        if request.path.startswith("/api/owner") and request.path not in OWNER_AUTH_EXEMPT_PATHS:
            auth_header = request.headers.get("Authorization", "")
            token = auth_header[7:] if auth_header.startswith("Bearer ") else None
            if not verify_owner_token(token):
                return jsonify({"error": "Authentication required"}), 401
        return None

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "chocolicious-backend"}

    return app

