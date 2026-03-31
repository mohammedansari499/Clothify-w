"""
Unit tests for clothes routes.
Tests: add, list, delete clothing items.
Matches actual code in app/routes/clothes_routes.py.
"""
import pytest
from unittest.mock import MagicMock
from datetime import datetime


@pytest.mark.unit
class TestAddClothing:
    """POST /api/clothes/"""

    def test_add_without_auth(self, client):
        """Add clothing without JWT returns 401."""
        resp = client.post("/api/clothes/", json={
            "image_url": "uploads/shirt.jpg",
            "type": "shirt"
        })
        assert resp.status_code == 401

    def test_add_success(self, client, auth_headers, mock_mongo):
        """Add clothing with valid data returns success."""
        mock_mongo["clothes"].insert_one.return_value = MagicMock(
            inserted_id="new_cloth_id"
        )

        resp = client.post("/api/clothes/", json={
            "image_url": "uploads/shirt.jpg",
            "type": "shirt",
            "colors": [[200, 50, 50], [100, 100, 100]],
            "occasion_tags": ["casual"]
        }, headers=auth_headers())

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Clothing item added"
        assert "id" in data

    def test_add_missing_image_url(self, client, auth_headers):
        """Add clothing without image_url returns 400."""
        resp = client.post("/api/clothes/", json={
            "type": "shirt"
        }, headers=auth_headers())
        assert resp.status_code == 400

    def test_add_missing_type(self, client, auth_headers):
        """Add clothing without type returns 400."""
        resp = client.post("/api/clothes/", json={
            "image_url": "uploads/shirt.jpg"
        }, headers=auth_headers())
        assert resp.status_code == 400

    def test_add_missing_both_required(self, client, auth_headers):
        """Add clothing without required fields returns 400."""
        resp = client.post("/api/clothes/", json={},
                           headers=auth_headers())
        assert resp.status_code == 400


@pytest.mark.unit
class TestGetClothes:
    """GET /api/clothes/"""

    def test_get_without_auth(self, client):
        """Get clothes without JWT returns 401."""
        resp = client.get("/api/clothes/")
        assert resp.status_code == 401

    def test_get_empty_wardrobe(self, client, auth_headers, mock_mongo):
        """Get clothes returns empty list when no items."""
        mock_mongo["clothes"].find.return_value = iter([])

        resp = client.get("/api/clothes/", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_with_items(self, client, auth_headers, mock_mongo,
                             sample_clothes):
        """Get clothes returns list of user's items."""
        mock_mongo["clothes"].find.return_value = iter(sample_clothes)

        resp = client.get("/api/clothes/", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        assert len(data) == 3

    def test_get_returns_serialized_ids(self, client, auth_headers,
                                         mock_mongo, sample_clothes):
        """Returned items have _id as string."""
        mock_mongo["clothes"].find.return_value = iter(sample_clothes)

        resp = client.get("/api/clothes/", headers=auth_headers())
        data = resp.get_json()
        for item in data:
            assert isinstance(item["_id"], str)


@pytest.mark.unit
class TestDeleteClothing:
    """DELETE /api/clothes/<id>"""

    def test_delete_without_auth(self, client):
        """Delete without JWT returns 401."""
        resp = client.delete("/api/clothes/abc123")
        assert resp.status_code == 401

    def test_delete_success(self, client, auth_headers, mock_mongo):
        """Delete existing item returns success."""
        mock_mongo["clothes"].delete_one.return_value = MagicMock(
            deleted_count=1
        )

        resp = client.delete("/api/clothes/507f1f77bcf86cd799439011",
                              headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Item deleted"

    def test_delete_nonexistent(self, client, auth_headers, mock_mongo):
        """Delete nonexistent item returns 404."""
        mock_mongo["clothes"].delete_one.return_value = MagicMock(
            deleted_count=0
        )

        resp = client.delete("/api/clothes/507f1f77bcf86cd799439011",
                              headers=auth_headers())
        assert resp.status_code == 404
