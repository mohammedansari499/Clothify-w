"""
Unit tests for authentication endpoints.
Tests: register, login, profile, protected routes.
Matches actual routes in app/routes/auth_routes.py.
"""
import pytest
from unittest.mock import patch, MagicMock
import bcrypt


@pytest.mark.unit
class TestRegister:
    """POST /api/auth/register"""

    def test_register_success(self, client, mock_mongo):
        """Registration with valid data returns 201."""
        mock_mongo["users"].find_one.return_value = None
        mock_mongo["users"].insert_one.return_value = MagicMock(
            inserted_id="new_user_id"
        )

        resp = client.post("/api/auth/register", json={
            "email": "new@example.com",
            "password": "securepass123"
        })

        assert resp.status_code == 201
        data = resp.get_json()
        assert data["message"] == "User registered successfully"

    def test_register_missing_email(self, client):
        """Registration without email returns 400."""
        resp = client.post("/api/auth/register", json={
            "password": "securepass123"
        })
        assert resp.status_code == 400

    def test_register_missing_password(self, client):
        """Registration without password returns 400."""
        resp = client.post("/api/auth/register", json={
            "email": "user@test.com"
        })
        assert resp.status_code == 400

    def test_register_duplicate_email(self, client, mock_mongo):
        """Registration with existing email returns 400."""
        mock_mongo["users"].find_one.return_value = {"email": "exists@test.com"}

        resp = client.post("/api/auth/register", json={
            "email": "exists@test.com",
            "password": "securepass123"
        })
        assert resp.status_code == 400
        data = resp.get_json()
        assert "already exists" in data["error"].lower()

    def test_register_empty_email(self, client):
        """Registration with empty email returns 400."""
        resp = client.post("/api/auth/register", json={
            "email": "",
            "password": "securepass123"
        })
        assert resp.status_code == 400

    def test_register_empty_password(self, client):
        """Registration with empty password returns 400."""
        resp = client.post("/api/auth/register", json={
            "email": "user@test.com",
            "password": ""
        })
        assert resp.status_code == 400


@pytest.mark.unit
class TestLogin:
    """POST /api/auth/login"""

    def test_login_success(self, client, mock_mongo, sample_user):
        """Login with valid credentials returns 200 + token."""
        # Create a proper bcrypt hash for the test password
        pw_hash = bcrypt.hashpw(b"correctpassword", bcrypt.gensalt())
        sample_user["password"] = pw_hash
        mock_mongo["users"].find_one.return_value = sample_user

        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "correctpassword"
        })

        assert resp.status_code == 200
        data = resp.get_json()
        assert "token" in data
        assert data["message"] == "Login successful"

    def test_login_wrong_password(self, client, mock_mongo, sample_user):
        """Login with wrong password returns 401."""
        pw_hash = bcrypt.hashpw(b"correctpassword", bcrypt.gensalt())
        sample_user["password"] = pw_hash
        mock_mongo["users"].find_one.return_value = sample_user

        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client, mock_mongo):
        """Login with unknown email returns 401."""
        mock_mongo["users"].find_one.return_value = None

        resp = client.post("/api/auth/login", json={
            "email": "nobody@test.com",
            "password": "anypassword"
        })
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        """Login with no JSON body returns error."""
        resp = client.post("/api/auth/login",
                           content_type="application/json",
                           data="{}")
        # Should either return 401 (no user found) or 400
        assert resp.status_code in (400, 401, 500)


@pytest.mark.unit
class TestProtectedRoutes:
    """JWT-protected endpoints"""

    def test_profile_without_token(self, client):
        """GET /api/auth/profile without JWT returns 401."""
        resp = client.get("/api/auth/profile")
        assert resp.status_code == 401

    def test_profile_with_valid_token(self, client, auth_headers, mock_mongo,
                                      sample_user):
        """GET /api/auth/profile with valid JWT returns user email."""
        mock_mongo["users"].find_one.return_value = sample_user

        resp = client.get("/api/auth/profile", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["email"] == "test@example.com"

    def test_clothes_without_token(self, client):
        """GET /api/clothes/ without JWT returns 401."""
        resp = client.get("/api/clothes/")
        assert resp.status_code == 401

    def test_upload_without_token(self, client):
        """POST /api/upload/ without JWT returns 401."""
        resp = client.post("/api/upload/")
        assert resp.status_code == 401

    def test_classify_without_token(self, client):
        """POST /api/classify/ without JWT returns 401."""
        resp = client.post("/api/classify/")
        assert resp.status_code == 401

    def test_outfits_without_token(self, client):
        """GET /api/outfits/plan without JWT returns 401."""
        resp = client.get("/api/outfits/plan")
        assert resp.status_code == 401
