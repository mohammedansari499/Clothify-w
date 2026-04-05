"""
classifier_service.py — Thin orchestrator for clothing analysis.

Calls:
  - app.ai.classifier.classify_image()    → MobileNetV2 local inference
  - app.ai.color_extractor.extract_colors() → CIELAB KMeans++ colour extraction

Exposes analyze_clothing(image_path) for backward compatibility with routes.
"""
import colorsys
import logging

from app.ai.classifier import classify_image
from app.ai.color_extractor import extract_colors, get_color_name

logger = logging.getLogger(__name__)


# Style hints from clothing type (used for occasion tagging)
STYLE_MAP = {
    "tshirt": "casual", "shirt": "semi-formal", "formal_shirt": "formal",
    "blazer": "formal", "coat": "formal",
    "jacket": "casual", "hoodie": "casual", "sweater": "casual",
    "kurta": "traditional", "sherwani": "traditional",
    "jeans": "casual", "formal_pants": "formal", "cargo_pants": "casual",
    "shorts": "casual", "track_pants": "casual", "pyjama": "casual",
    "dress": "semi-formal", "skirt": "semi-formal",
    "sneakers": "casual", "loafers": "semi-formal", "shoes": "formal",
    "sandals": "casual", "slippers": "casual",
    "sportswear": "athletic", "tracksuit": "athletic",
    "watch": "accessory", "belt": "accessory", "cap": "casual",
    "socks": "accessory", "ring": "accessory", "chain": "accessory",
    "bracelet": "accessory", "tie": "formal", "scarf": "casual",
    "bag": "accessory", "accessories": "accessory",
    "unknown": "casual",
}


def _color_formality(hsv):
    """Determine colour formality based on HSV values."""
    h, s, v = hsv
    if v < 35 and s < 20:
        return "formal"
    if v < 35:
        return "formal"
    if s > 70 and v > 60:
        return "casual"
    return "neutral"


def _get_occasion_tags(clothing_type, primary_rgb):
    """Generate occasion tags from type + colour."""
    style = STYLE_MAP.get(clothing_type, "casual")

    base_tags = {
        "formal": ["formal", "business", "office"],
        "semi-formal": ["semi-formal", "office", "casual"],
        "casual": ["casual", "everyday"],
        "traditional": ["traditional", "festive", "wedding"],
        "athletic": ["athletic", "gym", "sports"],
        "accessory": ["accessory"],
    }

    tags = set(base_tags.get(style, ["casual"]))

    # Colour-based formality adjustment
    r, g, b = primary_rgb[0] / 255, primary_rgb[1] / 255, primary_rgb[2] / 255
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    hsv_scaled = [h * 360, s * 100, v * 100]
    formality = _color_formality(hsv_scaled)

    if formality == "formal":
        tags.add("formal")
        tags.discard("athletic")
    elif formality == "casual":
        tags.add("casual")

    return list(tags)


def analyze_clothing(image_path):
    """
    Full AI pipeline: classify + colour extract + occasion tag.

    Args:
        image_path: Path to the uploaded image file.

    Returns:
        {
          "type": str,
          "style": str,
          "colors": [[r,g,b], ...],
          "primary_color": [r,g,b],
          "color_name": str,
          "secondary_colors": [[r,g,b], ...],
          "occasion_tags": [str, ...],
          "classification_details": {...},
        }
    """
    # Step 1: Classify clothing type (MobileNetV2)
    classification = classify_image(image_path)
    logger.info(
        f"[classify] type={classification['type']} "
        f"conf={classification['confidence']:.2%}"
    )

    # Step 2: Extract colours (CIELAB KMeans++)
    color_result = extract_colors(image_path)
    primary_color = color_result["primary_color"]
    secondary_colors = color_result["secondary_colors"]
    color_name = color_result["color_name"]
    logger.info(f"[color] name={color_name} rgb={primary_color}")

    # Step 3: Occasion tags
    occasion_tags = _get_occasion_tags(classification["type"], primary_color)

    # Build colours list for backward compat
    all_colors = [primary_color] + secondary_colors

    return {
        "type": classification["type"],
        "style": classification.get("style", "casual"),
        "colors": all_colors,
        "primary_color": primary_color,
        "color_name": color_name,
        "secondary_colors": secondary_colors,
        "occasion_tags": occasion_tags,
        "classification_details": classification,
    }
