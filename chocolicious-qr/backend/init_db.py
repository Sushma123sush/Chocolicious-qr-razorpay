"""
Run once (or whenever you want to reset menu data):
    python init_db.py

Creates all tables and seeds the Chocolicious menu.
"""
from app import create_app
from app.models import db
from app.services.seed import run_seed

app = create_app()

with app.app_context():
    db.create_all()
    run_seed()
    print("Database initialized at backend/database/chocolicious.db")
