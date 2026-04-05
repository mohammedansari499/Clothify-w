import pytest
from unittest.mock import patch, MagicMock
from app.services.outfit_service import (
    _color_contrast_score,
    _score_combo,
    _group_by_slot,
    generate_outfits,
)

# ── Sample items for tests ─────────────────────────────────
def _shirt(color=None, _id="s1"):
    return {
        "_id": _id,
        "type": "shirt",
        "colors": [color or [200, 50, 50]],
        "wear_count": 0
    }

def _pants(color=None, _id="p1"):
    return {
        "_id": _id,
        "type": "pants",
        "colors": [color or [40, 40, 50]],
        "wear_count": 0
    }

def _shoes(color=None, _id="sh1"):
    return {
        "_id": _id,
        "type": "shoes",
        "colors": [color or [10, 10, 10]],
        "wear_count": 0
    }

@pytest.mark.unit
class TestColorScore:
    """_color_contrast_score() — pairwise RGB distance score."""

    def test_identical_colors_score(self):
        """Identical colors might be monochromatic."""
        c1 = [100, 100, 100]
        c2 = [100, 100, 100]
        score = _color_contrast_score(c1, c2)
        # Should get monochromatic bonus + neutral bonus + etc
        assert isinstance(score, int)
        assert score >= 0

    def test_high_contrast_colors(self):
        """Complementary colors score higher."""
        c1 = [255, 0, 0] # Red
        c2 = [0, 255, 255] # Cyan
        score = _color_contrast_score(c1, c2)
        assert score >= 35 # Complementary hue diff > 120

    def test_empty_colors(self):
        """Empty color list → score 50 (neutral)."""
        assert _color_contrast_score(None, [100, 100, 100]) == 50
        assert _color_contrast_score([100, 100, 100], None) == 50
        assert _color_contrast_score(None, None) == 50

@pytest.mark.unit
class TestScoreOutfit:
    """_score_combo() — scores a top+bottom(+shoes) combo."""

    def test_matching_outfit_positive_score(self):
        """A complete outfit produces a positive score."""
        shirt = _shirt()
        pants = _pants()
        shoes = _shoes()
        score = _score_combo(shirt, pants, shoes)
        assert score > 0

    def test_wear_penalty(self):
        """Heavily worn items get a penalty."""
        shirt1 = _shirt()
        shirt1["wear_count"] = 0
        score1 = _score_combo(shirt1, _pants())

        shirt2 = _shirt()
        shirt2["wear_count"] = 10
        score2 = _score_combo(shirt2, _pants())

        assert score1 > score2


@pytest.mark.unit
class TestGroupClothesByType:
    """_group_by_slot() — buckets items into top/bottom/shoes."""

    def test_groups_correctly(self):
        """Items are placed in correct type buckets."""
        items = [_shirt(), _pants(), _shoes()]
        grouped = _group_by_slot(items)

        assert len(grouped["top"]) == 1
        assert len(grouped["bottom"]) == 1
        assert len(grouped["shoes"]) == 1

    def test_empty_input(self):
        """No items → all empty lists."""
        grouped = _group_by_slot([])
        assert grouped["top"] == []
        assert grouped["bottom"] == []
        assert grouped["shoes"] == []


@pytest.mark.unit
class TestGenerateOutfits:
    """generate_outfits() — generates scored outfit combinations for a week."""

    def test_generates_outfits(self):
        """With 1 shirt, 1 pants, 1 shoes → generates 7 days."""
        clothes = [_shirt(), _pants(), _shoes()]
        outfits = generate_outfits(clothes)
        assert len(outfits) == 7
        assert "top" in outfits[0]
        assert "bottom" in outfits[0]
        assert "shoes" in outfits[0]
        assert "score" in outfits[0]
        assert "day" in outfits[0]

    def test_empty_wardrobe(self):
        """No items → no outfits."""
        outfits = generate_outfits([])
        assert outfits == []

    def test_missing_bottoms(self):
        """If tops only, should adapt or return no bottoms."""
        clothes = [_shirt(), _shirt(_id="s2")]
        outfits = generate_outfits(clothes)
        assert len(outfits) == 7
        assert "top" in outfits[0]
        assert "bottom" not in outfits[0]

@pytest.mark.unit
class TestOutfitEndpoint:
    """GET /api/outfits/plan — outfit generation endpoint."""

    def test_plan_without_auth(self, client):
        """Plan endpoint without JWT returns 401."""
        resp = client.get("/api/outfits/plan")
        assert resp.status_code == 401

    @patch("app.routes.outfit_routes.generate_outfits")
    def test_plan_returns_outfits(self, mock_gen, client, auth_headers, mock_mongo):
        """Plan with valid auth returns outfit list."""
        mock_mongo["clothes"].find.return_value = [
            _shirt(), _pants(), _shoes()
        ]
        mock_gen.return_value = [
            {"top": {"_id": "s1"}, "bottom": {"_id": "p1"}, "day": "Monday"}
        ]

        resp = client.get("/api/outfits/plan", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["day"] == "Monday"

    @patch("app.routes.outfit_routes.generate_outfits")
    def test_plan_empty_wardrobe(self, mock_gen, client, auth_headers, mock_mongo):
        """Empty wardrobe returns empty list."""
        mock_mongo["clothes"].find.return_value = []
        mock_gen.return_value = []

        resp = client.get("/api/outfits/plan", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert data == []
