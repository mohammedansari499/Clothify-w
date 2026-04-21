"""
classifier_service.py - Thin orchestrator for clothing analysis.
"""
import colorsys
import logging

from app.ai.classifier import classify_image
from app.ai.color_extractor import extract_colors

logger = logging.getLogger(__name__)

STYLE_TAGS = {
    "formal": ["formal", "business", "office"],
    "semi-formal": ["semi-formal", "office", "casual"],
    "casual": ["casual", "everyday"],
    "traditional": ["traditional", "festive", "wedding"],
    "athletic": ["athletic", "gym", "sports"],
    "accessory": ["accessory"],
}


def _color_formality(hsv):
    """Determine color formality based on HSV values."""
    _, s, v = hsv
    if v < 35 and s < 20:
        return "formal"
    if v < 35:
        return "formal"
    if s > 70 and v > 60:
        return "casual"
    return "neutral"


def _normalize_style(style):
    normalized = str(style or "casual").strip().lower().replace("_", "-")
    aliases = {
        "semiformal": "semi-formal",
        "semi formal": "semi-formal",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized if normalized in STYLE_TAGS else "casual"


def _get_occasion_tags(style, primary_rgb):
    """Generate occasion tags from classifier style + dominant color."""
    tags = set(STYLE_TAGS.get(style, STYLE_TAGS["casual"]))

    if not primary_rgb or len(primary_rgb) < 3:
        return list(tags)

    r, g, b = primary_rgb[0] / 255, primary_rgb[1] / 255, primary_rgb[2] / 255
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    hsv_scaled = [h * 360, s * 100, v * 100]
    formality = _color_formality(hsv_scaled)

    if formality == "formal" and style in {"formal", "semi-formal", "casual"}:
        tags.add("formal")
        tags.discard("athletic")
    elif formality == "casual" and style != "formal":
        tags.add("casual")

    return list(tags)


def _analysis_failure(code, message, classification=None, color_result=None):
    payload = {
        "ok": False,
        "error": code,
        "message": message,
    }
    if classification is not None:
        payload["classification_details"] = classification
    if color_result is not None:
        payload["color_details"] = color_result
    return payload


def analyze_clothing(image_path):
    """
    Full AI pipeline: classify + color extract + occasion tag.
    """
    classification = classify_image(image_path)
    if not classification.get("ok"):
        classifier_error = classification.get("error", "classification_failed")
        if classifier_error == "low_confidence":
            message = (
                "The image appears ambiguous (multiple garment cues). "
                "Try a tighter single-item crop for better classification."
            )
        else:
            message = "Could not classify this image."
        logger.warning(
            "[classify] failed error=%s type=%s",
            classifier_error,
            classification.get("type"),
        )
        return _analysis_failure(
            classifier_error,
            message,
            classification=classification,
        )

    item_type = classification.get("type", "unknown")
    style = _normalize_style(classification.get("style", "casual"))
    category = classification.get("category")

    logger.info(
        "[classify] type=%s category=%s conf=%.2f%%",
        item_type,
        category,
        float(classification.get("confidence", 0.0)) * 100,
    )

    color_result = extract_colors(image_path, clothing_type=item_type)
    if not color_result.get("ok"):
        logger.warning("[color] failed error=%s", color_result.get("error"))
        return _analysis_failure(
            "color_extraction_failed",
            "Could not extract colors from this image.",
            classification=classification,
            color_result=color_result,
        )

    primary_color = color_result.get("primary_color")
    secondary_colors = color_result.get("secondary_colors", [])
    color_name = color_result.get("color_name")

    logger.info("[color] name=%s rgb=%s", color_name, primary_color)

    occasion_tags = _get_occasion_tags(style, primary_color)
    all_colors = [primary_color] + secondary_colors

    result = {
        "ok": True,
        "type": item_type,
        "style": style,
        "colors": all_colors,
        "primary_color": primary_color,
        "color_name": color_name,
        "secondary_colors": secondary_colors,
        "occasion_tags": occasion_tags,
        "classification_details": classification,
    }

    if category:
        result["category"] = category

    return result
