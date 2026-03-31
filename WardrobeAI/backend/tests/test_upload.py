"""
Unit tests for file upload endpoint.
Tests: POST /api/upload/ behavior.
Matches actual code in app/routes/upload_routes.py.
"""
import pytest
from unittest.mock import patch
from io import BytesIO
import os


@pytest.mark.unit
class TestUploadEndpoint:
    """POST /api/upload/"""

    def test_upload_without_auth(self, client):
        """Upload without JWT returns 401."""
        resp = client.post("/api/upload/")
        assert resp.status_code == 401

    def test_upload_no_file(self, client, auth_headers):
        """Upload with no file returns 400."""
        resp = client.post("/api/upload/", headers=auth_headers())
        assert resp.status_code == 400
        data = resp.get_json()
        assert "no file" in data["error"].lower()

    @patch("app.routes.upload_routes.os.makedirs")
    def test_upload_empty_filename(self, mock_makedirs, client, auth_headers):
        """Upload with empty filename returns 400."""
        data = {
            "file": (BytesIO(b"fake image content"), "")
        }
        # Remove Content-Type: application/json from headers
        headers = auth_headers()
        del headers["Content-Type"]

        resp = client.post("/api/upload/",
                           data=data,
                           content_type="multipart/form-data",
                           headers=headers)
        assert resp.status_code == 400

    @patch("werkzeug.datastructures.FileStorage.save")
    @patch("app.routes.upload_routes.os.makedirs")
    def test_upload_success(self, mock_makedirs, mock_save, client,
                             auth_headers):
        """Upload valid file returns success + image_url."""
        data = {
            "file": (BytesIO(b"fake image content"), "shirt.jpg")
        }
        headers = auth_headers()
        del headers["Content-Type"]

        resp = client.post("/api/upload/",
                           data=data,
                           content_type="multipart/form-data",
                           headers=headers)
        assert resp.status_code == 200
        result = resp.get_json()
        assert result["message"] == "File uploaded successfully"
        assert "image_url" in result

    @patch("werkzeug.datastructures.FileStorage.save")
    @patch("app.routes.upload_routes.os.makedirs")
    def test_upload_returns_path(self, mock_makedirs, mock_save, client,
                                  auth_headers):
        """Upload returns the file path as image_url."""
        data = {
            "file": (BytesIO(b"content"), "test_image.png")
        }
        headers = auth_headers()
        del headers["Content-Type"]

        resp = client.post("/api/upload/",
                           data=data,
                           content_type="multipart/form-data",
                           headers=headers)
        result = resp.get_json()
        assert "test_image.png" in result["image_url"]
