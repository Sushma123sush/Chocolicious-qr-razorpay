import os
from flask import Blueprint, send_from_directory

uploads_bp = Blueprint("uploads", __name__)


def _uploads_dir():
    path = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
    return os.path.abspath(path)


@uploads_bp.get("/uploads/<path:filename>")
def get_upload(filename):
    return send_from_directory(_uploads_dir(), filename)
