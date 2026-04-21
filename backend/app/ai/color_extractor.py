"""
color_extractor.py — Perceptual colour extraction using CIELAB + KMeans++.

Improved for wardrobe images:
- type-aware focus crop
- better background suppression
- better dark-bottom handling
- avoids calling neutral clothing "Silver" unless it is a watch
"""

import cv2
import numpy as np
import colorsys
import logging
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)

K_CLUSTERS = 5

TOP_TYPES = {"tshirt", "shirt", "formal_shirt", "hoodie", "sweater"}
OUTERWEAR_TYPES = {"blazer", "jacket", "coat"}
BOTTOM_TYPES = {"jeans", "formal_pants", "cargo_pants", "track_pants", "shorts", "skirt", "pyjama"}
FOOTWEAR_TYPES = {"sneakers", "shoes", "loafers", "sandals", "slippers"}
WATCH_TYPES = {"watch"}


def _extraction_failure(reason: str, image_path: str):
    return {
        "ok": False,
        "error": reason or "color_extraction_failed",
        "image_path": image_path,
        "primary_color": None,
        "secondary_colors": [],
        "primary_hsv": None,
        "color_name": None,
        "delta_e_spread": None,
    }


# ── Colour Space Conversions ──────────────────────────────────────

def _bgr_to_hsv_float(b, g, r):
    """Convert BGR (0-255) → HSV (H:0-360, S:0-100, V:0-100)."""
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return [round(h * 360, 1), round(s * 100, 1), round(v * 100, 1)]


def _lab_to_rgb(l_val, a_val, b_val):
    """Convert single LAB point back to RGB (0-255 ints)."""
    lab_px = np.array([[[l_val, a_val, b_val]]], dtype=np.float32)
    bgr = cv2.cvtColor(lab_px, cv2.COLOR_LAB2BGR)
    b, g, r = (bgr[0, 0] * 255).clip(0, 255).astype(int)
    return [int(r), int(g), int(b)]


# ── Region Selection ──────────────────────────────────────────────

def _focus_crop(bgr, clothing_type=None):
    """
    Type-aware crop so color extraction focuses on the garment region
    instead of background / skin / shirt / floor.
    """
    h, w = bgr.shape[:2]
    clothing_type = (clothing_type or "").strip().lower()

    if clothing_type in BOTTOM_TYPES:
        # Focus on center-lower body, avoid too much torso/background
        x1, x2 = int(w * 0.24), int(w * 0.76)
        y1, y2 = int(h * 0.28), int(h * 0.96)
    elif clothing_type in TOP_TYPES or clothing_type in OUTERWEAR_TYPES:
        # Focus on torso/upper body
        x1, x2 = int(w * 0.18), int(w * 0.82)
        y1, y2 = int(h * 0.06), int(h * 0.74)
    elif clothing_type in FOOTWEAR_TYPES:
        # Focus on lower edge / feet region
        x1, x2 = int(w * 0.18), int(w * 0.82)
        y1, y2 = int(h * 0.68), int(h * 0.98)
    elif clothing_type in WATCH_TYPES:
        # Conservative center crop
        x1, x2 = int(w * 0.28), int(w * 0.72)
        y1, y2 = int(h * 0.20), int(h * 0.80)
    else:
        # Generic center crop
        x1, x2 = int(w * 0.20), int(w * 0.80)
        y1, y2 = int(h * 0.20), int(h * 0.80)

    # Safety fallback
    if x2 - x1 < 20 or y2 - y1 < 20:
        return bgr
    return bgr[y1:y2, x1:x2]


# ── Colour Naming (clothing-aware) ────────────────────────────────

def get_color_name(rgb, clothing_type=None):
    """
    Convert RGB to a human-readable colour name.
    Neutral apparel should usually be Gray / Charcoal / Black,
    not Silver. Silver is mainly reserved for watches/metallic items.
    """
    r, g, b = rgb[0], rgb[1], rgb[2]
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h, s, v = h * 360, s * 100, v * 100

    clothing_type = (clothing_type or "").strip().lower()

    # ── Achromatic colours ──
    if v < 15:
        return "Black"
    if v < 30 and s < 20:
        return "Black"
    if v > 90 and s < 8:
        return "White"
    if v > 82 and s < 12:
        return "Off-White"

    # Low-saturation neutrals
    if s < 12:
        if v < 38:
            return "Charcoal"
        if v < 60:
            return "Gray"
        # Only allow "Silver" for watch-like items
        if clothing_type in WATCH_TYPES and v < 82:
            return "Silver"
        if v < 82:
            return "Light Gray"
        return "Light Gray"

    # ── Chromatic colours ──
    dark = v < 40
    light = v > 75 and s < 50

    # Red family
    if h < 8 or h >= 345:
        if dark:
            return "Maroon"
        if s > 70 and v > 60:
            return "Red"
        if s < 40 and v > 70:
            return "Salmon"
        return "Red"

    # Orange / Peach / Brown
    if h < 25:
        if dark:
            return "Brown"
        if s < 45 and v > 70:
            return "Peach"
        if s > 70:
            return "Orange"
        return "Orange"

    if h < 40:
        if dark:
            return "Brown"
        if s < 40 and v > 70:
            return "Beige"
        return "Orange"

    # Yellow / Gold / Olive
    if h < 55:
        if dark:
            return "Olive"
        if light:
            return "Cream"
        return "Yellow"

    if h < 70:
        if dark:
            return "Olive"
        return "Gold"

    # Green family
    if h < 160:
        if dark:
            return "Dark Green"
        if h < 100:
            return "Lime"
        if s < 40:
            return "Sage"
        if v > 70:
            return "Green"
        return "Forest Green"

    # Teal / Cyan
    if h < 200:
        if dark:
            return "Teal"
        if s < 40:
            return "Mint"
        return "Cyan"

    # Blue family
    if h < 220:
        if dark:
            return "Navy"
        return "Blue"

    if h < 260:
        if dark:
            return "Navy"
        if v > 70 and s > 50:
            return "Royal Blue"
        return "Blue"

    # Purple / Violet
    if h < 290:
        if dark:
            return "Dark Purple"
        if s < 40:
            return "Lavender"
        return "Purple"

    # Pink / Magenta / Burgundy
    if dark:
        return "Burgundy"
    if s < 30 and v > 70:
        return "Blush"
    if s > 60 and v > 60:
        if h < 320:
            return "Magenta"
        return "Hot Pink"

    return "Pink"


# ── Cluster Selection Helpers ─────────────────────────────────────

def _cluster_info(lab_center, count, total_count):
    rgb = _lab_to_rgb(*lab_center)
    h, s, v = _bgr_to_hsv_float(rgb[2], rgb[1], rgb[0])
    rgb_range = max(rgb) - min(rgb)
    brightness = sum(rgb) / 3.0
    ratio = count / max(total_count, 1)

    return {
        "lab": lab_center,
        "rgb": rgb,
        "hsv": [h, s, v],
        "count": int(count),
        "ratio": float(ratio),
        "range": float(rgb_range),
        "brightness": float(brightness),
        "is_bright_neutral": (s < 15 and brightness > 155),
        "is_dark": brightness < 110,
    }


def _select_primary_cluster(cluster_infos, clothing_type=None):
    """
    Choose primary cluster more intelligently than 'largest cluster wins'.
    Important for dark trousers, shoes, and other apparel with bright backgrounds.
    """
    if not cluster_infos:
        return 0

    clothing_type = (clothing_type or "").strip().lower()

    # Default = dominant cluster
    best_idx = 0
    best_score = -1e9

    for i, info in enumerate(cluster_infos):
        h, s, v = info["hsv"]
        ratio = info["ratio"]
        brightness = info["brightness"]
        color_range = info["range"]

        # Base score favors large clusters
        score = ratio * 100.0

        # Penalize obvious bright neutral background
        if info["is_bright_neutral"]:
            score -= 35.0

        # Slight reward for actual chroma
        score += min(color_range, 70) * 0.15

        # Type-aware adjustments
        if clothing_type in BOTTOM_TYPES:
            # Dark dominant colors are common for pants/jeans
            if brightness < 120:
                score += (120 - brightness) * 0.45

            # Jeans often lean dark blue
            if clothing_type == "jeans" and 185 <= h <= 255:
                score += 12.0

            # Large dark neutrals are often correct for trousers
            if s < 18 and brightness < 95:
                score += 10.0

        elif clothing_type in FOOTWEAR_TYPES:
            if brightness < 125:
                score += (125 - brightness) * 0.35

        else:
            # Generic logic: avoid bright neutral background
            if not info["is_bright_neutral"]:
                score += 5.0

        if score > best_score:
            best_score = score
            best_idx = i

    return best_idx


# ── Main Extraction ───────────────────────────────────────────────

def extract_colors(image_path: str, clothing_type: str = None) -> dict:
    """
    Extract dominant colours from a clothing image using KMeans++ in CIELAB.

    Args:
        image_path: Path to the image file on disk.
        clothing_type: Optional classifier output, e.g. jeans / shirt / shoes.

    Returns:
        {
          "primary_color":    [r, g, b],
          "secondary_colors": [[r,g,b], ...],
          "primary_hsv":      [h, s, v],
          "color_name":       str,
          "delta_e_spread":   float,
        }
    """
    bgr = cv2.imread(image_path)
    if bgr is None:
        logger.warning(f"[color] Cannot read image: {image_path}")
        return _extraction_failure("image_read_failed", image_path)

    # Resize to keep color structure while staying fast
    bgr = cv2.resize(bgr, (150, 150), interpolation=cv2.INTER_AREA)

    # Type-aware crop
    bgr_crop = _focus_crop(bgr, clothing_type)

    # Convert BGR → LAB
    bgr_f = bgr_crop.astype(np.float32) / 255.0
    lab = cv2.cvtColor(bgr_f, cv2.COLOR_BGR2LAB)
    pixels = lab.reshape(-1, 3)

    # Background suppression
    L = pixels[:, 0]
    fg_mask = (L > 4) & (L < 97)

    hsv_crop = cv2.cvtColor(bgr_crop, cv2.COLOR_BGR2HSV)
    hsv_pixels = hsv_crop.reshape(-1, 3)
    s_vals = hsv_pixels[:, 1]
    v_vals = hsv_pixels[:, 2]

    # Remove bright neutral background pixels
    not_bright_neutral = ~((s_vals < 20) & (v_vals > 185))
    not_extreme_white = v_vals < 248

    combined_mask = fg_mask & not_bright_neutral & not_extreme_white
    filtered = pixels[combined_mask]

    if len(filtered) < 100:
        filtered = pixels[fg_mask]
    if len(filtered) < 100:
        filtered = pixels

    n_clusters = min(K_CLUSTERS, len(filtered))
    km = KMeans(
        n_clusters=n_clusters,
        init="k-means++",
        n_init=10,
        random_state=42,
    )
    km.fit(filtered)

    counts = np.bincount(km.labels_)
    sorted_idx = np.argsort(-counts)
    centers = km.cluster_centers_[sorted_idx]
    sorted_counts = counts[sorted_idx]
    total_count = int(np.sum(sorted_counts))

    cluster_infos = [
        _cluster_info(center, count, total_count)
        for center, count in zip(centers, sorted_counts)
    ]

    primary_idx = _select_primary_cluster(cluster_infos, clothing_type)

    # Reorder so chosen primary is first
    ordered_infos = cluster_infos[:]
    ordered_infos[0], ordered_infos[primary_idx] = ordered_infos[primary_idx], ordered_infos[0]

    rgb_list = [info["rgb"] for info in ordered_infos[:3]]
    primary = rgb_list[0]
    secondary = rgb_list[1:] if len(rgb_list) > 1 else []

    pr, pg, pb = primary
    hsv = _bgr_to_hsv_float(pb, pg, pr)

    color_name = get_color_name(primary, clothing_type=clothing_type)

    if len(ordered_infos) >= 2:
        delta_e = float(np.mean([
            np.linalg.norm(ordered_infos[0]["lab"] - ordered_infos[i]["lab"])
            for i in range(1, min(3, len(ordered_infos)))
        ]))
    else:
        delta_e = 0.0

    return {
        "ok": True,
        "primary_color": primary,
        "secondary_colors": secondary,
        "primary_hsv": hsv,
        "color_name": color_name,
        "delta_e_spread": round(delta_e, 2),
    }
