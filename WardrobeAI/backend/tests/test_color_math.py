"""
Unit tests for outfit scoring and generation.
Tests: color_score, score_outfit, group_clothes_by_type, generate_outfits.
Matches actual code in app/services/outfit_service.py.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.services.outfit_service import (
    color_score,
    score_outfit,
    group_clothes_by_type,
    generate_outfits,
)


# ── Sample items for tests ─────────────────────────────────
def _shirt(colors=None, _id="s1"):
    return {
        "_id": _id,
        "type": "shirt",
        "colors": colors or [[200, 50, 50], [180, 40, 40], [220, 60, 60]],
    }


def _pants(colors=None, _id="p1"):
    return {
        "_id": _id,
        "type": "pants",
        "colors": colors or [[40, 40, 50], [60, 60, 70], [20, 20, 30]],
    }


def _shoes(colors=None, _id="sh1"):
    return {
        "_id": _id,
        "type": "shoes",
        "colors": colors or [[10, 10, 10], [30, 30, 30], [50, 50, 50]],
    }


@pytest.mark.unit
class TestColorScore:
    """color_score() — sum of pairwise RGB distance scores."""

    def test_identical_colors_high_score(self):
        """Identical colors → small diff → high score (30 per pair)."""
        c1 = [[100, 100, 100]]
        c2 = [[100, 100, 100]]
        score = color_score(c1, c2)
        assert score == 30  # diff = 0, which is < 100

    def test_similar_colors_high_score(self):
        """Similar colors (diff < 100) score 30 each."""
        c1 = [[100, 100, 100]]
        c2 = [[120, 110, 105]]
        score = color_score(c1, c2)
        # diff = 20+10+5 = 35 < 100 → 30
        assert score == 30

    def test_medium_diff_colors(self):
        """Medium diff (100–200) scores 15 each."""
        c1 = [[100, 100, 100]]
        c2 = [[200, 150, 50]]
        score = color_score(c1, c2)
        # diff = 100+50+50 = 200 → NOT < 200, so 5
        assert score == 5

    def test_very_different_colors_low_score(self):
        """Very different colors (diff >= 200) score 5 each."""
        c1 = [[0, 0, 0]]
        c2 = [[255, 255, 255]]
        score = color_score(c1, c2)
        # diff = 765 → 5
        assert score == 5

    def test_multiple_colors_summed(self):
        """Score sums across all color pairs."""
        c1 = [[100, 100, 100], [100, 100, 100]]
        c2 = [[100, 100, 100]]
        score = color_score(c1, c2)
        # Two pairs, both diff=0 → 30+30 = 60
        assert score == 60

    def test_empty_colors(self):
        """Empty color list → score 0."""
        assert color_score([], [[100, 100, 100]]) == 0
        assert color_score([[100, 100, 100]], []) == 0
        assert color_score([], []) == 0

    def test_boundary_diff_100(self):
        """Diff exactly at 100 boundary."""
        c1 = [[0, 0, 0]]
        c2 = [[50, 30, 20]]
        score = color_score(c1, c2)
        # diff = 100 → NOT < 100, check if < 200 → 15
        assert score == 15

    def test_boundary_diff_200(self):
        """Diff exactly at 200 boundary."""
        c1 = [[0, 0, 0]]
        c2 = [[100, 60, 40]]
        score = color_score(c1, c2)
        # diff = 200 → NOT < 200 → 5
        assert score == 5


@pytest.mark.unit
class TestScoreOutfit:
    """score_outfit() — scores a shirt+pants+shoes combo."""

    def test_matching_outfit_positive_score(self):
        """A complete outfit produces a positive score."""
        shirt = _shirt()
        pants = _pants()
        shoes = _shoes()
        score = score_outfit(shirt, pants, shoes)
        assert score > 0

    def test_identical_colors_max_score(self):
        """All items with same colors → max score."""
        same_colors = [[100, 100, 100], [100, 100, 100], [100, 100, 100]]
        shirt = _shirt(colors=same_colors)
        pants = _pants(colors=same_colors)
        shoes = _shoes(colors=same_colors)
        score = score_outfit(shirt, pants, shoes)
        # 3 pairs × 3×3 color combos × 30 = 3 × 9 × 30 = 810
        assert score == 810

    def test_score_is_sum_of_three_pairs(self):
        """Score = color_score(shirt,pants) + (shirt,shoes) + (pants,shoes)."""
        shirt = _shirt()
        pants = _pants()
        shoes = _shoes()

        expected = (color_score(shirt["colors"], pants["colors"]) +
                    color_score(shirt["colors"], shoes["colors"]) +
                    color_score(pants["colors"], shoes["colors"]))
        assert score_outfit(shirt, pants, shoes) == expected


@pytest.mark.unit
class TestGroupClothesByType:
    """group_clothes_by_type() — buckets items into shirt/pants/shoes."""

    def test_groups_correctly(self):
        """Items are placed in correct type buckets."""
        items = [_shirt(), _pants(), _shoes()]
        grouped = group_clothes_by_type(items)

        assert len(grouped["shirt"]) == 1
        assert len(grouped["pants"]) == 1
        assert len(grouped["shoes"]) == 1

    def test_empty_input(self):
        """No items → all empty lists."""
        grouped = group_clothes_by_type([])
        assert grouped["shirt"] == []
        assert grouped["pants"] == []
        assert grouped["shoes"] == []

    def test_unknown_type_ignored(self):
        """Items with unknown types are not placed in any group."""
        items = [{"_id": "x", "type": "hat", "colors": [[0, 0, 0]]}]
        grouped = group_clothes_by_type(items)
        assert grouped["shirt"] == []
        assert grouped["pants"] == []
        assert grouped["shoes"] == []

    def test_multiple_same_type(self):
        """Multiple shirts → all in 'shirt' bucket."""
        items = [_shirt(_id="s1"), _shirt(_id="s2"), _shirt(_id="s3")]
        grouped = group_clothes_by_type(items)
        assert len(grouped["shirt"]) == 3


@pytest.mark.unit
class TestGenerateOutfits:
    """generate_outfits() — generates scored outfit combinations."""

    def test_generates_outfits(self):
        """With 1 shirt, 1 pants, 1 shoes → 1 outfit."""
        clothes = [_shirt(), _pants(), _shoes()]
        outfits = generate_outfits(clothes)
        assert len(outfits) == 1
        assert "shirt" in outfits[0]
        assert "pants" in outfits[0]
        assert "shoes" in outfits[0]
        assert "score" in outfits[0]

    def test_max_ten_outfits(self):
        """Returns at most 10 outfits."""
        # 3 shirts × 3 pants × 3 shoes = 27 combos → capped at 10
        shirts = [_shirt(_id=f"s{i}") for i in range(3)]
        pants = [_pants(_id=f"p{i}") for i in range(3)]
        shoes = [_shoes(_id=f"sh{i}") for i in range(3)]
        outfits = generate_outfits(shirts + pants + shoes)
        assert len(outfits) <= 10

    def test_sorted_by_score_descending(self):
        """Outfits are sorted by score, highest first."""
        shirts = [_shirt(_id="s1"), _shirt(_id="s2")]
        pants = [_pants(_id="p1")]
        shoes = [_shoes(_id="sh1")]
        outfits = generate_outfits(shirts + pants + shoes)
        if len(outfits) >= 2:
            assert outfits[0]["score"] >= outfits[1]["score"]

    def test_empty_wardrobe(self):
        """No items → no outfits."""
        outfits = generate_outfits([])
        assert outfits == []

    def test_missing_type(self):
        """If no shoes, no outfits can be formed."""
        clothes = [_shirt(), _pants()]  # No shoes
        outfits = generate_outfits(clothes)
        assert outfits == []

    def test_outfit_ids_are_strings(self):
        """IDs in outfit are string-ified."""
        clothes = [_shirt(), _pants(), _shoes()]
        outfits = generate_outfits(clothes)
        assert isinstance(outfits[0]["shirt"], str)
        assert isinstance(outfits[0]["pants"], str)
        assert isinstance(outfits[0]["shoes"], str)


@pytest.mark.unit
class TestOutfitEndpoint:
    """GET /api/outfits/plan — outfit generation endpoint."""

    def test_plan_without_auth(self, client):
        """Plan endpoint without JWT returns 401."""
        resp = client.get("/api/outfits/plan")
        assert resp.status_code == 401

    @patch("app.routes.outfit_routes.generate_outfits")
    def test_plan_returns_outfits(self, mock_gen, client, auth_headers,
                                   mock_mongo):
        """Plan with valid auth returns outfit list."""
        mock_mongo["clothes"].find.return_value = [
            _shirt(), _pants(), _shoes()
        ]
        mock_gen.return_value = [
            {"shirt": "s1", "pants": "p1", "shoes": "sh1", "score": 90}
        ]

        resp = client.get("/api/outfits/plan", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["score"] == 90

    @patch("app.routes.outfit_routes.generate_outfits")
    def test_plan_empty_wardrobe(self, mock_gen, client, auth_headers,
                                  mock_mongo):
        """Empty wardrobe returns empty list."""
        mock_mongo["clothes"].find.return_value = []
        mock_gen.return_value = []

        resp = client.get("/api/outfits/plan", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.get_json()
        assert data == []
