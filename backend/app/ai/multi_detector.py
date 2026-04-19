"""
multi_detector.py — YOLOv8-based multi-clothing item detector.

Detects individual clothing items in full-body / multi-item images.
Uses YOLOv8n (nano) for lightweight, fast inference.

This module is ADDITIVE — it does NOT touch the existing classifier.
It provides cropped regions that can be fed into the existing pipeline.
"""
import logging
from pathlib import Path
from typing import Dict, List, Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── YOLO Model Singleton ─────────────────────────────────────────
_yolo_model = None
_yolo_unavailable = False


def _ensure_yolo_loaded():
    """Lazy-load YOLOv8n model once (singleton pattern)."""
    global _yolo_model, _yolo_unavailable

    if _yolo_model is not None or _yolo_unavailable:
        return

    try:
        from ultralytics import YOLO
        logger.info("[multi_detector] Loading YOLOv8n model...")
        _yolo_model = YOLO("yolov8n.pt")
        logger.info("[multi_detector] YOLOv8n loaded successfully.")
    except Exception as e:
        logger.warning(f"[multi_detector] Could not load YOLO model: {e}")
        _yolo_unavailable = True


# ── COCO → Clothing Category Mapping ─────────────────────────────
# YOLOv8n uses COCO classes. We only care about clothing-relevant ones.
# COCO class names that map to clothing items.
COCO_CLOTHING_CLASSES = {
    "tie",
    "backpack",
    "handbag",
    "suitcase",
}

# We also use the "person" class to detect full bodies,
# but we DON'T return "person" as a clothing item — only use it
# as a signal that multiple clothing regions may exist.
PERSON_CLASS = "person"

# ── Category Mapping ──────────────────────────────────────────────
# Maps classifier output types → high-level clothing categories.
# Used by the multi-classifier service for structured output.
CATEGORY_MAP = {
    # Topwear
    "tshirt": "topwear",
    "shirt": "topwear",
    "formal_shirt": "topwear",
    "blazer": "topwear",
    "jacket": "topwear",
    "hoodie": "topwear",
    "sweater": "topwear",
    "kurta": "topwear",
    "sherwani": "topwear",
    "coat": "topwear",

    # Bottomwear
    "jeans": "bottomwear",
    "formal_pants": "bottomwear",
    "cargo_pants": "bottomwear",
    "shorts": "bottomwear",
    "track_pants": "bottomwear",
    "pyjama": "bottomwear",
    "skirt": "bottomwear",

    # Full-body
    "dress": "fullbody",
    "sportswear": "fullbody",
    "tracksuit": "fullbody",

    # Footwear
    "sneakers": "footwear",
    "loafers": "footwear",
    "shoes": "footwear",
    "sandals": "footwear",
    "slippers": "footwear",
    "socks": "footwear",

    # Accessories
    "watch": "accessory",
    "belt": "accessory",
    "cap": "accessory",
    "ring": "accessory",
    "chain": "accessory",
    "bracelet": "accessory",
    "tie": "accessory",
    "scarf": "accessory",
    "bag": "accessory",
    "accessories": "accessory",

    # Fallback
    "unknown": "unknown",
}


def get_category(clothing_type: str) -> str:
    """Map a classifier clothing type to a high-level category."""
    return CATEGORY_MAP.get(clothing_type, "unknown")


# ── NMS / Overlap Filtering ──────────────────────────────────────

def _compute_iou(box_a, box_b):
    """Compute Intersection over Union for two [x1, y1, x2, y2] boxes."""
    x1 = max(box_a[0], box_b[0])
    y1 = max(box_a[1], box_b[1])
    x2 = min(box_a[2], box_b[2])
    y2 = min(box_a[3], box_b[3])

    inter_area = max(0, x2 - x1) * max(0, y2 - y1)
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    union_area = area_a + area_b - inter_area

    if union_area == 0:
        return 0.0
    return inter_area / union_area


def _remove_duplicate_boxes(detections: List[Dict], iou_threshold: float = 0.5) -> List[Dict]:
    """Remove heavily overlapping bounding boxes, keeping the larger one."""
    if len(detections) <= 1:
        return detections

    # Sort by area (largest first)
    detections = sorted(detections, key=lambda d: d["area"], reverse=True)
    keep = []

    for det in detections:
        is_duplicate = False
        for kept in keep:
            iou = _compute_iou(det["bbox"], kept["bbox"])
            if iou > iou_threshold:
                is_duplicate = True
                break
        if not is_duplicate:
            keep.append(det)

    return keep


# ── Heuristic Body-Region Splitter ────────────────────────────────
# When YOLO detects a "person" but no separate clothing items,
# we split the person bounding box into top/bottom halves.

def _split_person_bbox(bbox, img_h, img_w):
    """
    Split a person bounding box into top-half and bottom-half regions.

    Args:
        bbox: [x1, y1, x2, y2] of the person detection.
        img_h, img_w: Full image dimensions.

    Returns:
        List of dicts with 'bbox' and 'region' keys.
    """
    x1, y1, x2, y2 = bbox
    mid_y = int((y1 + y2) * 0.45)  # Slightly above midpoint (waist line)

    regions = []

    # Top half (topwear)
    top_bbox = [x1, y1, x2, mid_y]
    top_h = mid_y - y1
    if top_h > 30:  # Minimum viable height
        regions.append({
            "bbox": top_bbox,
            "region": "top",
            "area": (x2 - x1) * top_h,
        })

    # Bottom half (bottomwear)
    bottom_bbox = [x1, mid_y, x2, y2]
    bottom_h = y2 - mid_y
    if bottom_h > 30:
        regions.append({
            "bbox": bottom_bbox,
            "region": "bottom",
            "area": (x2 - x1) * bottom_h,
        })

    return regions


# ── Safe Cropping ─────────────────────────────────────────────────

def _safe_crop(image: np.ndarray, bbox, padding: int = 5) -> Optional[np.ndarray]:
    """
    Safely crop a region from an image with boundary clamping and padding.

    Args:
        image: OpenCV BGR image array.
        bbox: [x1, y1, x2, y2] bounding box.
        padding: Pixels to expand the crop by (absorbs edge effects).

    Returns:
        Cropped image array, or None if the crop is invalid/empty.
    """
    img_h, img_w = image.shape[:2]
    x1, y1, x2, y2 = bbox

    # Clamp to image boundaries with padding
    x1 = max(0, int(x1) - padding)
    y1 = max(0, int(y1) - padding)
    x2 = min(img_w, int(x2) + padding)
    y2 = min(img_h, int(y2) + padding)

    # Validate dimensions
    if x2 <= x1 or y2 <= y1:
        return None
    if (x2 - x1) < 20 or (y2 - y1) < 20:
        return None

    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        return None

    return crop


# ── Main Detection Function ──────────────────────────────────────

def detect_clothing_items(
    image_path: str,
    conf_threshold: float = 0.35,
) -> List[Dict]:
    """
    Detect individual clothing items in an image using YOLOv8.

    If the image contains a full-body person, splits the detection
    into top/bottom regions for separate classification.

    Args:
        image_path: Path to the image file.
        conf_threshold: Minimum YOLO confidence to keep a detection.

    Returns:
        List of detected items:
        [
            {
                "label": str,          # YOLO class name or "region_top"/"region_bottom"
                "bbox": [x1, y1, x2, y2],
                "confidence": float,
                "area": int,
                "crop_path": str,      # Path to the saved crop file
            },
            ...
        ]

        Returns empty list if:
        - YOLO is unavailable
        - No clothing items detected
        - Only a single item (caller should use existing classifier)
    """
    _ensure_yolo_loaded()

    if _yolo_model is None:
        logger.warning("[multi_detector] YOLO model not available.")
        return []

    # Read image
    image = cv2.imread(image_path)
    if image is None:
        logger.error(f"[multi_detector] Cannot read image: {image_path}")
        return []

    img_h, img_w = image.shape[:2]

    # Run YOLO inference
    try:
        results = _yolo_model(image_path, verbose=False, conf=conf_threshold)
    except Exception as e:
        logger.error(f"[multi_detector] YOLO inference failed: {e}")
        return []

    if not results or len(results) == 0:
        return []

    result = results[0]
    boxes = result.boxes
    if boxes is None or len(boxes) == 0:
        return []

    # Parse detections
    person_boxes = []
    clothing_detections = []

    for i in range(len(boxes)):
        cls_id = int(boxes.cls[i].item())
        conf = float(boxes.conf[i].item())
        bbox = boxes.xyxy[i].cpu().numpy().tolist()
        bbox = [int(b) for b in bbox]
        class_name = result.names[cls_id]

        if class_name == PERSON_CLASS:
            person_boxes.append({
                "bbox": bbox,
                "confidence": conf,
                "area": (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]),
            })
        elif class_name in COCO_CLOTHING_CLASSES:
            clothing_detections.append({
                "label": class_name,
                "bbox": bbox,
                "confidence": conf,
                "area": (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]),
            })

    # Strategy:
    # 1. If we have person detections → split into top/bottom regions
    # 2. If we also have clothing detections → include those too
    # 3. Remove duplicate overlapping boxes

    detected_items = []

    # Process person detections → split into clothing regions
    for person in person_boxes:
        regions = _split_person_bbox(person["bbox"], img_h, img_w)
        for region in regions:
            detected_items.append({
                "label": f"region_{region['region']}",
                "bbox": region["bbox"],
                "confidence": person["confidence"],
                "area": region["area"],
            })

    # Add standalone clothing item detections
    detected_items.extend(clothing_detections)

    # Remove duplicate/overlapping boxes
    detected_items = _remove_duplicate_boxes(detected_items, iou_threshold=0.4)

    # Sort by area (largest first)
    detected_items = sorted(detected_items, key=lambda d: d["area"], reverse=True)

    # Only return multi-item results (≥2 items)
    # Single-item images should use the existing classifier directly
    if len(detected_items) < 2:
        return []

    # Save crops as temp files and attach crop paths
    import tempfile
    import os

    crops_dir = Path(image_path).parent / "_crops"
    crops_dir.mkdir(exist_ok=True)

    final_items = []
    for idx, det in enumerate(detected_items):
        crop = _safe_crop(image, det["bbox"])
        if crop is None:
            continue

        # Save crop to a temp file
        stem = Path(image_path).stem
        crop_filename = f"{stem}_crop_{idx}.jpg"
        crop_path = str(crops_dir / crop_filename)
        cv2.imwrite(crop_path, crop)

        det["crop_path"] = crop_path
        final_items.append(det)

    logger.info(
        f"[multi_detector] Detected {len(final_items)} clothing regions "
        f"from {image_path}"
    )

    return final_items


def preload_yolo():
    """Pre-load the YOLO model to avoid lag on first request."""
    _ensure_yolo_loaded()
