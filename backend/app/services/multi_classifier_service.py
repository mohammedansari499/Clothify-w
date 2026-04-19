"""
multi_classifier_service.py — Smart routing for single & multi-item images.

This service is ADDITIVE — it wraps the existing `analyze_clothing()` pipeline
without modifying it. Provides the `analyze_image_advanced()` entry point.

Flow:
    1. Run YOLO detection on the input image
    2. IF multiple items detected:
       - Crop each region
       - Run existing `analyze_clothing()` on each crop
       - Return structured multi-item results
    3. IF single item (or YOLO unavailable):
       - Delegate to existing `analyze_clothing()` directly
       - Return same format as before, wrapped in consistent envelope

Output format (always):
    {
        "mode": "single" | "multi",
        "items": [ ... ]
    }
"""
import logging
import os
from typing import Dict, List

from app.ai.multi_detector import detect_clothing_items, get_category
from app.services.classifier_service import analyze_clothing

logger = logging.getLogger(__name__)


def analyze_image_advanced(image_path: str) -> Dict:
    """
    Smart classification entry point.

    Detects whether the image contains multiple clothing items.
    If yes, classifies each one separately. If no, falls back to
    the existing single-item classifier.

    Args:
        image_path: Absolute path to the uploaded image file.

    Returns:
        {
            "mode": "single" | "multi",
            "items": [
                {
                    "type": str,
                    "category": str,        # "topwear" | "bottomwear" | "footwear" | ...
                    "style": str,
                    "colors": [[r,g,b], ...],
                    "primary_color": [r,g,b],
                    "color_name": str,
                    "secondary_colors": [[r,g,b], ...],
                    "occasion_tags": [str, ...],
                    "classification_details": {...},
                    "detection_info": {...} | None,  # Only in multi mode
                },
                ...
            ]
        }
    """
    # Step 1: Try multi-item detection
    detections = []
    try:
        detections = detect_clothing_items(image_path)
    except Exception as e:
        logger.warning(f"[multi_classifier] Detection failed, falling back: {e}")
        detections = []

    # Step 2: Route based on detection count
    if len(detections) >= 2:
        return _classify_multi(image_path, detections)
    else:
        return _classify_single(image_path)


def _classify_single(image_path: str) -> Dict:
    """
    Single-item classification — preserves existing behavior exactly.

    Wraps the output in the consistent envelope format while keeping
    the original analyze_clothing() return value intact.
    """
    result = analyze_clothing(image_path)
    category = get_category(result.get("type", "unknown"))

    item = {
        **result,
        "category": category,
        "detection_info": None,
    }

    return {
        "mode": "single",
        "items": [item],
    }


def _classify_multi(image_path: str, detections: List[Dict]) -> Dict:
    """
    Multi-item classification — runs existing classifier on each crop.

    Each cropped region is passed through the full analyze_clothing()
    pipeline (MobileNetV2 + color extraction + occasion tagging).
    """
    items = []

    for det in detections:
        crop_path = det.get("crop_path")
        if not crop_path or not os.path.exists(crop_path):
            logger.warning(
                f"[multi_classifier] Crop path missing or invalid: {crop_path}"
            )
            continue

        try:
            # Reuse the EXISTING classifier pipeline (no modifications)
            result = analyze_clothing(crop_path)

            category = get_category(result.get("type", "unknown"))

            item = {
                **result,
                "category": category,
                "detection_info": {
                    "label": det.get("label", "unknown"),
                    "bbox": det.get("bbox", []),
                    "confidence": det.get("confidence", 0.0),
                    "area": det.get("area", 0),
                },
            }
            items.append(item)

        except Exception as e:
            logger.error(
                f"[multi_classifier] Failed to classify crop "
                f"{crop_path}: {e}"
            )

    # Cleanup crop files after classification
    _cleanup_crops(detections)

    # If all crops failed, fall back to single-item
    if not items:
        logger.warning(
            "[multi_classifier] All crop classifications failed, "
            "falling back to single-item mode."
        )
        return _classify_single(image_path)

    return {
        "mode": "multi",
        "items": items,
    }


def _cleanup_crops(detections: List[Dict]):
    """Remove temporary crop files after classification."""
    for det in detections:
        crop_path = det.get("crop_path")
        if crop_path and os.path.exists(crop_path):
            try:
                os.remove(crop_path)
            except OSError:
                pass

    # Try to remove the _crops directory if empty
    if detections:
        first_crop = detections[0].get("crop_path", "")
        if first_crop:
            crops_dir = os.path.dirname(first_crop)
            try:
                if os.path.isdir(crops_dir) and not os.listdir(crops_dir):
                    os.rmdir(crops_dir)
            except OSError:
                pass
