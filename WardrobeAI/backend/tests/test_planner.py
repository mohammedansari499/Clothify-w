"""
Unit tests for outfit planning endpoint.
Tests: /api/outfits/plan endpoint behavior.
Matches actual code in app/routes/outfit_routes.py.
"""
import pytest
from unittest.mock import patch, MagicMock


@pytest.mark.unit
class TestOutfitPlanEndpoint:
    """GET /api/outfits/plan"""

    def test_plan_without_auth(self, client):
        """Plan endpoint without JWT returns 401."""
        resp = client.get("/api/outfits/plan")
        assert resp.status_code == 401

    @patch("app.routes.outfit_routes.generate_outfits")
    def test_plan_returns_list(self, mock_gen, client, auth_headers,
                                mock_mongo):
        """Plan returns a JSON list of outfits."""
        mock_mongo["clothes"].find.return_value = []
        mock_gen.return_value = []

        resp = client.get("/api/outfits/plan", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)

    @patch("app.routes.outfit_routes.generate_outfits")
    def test_plan_with_outfits(self, mock_gen, client, auth_headers,
                                mock_mongo, sample_clothes):
        """Plan with items returns scored outfits."""
        mock_mongo["clothes"].find.return_value = sample_clothes
        mock_gen.return_value = [
            {"shirt": "cloth_1", "pants": "cloth_2",
             "shoes": "cloth_3", "score": 120}
        ]

        resp = client.get("/api/outfits/plan", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 1
        assert data[0]["score"] == 120

    @patch("app.routes.outfit_routes.generate_outfits")
    def test_plan_queries_user_clothes(self, mock_gen, client,
                                        auth_headers, mock_mongo):
        """Plan endpoint queries clothes for the authenticated user."""
        mock_mongo["clothes"].find.return_value = []
        mock_gen.return_value = []

        client.get("/api/outfits/plan", headers=auth_headers())

        # Verify find was called with the user_id
        mock_mongo["clothes"].find.assert_called_once()
        call_args = mock_mongo["clothes"].find.call_args
        query = call_args[0][0]
        assert "user_id" in query

    @patch("app.routes.outfit_routes.generate_outfits")
    def test_plan_passes_clothes_to_generator(self, mock_gen, client,
                                               auth_headers, mock_mongo):
        """Plan passes fetched clothes to generate_outfits()."""
        fake_clothes = [{"_id": "c1", "type": "shirt", "colors": []}]
        mock_mongo["clothes"].find.return_value = fake_clothes
        mock_gen.return_value = []

        client.get("/api/outfits/plan", headers=auth_headers())

        mock_gen.assert_called_once()
        passed_clothes = mock_gen.call_args[0][0]
        assert len(passed_clothes) > 0
