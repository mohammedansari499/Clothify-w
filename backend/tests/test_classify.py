"""
Unit tests for AI classification pipeline.
Tests: extract_colors, classify_clothing, analyze_clothing, classify endpoint.
Matches actual code in app/services/classifier_service.py.
"""
import pytest
from unittest.mock import patch, MagicMock
import numpy as np
import cv2
import os
import tempfile


@pytest.mark.unit
class TestExtractColors:
    """extract_colors() — OpenCV KMeans color extraction."""

    def test_extract_from_valid_image(self):
        """Valid image path returns a valid color dictionary."""
        from app.ai.color_extractor import extract_colors

        # Create a temporary red test image
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        img[:, :] = [0, 0, 200]  # BGR red
        f = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        tmp_path = f.name
        f.close()
        cv2.imwrite(tmp_path, img)

        try:
            result = extract_colors(tmp_path)
            assert isinstance(result, dict)
            assert "primary_color" in result
            assert len(result["primary_color"]) == 3
            assert isinstance(result.get("color_name"), str)
        finally:
            os.unlink(tmp_path)

    @pytest.mark.skip(reason="OpenCV file I/O blocking with NamedTemporaryFile on Windows")
    def test_extract_returns_three_clusters(self):
        """Extracts up to 3 dominant colors."""
        from app.ai.color_extractor import extract_colors

        # Create multi-color image: red top, green middle, blue bottom
        img = np.zeros((300, 100, 3), dtype=np.uint8)
        img[0:100, :] = [0, 0, 200]    # Red (BGR)
        img[100:200, :] = [0, 200, 0]  # Green (BGR)
        img[200:300, :] = [200, 0, 0]  # Blue (BGR)
        f = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        tmp_path = f.name
        f.close()
        cv2.imwrite(tmp_path, img)

        try:
            result = extract_colors(tmp_path)
            assert "secondary_colors" in result
        finally:
            os.unlink(tmp_path)

    def test_extract_from_nonexistent_file(self):
        """Nonexistent image path returns defaults."""
        from app.ai.color_extractor import extract_colors

        result = extract_colors("/nonexistent/path.jpg")
        assert result["primary_color"] == [128, 128, 128]


@pytest.mark.unit
class TestClassifyClothing:
    """classify_image() — random label classifier (placeholder) or mobilenet."""

    def test_returns_valid_label(self):
        """Returns one of the known clothing labels."""
        from app.ai.classifier import classify_image

        valid_labels = ["shirt", "tshirt", "formal_shirt", "pants", "jeans", "formal_pants", "cargo_pants",
                        "jacket", "coat", "hoodie", "sweater", "blazer", "dress", "shoes", "sneakers",
                        "loafers", "sandals", "slippers", "outerwear", "accessories", "formal_top",
                        "skirt", "shorts", "track_pants", "pyjama", "kurta", "sherwani",
                        "watch", "belt", "cap", "socks", "ring", "chain", "bracelet", "tie",
                        "scarf", "bag", "sportswear", "tracksuit", "unknown"]
        result = classify_image("any_path.jpg")
        assert result["type"] in valid_labels

    def test_returns_dict(self):
        """Return type is a dict."""
        from app.ai.classifier import classify_image

        result = classify_image("test.jpg")
        assert isinstance(result, dict)
        assert "type" in result

    def test_consistent_valid_output(self):
        """Multiple calls all return valid labels."""
        from app.ai.classifier import classify_image

        valid_labels = ["shirt", "tshirt", "formal_shirt", "pants", "jeans", "formal_pants", "cargo_pants",
                        "jacket", "coat", "hoodie", "sweater", "blazer", "dress", "shoes", "sneakers",
                        "loafers", "sandals", "slippers", "outerwear", "accessories", "formal_top",
                        "skirt", "shorts", "track_pants", "pyjama", "kurta", "sherwani",
                        "watch", "belt", "cap", "socks", "ring", "chain", "bracelet", "tie",
                        "scarf", "bag", "sportswear", "tracksuit", "unknown"]
        for _ in range(5):
            result = classify_image("test.jpg")
            assert result["type"] in valid_labels


@pytest.mark.unit
class TestAnalyzeClothing:
    """analyze_clothing() — combined classification + color extraction."""

    @patch("app.services.classifier_service.classify_image",
           return_value={"type": "shirt", "label": "shirt", "confidence": 0.99, "style": "semi-formal"})
    @patch("app.services.classifier_service.extract_colors",
           return_value={"primary_color": [200, 50, 50], "color_name": "Red", "secondary_colors": [[100, 100, 100], [50, 50, 200]]})
    def test_returns_type_and_colors(self, mock_colors, mock_classify):
        """Returns dict with 'type' and 'colors' keys."""
        from app.services.classifier_service import analyze_clothing

        result = analyze_clothing("test.jpg")
        assert "type" in result
        assert "colors" in result
        assert result["type"] == "shirt"
        assert len(result["colors"]) == 3

    @patch("app.services.classifier_service.classify_image",
           return_value={"type": "dress", "label": "dress", "confidence": 0.99, "style": "semi-formal"})
    @patch("app.services.classifier_service.extract_colors",
           return_value={"primary_color": [0, 0, 0], "color_name": "Black", "secondary_colors": []})
    def test_returns_correct_type(self, mock_colors, mock_classify):
        """Type field matches classifier output."""
        from app.services.classifier_service import analyze_clothing

        result = analyze_clothing("test.jpg")
        assert result["type"] == "dress"


@pytest.mark.unit
class TestClassifyEndpoint:
    """POST /api/classify/ — classify endpoint."""

    def test_classify_without_auth(self, client):
        """Classify without JWT returns 401."""
        resp = client.post("/api/classify/")
        assert resp.status_code == 401

    @patch("app.config.db.clothes_collection")
    @patch("app.routes.classify_routes.analyze_clothing")
    def test_classify_with_image_url(self, mock_analyze, mock_db, client,
                                      auth_headers):
        """Classify with image_url returns classification result."""
        mock_analyze.return_value = {
            "type": "shirt",
            "colors": [[200, 50, 50], [100, 100, 100], [50, 50, 200]],
            "primary_color": [200, 50, 50],
            "occasion_tags": ["casual"],
        }
        mock_insert = MagicMock()
        mock_insert.inserted_id = "abc123def456abc123def456"
        mock_db.insert_one.return_value = mock_insert

        resp = client.post("/api/classify/",
                           json={"image_url": "http://127.0.0.1:5000/uploads/shirt.jpg"},
                           headers=auth_headers())
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["item"]["type"] == "shirt"
        assert "colors" in data["item"]

    @patch("app.config.db.clothes_collection")
    @patch("app.routes.classify_routes.analyze_clothing")
    def test_classify_returns_colors(self, mock_analyze, mock_db, client,
                                      auth_headers):
        """Classify endpoint includes color data in response."""
        mock_analyze.return_value = {
            "type": "pants",
            "colors": [[40, 40, 50], [60, 60, 70], [20, 20, 30]],
            "primary_color": [40, 40, 50],
            "occasion_tags": ["casual"],
        }
        mock_insert = MagicMock()
        mock_insert.inserted_id = "abc123def456abc123def456"
        mock_db.insert_one.return_value = mock_insert

        resp = client.post("/api/classify/",
                           json={"image_url": "http://127.0.0.1:5000/uploads/pants.jpg"},
                           headers=auth_headers())
        assert resp.status_code == 201
        data = resp.get_json()
        assert len(data["item"]["colors"]) == 3
