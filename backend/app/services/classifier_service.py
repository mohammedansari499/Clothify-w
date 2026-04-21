"""
classifier_service.py - Thin orchestrator for clothing analysis.
"""
import colorsys
import logging

from app.ai.classifier import classify_image
from app.ai.color_extractor import extract_colors

logger = logging.getLogger(__name__)

RETRY_CROP_MODES = ("torso", "lower_body")
RETRYABLE_CLASSIFIER_ERRORS = {
    "low_confidence",
    "unknown",
    "shirt_vs_outerwear_ambiguity",
    "no_supported_garment_detected",
}
TOP_LIKE_TYPES = {"tshirt", "shirt", "formal_shirt", "hoodie", "sweater", "blazer", "jacket", "coat"}
LOWER_BODY_PRIORITY_TYPES = {"formal_pants", "jeans"}
LOWER_BODY_CONFIDENCE_MIN = 0.18
LOWER_BODY_STRONG_CONFIDENCE = 0.30
LOWER_BODY_MARGIN_MIN = 0.02

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


def _is_retryable_failure(classification):
    if classification.get("ok"):
        return False
    error_code = str(classification.get("error") or "").strip()
    if error_code in RETRYABLE_CLASSIFIER_ERRORS:
        return True
    return classification.get("type", "unknown") == "unknown"


def _pick_best_success(results):
    return max(
        results,
        key=lambda item: (
            float(item.get("confidence", 0.0)),
            len(item.get("top3") or []),
        ),
    )


def _failure_rank(classification):
    priority = {
        "shirt_vs_outerwear_ambiguity": 3,
        "low_confidence": 2,
        "unknown": 1,
    }
    error_code = str(classification.get("error") or "")
    return (
        priority.get(error_code, 0),
        float(classification.get("confidence", 0.0)),
    )


def _is_top_like_prediction(classification):
    item_type = str(classification.get("type") or "").strip().lower()
    category = str(classification.get("category") or "").strip().lower()
    return category in {"tops", "outerwear"} or item_type in TOP_LIKE_TYPES


def _is_confident_lower_body_pants(classification):
    if not classification or not classification.get("ok"):
        return False
    item_type = str(classification.get("type") or "").strip().lower()
    if item_type not in LOWER_BODY_PRIORITY_TYPES:
        return False
    confidence = float(classification.get("confidence", 0.0))
    return confidence >= LOWER_BODY_CONFIDENCE_MIN


def _should_prefer_lower_body_pants(top_result, lower_body_result):
    """
    If full image predicts a top but lower-body crop strongly predicts pants,
    prefer lower-body subtype result.
    """
    if not top_result or not top_result.get("ok") or not _is_top_like_prediction(top_result):
        return False
    if not _is_confident_lower_body_pants(lower_body_result):
        return False

    top_conf = float(top_result.get("confidence", 0.0))
    lower_conf = float(lower_body_result.get("confidence", 0.0))

    if lower_conf >= LOWER_BODY_STRONG_CONFIDENCE:
        return True
    return lower_conf >= (top_conf + LOWER_BODY_MARGIN_MIN)


def _classify_with_retries(image_path):
    first_attempt = classify_image(image_path, crop_mode="original")
    attempts_by_mode = {"original": first_attempt}

    if first_attempt.get("ok"):
        if _is_top_like_prediction(first_attempt):
            lower_body_attempt = classify_image(image_path, crop_mode="lower_body")
            attempts_by_mode["lower_body"] = lower_body_attempt
            if _should_prefer_lower_body_pants(first_attempt, lower_body_attempt):
                logger.info(
                    "[classify] lower-body rescue original=%s(%.2f%%) -> lower=%s(%.2f%%)",
                    first_attempt.get("type"),
                    float(first_attempt.get("confidence", 0.0)) * 100,
                    lower_body_attempt.get("type"),
                    float(lower_body_attempt.get("confidence", 0.0)) * 100,
                )
                return lower_body_attempt
        return first_attempt

    failures = [first_attempt]
    if not _is_retryable_failure(first_attempt):
        return first_attempt

    successes = []
    for crop_mode in RETRY_CROP_MODES:
        attempt = classify_image(image_path, crop_mode=crop_mode)
        attempts_by_mode[crop_mode] = attempt
        if attempt.get("ok"):
            successes.append(attempt)
            continue
        failures.append(attempt)

    if successes:
        best_result = _pick_best_success(successes)
        lower_body_attempt = attempts_by_mode.get("lower_body")
        if _should_prefer_lower_body_pants(best_result, lower_body_attempt):
            logger.info(
                "[classify] lower-body rescue retry=%s(%.2f%%) -> lower=%s(%.2f%%)",
                best_result.get("type"),
                float(best_result.get("confidence", 0.0)) * 100,
                lower_body_attempt.get("type"),
                float(lower_body_attempt.get("confidence", 0.0)) * 100,
            )
            return lower_body_attempt
        logger.info(
            "[classify] retry succeeded type=%s conf=%.2f%%",
            best_result.get("type"),
            float(best_result.get("confidence", 0.0)) * 100,
        )
        return best_result

    final_failure = max(failures, key=_failure_rank)
    return final_failure


def analyze_clothing(image_path):
    """
    Full AI pipeline: classify + color extract + occasion tag.
    """
    classification = _classify_with_retries(image_path)
    if not classification.get("ok"):
        classifier_error = classification.get("error", "classification_failed")
        if classifier_error in {"low_confidence", "shirt_vs_outerwear_ambiguity"}:
            message = "AI retry failed, try a tighter crop / single-item image"
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
