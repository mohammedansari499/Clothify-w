"""
Test fixtures and configuration for WardrobeAI backend tests.
Provides a Flask test client, mock MongoDB, and sample data.
"""
import pytest
import sys
import os
from unittest.mock import MagicMock, patch
from datetime import datetime

# Add backend root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ── Mock MongoDB before importing app ──────────────────────
@pytest.fixture(autouse=True)
def mock_mongo(monkeypatch):
    """Replace MongoDB with in-memory mock for all tests."""
    mock_client = MagicMock()
    mock_db = MagicMock()
    mock_client.__getitem__ = MagicMock(return_value=mock_db)

    # Mock collections matching app/config/db.py
    mock_users = MagicMock()
    mock_clothes = MagicMock()
    mock_outfits = MagicMock()

    mock_db.__getitem__ = MagicMock(side_effect=lambda name: {
        "users": mock_users,
        "clothes": mock_clothes,
        "outfits": mock_outfits,
    }.get(name, MagicMock()))

    # Patch at the db module level where collections are created
    monkeypatch.setattr("app.config.db.client", mock_client)
    monkeypatch.setattr("app.config.db.db", mock_db)
    monkeypatch.setattr("app.config.db.users_collection", mock_users)
    monkeypatch.setattr("app.config.db.clothes_collection", mock_clothes)
    monkeypatch.setattr("app.config.db.outfits_collection", mock_outfits)

    return {
        "client": mock_client,
        "db": mock_db,
        "users": mock_users,
        "clothes": mock_clothes,
        "outfits": mock_outfits,
    }


@pytest.fixture
def app():
    """Create Flask application for testing."""
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
    os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017/test")
    os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
    os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
    os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:5000/api/calendar/callback")

    # Import the Flask app from root app.py
    # Using importlib because 'app.py' conflicts with 'app/' package
    import importlib.util
    app_path = os.path.join(os.path.dirname(__file__), "..", "app.py")
    spec = importlib.util.spec_from_file_location("app_module", app_path)
    app_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(app_module)
    flask_app = app_module.app

    flask_app.config["TESTING"] = True
    flask_app.config["JWT_SECRET_KEY"] = "test-jwt-secret"
    return flask_app


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Returns a helper function to get auth headers for a test user."""
    def _get_headers(user_id="507f1f77bcf86cd799439011"):
        from flask_jwt_extended import create_access_token
        with client.application.app_context():
            token = create_access_token(identity=user_id)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
    return _get_headers


# ── Sample Data ────────────────────────────────────────────
@pytest.fixture
def sample_user():
    """Sample user document matching app/models/user_model.py schema."""
    return {
        "_id": "507f1f77bcf86cd799439011",
        "email": "test@example.com",
        "password": b"$2b$12$hashedpasswordvalue",  # bcrypt hash (bytes)
        "subscription": "free",
        "calendar_connected": False,
        "created_at": datetime.utcnow(),
    }


@pytest.fixture
def sample_clothes():
    """Sample wardrobe items matching clothes_routes.py schema."""
    return [
        {
            "_id": "cloth_1",
            "user_id": "test_user_123",
            "image_url": "uploads/shirt.jpg",
            "type": "shirt",
            "colors": [[50, 100, 180], [200, 200, 200], [30, 60, 120]],
            "occasion_tags": ["casual", "semi-formal"],
            "created_at": datetime.utcnow(),
        },
        {
            "_id": "cloth_2",
            "user_id": "test_user_123",
            "image_url": "uploads/pants.jpg",
            "type": "pants",
            "colors": [[40, 40, 50], [60, 60, 70], [20, 20, 30]],
            "occasion_tags": ["casual", "formal"],
            "created_at": datetime.utcnow(),
        },
        {
            "_id": "cloth_3",
            "user_id": "test_user_123",
            "image_url": "uploads/shoes.jpg",
            "type": "shoes",
            "colors": [[10, 10, 10], [30, 30, 30], [50, 50, 50]],
            "occasion_tags": ["casual"],
            "created_at": datetime.utcnow(),
        },
    ]
