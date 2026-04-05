"""
Smart outfit planning service.
Generates a 7-day outfit plan using color contrast matching,
wear-count awareness, and variety optimization.
Works with even just 2-3 items by reusing them across different days.
"""
import random
import colorsys
import math
from itertools import product as itertools_product


# Map all clothing types to outfit slots
TOP_TYPES = {"shirt", "tshirt", "formal_shirt", "hoodie", "sweater", "kurta", "sherwani", "blazer"}
BOTTOM_TYPES = {"jeans", "formal_pants", "cargo_pants", "shorts", "track_pants", "pyjama", "pants", "skirt"}
SHOE_TYPES = {"shoes", "sneakers", "loafers", "sandals", "slippers"}
OUTERWEAR_TYPES = {"jacket", "coat", "blazer", "hoodie", "sweater"}
ACCESSORY_TYPES = {"watch", "belt", "cap", "socks", "ring", "chain", "bracelet", "tie", "scarf", "bag", "accessories"}

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

DAY_STYLES = {
    "Monday": "semi-formal",
    "Tuesday": "semi-formal",
    "Wednesday": "casual",
    "Thursday": "semi-formal",
    "Friday": "casual",
    "Saturday": "casual",
    "Sunday": "casual",
}


def _rgb_to_hsl(r, g, b):
    """Convert RGB (0-255) to HSL (0-360, 0-100, 0-100)."""
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, s * 100, l * 100


def _color_contrast_score(color1, color2):
    """
    Score how well two RGB colors contrast.
    Higher = better contrast = better outfit pairing.
    Uses HSL distance for perceptually accurate matching.
    """
    if not color1 or not color2:
        return 50  # neutral if missing

    h1, s1, l1 = _rgb_to_hsl(*color1)
    h2, s2, l2 = _rgb_to_hsl(*color2)

    # Hue distance (circular, 0-180)
    hue_diff = min(abs(h1 - h2), 360 - abs(h1 - h2))

    # Lightness contrast (dark top + light bottom or vice versa)
    lightness_diff = abs(l1 - l2)

    # Saturation harmony (similar saturation = harmonious)
    sat_diff = abs(s1 - s2)

    score = 0

    # Complementary colors (hue_diff ~120-180) = high contrast, great pairing
    if hue_diff > 120:
        score += 35
    elif hue_diff > 60:
        score += 25  # Analogous-complementary
    elif hue_diff > 30:
        score += 15  # Triadic-like
    elif hue_diff < 10:
        score += 10  # Monochromatic (acceptable if lightness differs)

    # Lightness contrast rewards
    if lightness_diff > 40:
        score += 30  # Strong contrast (e.g., dark top + light bottom)
    elif lightness_diff > 20:
        score += 20  # Good contrast
    elif lightness_diff > 10:
        score += 10  # Subtle
    else:
        score += 5   # Too similar

    # Saturation harmony bonus
    if sat_diff < 20:
        score += 10  # Colors "feel" similar intensity

    # Classic combos bonus
    is_neutral1 = s1 < 15  # grays, blacks, whites
    is_neutral2 = s2 < 15
    if is_neutral1 or is_neutral2:
        score += 15  # Neutrals go with everything

    return min(score, 100)


def _get_primary_color(item):
    """Get the primary color from an item, with fallback."""
    if item.get("primary_color"):
        return item["primary_color"]
    if item.get("colors") and len(item["colors"]) > 0:
        return item["colors"][0]
    return [128, 128, 128]


def _wear_penalty(item):
    """Items worn more often get a slight penalty to encourage variety."""
    count = item.get("wear_count", 0)
    if count == 0:
        return 5   # Bonus for unworn items
    elif count <= 2:
        return 0
    elif count <= 5:
        return -5
    else:
        return -10  # Heavily worn, suggest less


def _serialize_item(item):
    """Convert an item to JSON-safe format for API response."""
    return {
        "_id": str(item["_id"]),
        "type": item.get("type", "unknown"),
        "style": item.get("style", "casual"),
        "image_url": item.get("image_url", ""),
        "primary_color": _get_primary_color(item),
        "color_name": item.get("color_name", ""),
        "colors": item.get("colors", []),
        "wear_count": item.get("wear_count", 0),
        "occasion_tags": item.get("occasion_tags", []),
    }


def _group_by_slot(clothes):
    """Group clothes into outfit slots: tops, bottoms, shoes, outerwear, accessories."""
    slots = {
        "top": [],
        "bottom": [],
        "shoes": [],
        "outerwear": [],
        "accessory": [],
    }

    for item in clothes:
        item_type = item.get("type", "unknown")
        if item_type in TOP_TYPES:
            slots["top"].append(item)
        elif item_type in BOTTOM_TYPES:
            slots["bottom"].append(item)
        elif item_type in SHOE_TYPES:
            slots["shoes"].append(item)
        elif item_type in OUTERWEAR_TYPES:
            slots["outerwear"].append(item)
        elif item_type in ACCESSORY_TYPES:
            slots["accessory"].append(item)
        else:
            # Try to guess based on the type name
            if "shirt" in item_type or "top" in item_type:
                slots["top"].append(item)
            elif "pant" in item_type or "jean" in item_type or "short" in item_type:
                slots["bottom"].append(item)
            elif "shoe" in item_type or "sneak" in item_type:
                slots["shoes"].append(item)

    return slots


def _score_combo(top, bottom, shoes=None):
    """Score an outfit combination based on color contrast and variety."""
    top_color = _get_primary_color(top)
    bottom_color = _get_primary_color(bottom)

    score = _color_contrast_score(top_color, bottom_color)
    score += _wear_penalty(top)
    score += _wear_penalty(bottom)

    if shoes:
        shoe_color = _get_primary_color(shoes)
        score += _color_contrast_score(bottom_color, shoe_color) * 0.5
        score += _wear_penalty(shoes)

    return round(max(0, min(score, 100)))


def generate_outfits(clothes):
    """
    Generate a 7-day outfit plan.
    Works with any number of items — even just 1 top and 1 bottom.
    Returns a list of 7 day objects, each with a ranked outfit combo.
    """
    if not clothes:
        return []

    slots = _group_by_slot(clothes)
    tops = slots["top"]
    bottoms = slots["bottom"]
    shoes_list = slots["shoes"]
    outerwear = slots["outerwear"]

    # If user has no tops or bottoms, return whatever we have
    if not tops and not bottoms:
        return []

    # Generate all possible combos
    all_combos = []

    if tops and bottoms:
        for top in tops:
            for bottom in bottoms:
                shoe = random.choice(shoes_list) if shoes_list else None
                score = _score_combo(top, bottom, shoe)
                combo = {
                    "top": _serialize_item(top),
                    "bottom": _serialize_item(bottom),
                    "score": score,
                }
                if shoe:
                    combo["shoes"] = _serialize_item(shoe)
                if outerwear:
                    combo["outerwear"] = _serialize_item(random.choice(outerwear))
                all_combos.append(combo)
    elif tops:
        # Only tops, no bottoms
        for top in tops:
            combo = {
                "top": _serialize_item(top),
                "score": 50 + _wear_penalty(top),
            }
            all_combos.append(combo)
    elif bottoms:
        # Only bottoms, no tops
        for bottom in bottoms:
            combo = {
                "bottom": _serialize_item(bottom),
                "score": 50 + _wear_penalty(bottom),
            }
            all_combos.append(combo)

    # Sort by score
    all_combos.sort(key=lambda x: x["score"], reverse=True)

    # Build 7-day plan
    weekly_plan = []
    used_indices = set()
    num_combos = len(all_combos)

    for i, day in enumerate(DAYS):
        if num_combos == 0:
            break

        # Pick the best unused combo, cycling back if we have fewer than 7
        combo_idx = i % num_combos

        # Try to avoid repeating consecutive days
        if num_combos > 1 and combo_idx in used_indices:
            for alt in range(num_combos):
                if alt not in used_indices:
                    combo_idx = alt
                    break
            else:
                used_indices.clear()
                combo_idx = i % num_combos

        used_indices.add(combo_idx)
        combo = all_combos[combo_idx].copy()
        combo["day"] = day
        combo["day_index"] = i
        combo["suggested_style"] = DAY_STYLES.get(day, "casual")
        weekly_plan.append(combo)

    return weekly_plan
