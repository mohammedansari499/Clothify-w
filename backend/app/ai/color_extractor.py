"""
color_extractor.py — Perceptual colour extraction using CIELAB + KMeans++.

Pipeline:
  image path → OpenCV decode → resize 150×150
  → BGR→LAB conversion → filter background pixels
  → KMeans++(k=5) in LAB space → sort by cluster size
  → convert dominant centroid to RGB + HSV
  → map to human-readable colour name

Uses CIELAB because it's perceptually uniform:
  ΔE = √((ΔL*)² + (Δa*)² + (Δb*)²)
  ΔE < 2 → indistinguishable to human eye

Runs 100% locally, <50ms per image.
"""
import cv2
import numpy as np
import colorsys
import logging
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)

K_CLUSTERS = 5


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


# ── Colour Naming (25+ named colours) ─────────────────────────────

def get_color_name(rgb):
    """
    Convert RGB to a human-readable colour name.
    Uses HSV thresholds tuned for clothing detection.
    """
    r, g, b = rgb[0], rgb[1], rgb[2]
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h, s, v = h * 360, s * 100, v * 100

    # ── Achromatic colours ──
    if v < 15:
        return "Black"
    if v < 30 and s < 20:
        return "Black"
    if v > 90 and s < 8:
        return "White"
    if v > 80 and s < 12:
        return "Off-White"

    # Gray range (low saturation)
    if s < 12:
        if v < 35:
            return "Charcoal"
        if v < 55:
            return "Gray"
        if v < 75:
            return "Silver"
        return "Light Gray"

    # ── Chromatic colours ──
    dark = v < 40
    light = v > 75 and s < 50

    # Red family (0-15, 345-360)
    if h < 8 or h >= 345:
        if dark:
            return "Maroon"
        if s > 70 and v > 60:
            return "Red"
        if s < 40 and v > 70:
            return "Salmon"
        return "Red"

    # Orange / Peach / Brown (8-40)
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

    # Yellow / Gold / Olive (40-70)
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

    # Green family (70-160)
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

    # Teal / Cyan (160-200)
    if h < 200:
        if dark:
            return "Teal"
        if s < 40:
            return "Mint"
        return "Cyan"

    # Blue family (200-260)
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

    # Purple / Violet (260-290)
    if h < 290:
        if dark:
            return "Dark Purple"
        if s < 40:
            return "Lavender"
        return "Purple"

    # Pink / Magenta / Burgundy (290-345)
    if dark:
        return "Burgundy"
    if s < 30 and v > 70:
        return "Blush"
    if s > 60 and v > 60:
        if h < 320:
            return "Magenta"
        return "Hot Pink"
    return "Pink"


# ── Main Extraction ───────────────────────────────────────────────

def extract_colors(image_path: str) -> dict:
    """
    Extract dominant colours from a clothing image using KMeans++ in CIELAB.

    Args:
        image_path: Path to the image file on disk.

    Returns:
        {
          "primary_color":    [r, g, b],
          "secondary_colors": [[r,g,b], ...],
          "primary_hsv":      [h, s, v],
          "color_name":       str,
          "delta_e_spread":   float,  # palette diversity score
        }
    """
    bgr = cv2.imread(image_path)
    if bgr is None:
        logger.warning(f"[color] Cannot read image: {image_path}")
        return {
            "primary_color": [128, 128, 128],
            "secondary_colors": [],
            "primary_hsv": [0, 0, 50],
            "color_name": "Gray",
            "delta_e_spread": 0.0,
        }

    # Resize to 150×150 for speed — enough colour info retained
    bgr = cv2.resize(bgr, (150, 150), interpolation=cv2.INTER_AREA)

    # ── Center crop (middle 60%) to focus on garment ──
    h_img, w_img = bgr.shape[:2]
    cy, cx = int(h_img * 0.2), int(w_img * 0.2)
    bgr_crop = bgr[cy:h_img - cy, cx:w_img - cx]

    # Convert BGR → CIELAB (float32 input required)
    bgr_f = bgr_crop.astype(np.float32) / 255.0
    lab = cv2.cvtColor(bgr_f, cv2.COLOR_BGR2LAB)
    pixels = lab.reshape(-1, 3)

    # ── Filter background pixels ──
    L = pixels[:, 0]
    # L* < 5 = near-black background, L* > 97 = near-white background
    fg_mask = (L > 5) & (L < 97)

    # Also filter by saturation in HSV to remove gray backgrounds
    hsv_crop = cv2.cvtColor(bgr_crop, cv2.COLOR_BGR2HSV)
    hsv_pixels = hsv_crop.reshape(-1, 3)
    s_vals = hsv_pixels[:, 1]
    v_vals = hsv_pixels[:, 2]

    # Neutral backgrounds: very low saturation + high brightness
    not_neutral_bg = ~((s_vals < 15) & (v_vals > 180))

    combined_mask = fg_mask & not_neutral_bg
    filtered = pixels[combined_mask]

    # Fallback if too aggressive
    if len(filtered) < 100:
        filtered = pixels[fg_mask]
    if len(filtered) < 100:
        filtered = pixels

    # ── KMeans++ in LAB space ──
    n_clusters = min(K_CLUSTERS, len(filtered))
    km = KMeans(
        n_clusters=n_clusters,
        init="k-means++",
        n_init=10,
        random_state=42,
    )
    km.fit(filtered)

    # Sort clusters by count — largest = dominant colour
    counts = np.bincount(km.labels_)
    sorted_idx = np.argsort(-counts)
    centers = km.cluster_centers_[sorted_idx]

    # ── Smart primary selection ──
    # If the largest cluster looks like background (neutral, bright),
    # prefer the most saturated cluster as the garment colour
    primary_lab = centers[0]
    primary_rgb = _lab_to_rgb(*primary_lab)
    p_max, p_min = max(primary_rgb), min(primary_rgb)
    p_range = p_max - p_min
    p_brightness = sum(primary_rgb) / 3

    if p_range < 30 and p_brightness > 150 and n_clusters > 1:
        # Primary looks like background — find the real garment
        best_idx = 0
        best_score = -1
        for i in range(min(n_clusters, len(centers))):
            c_rgb = _lab_to_rgb(*centers[i])
            c_range = max(c_rgb) - min(c_rgb)
            c_brightness = sum(c_rgb) / 3
            score = c_range + max(0, 200 - c_brightness)
            if score > best_score:
                best_score = score
                best_idx = i
        # Swap the best to position 0
        centers_list = list(centers)
        centers_list[0], centers_list[best_idx] = centers_list[best_idx], centers_list[0]
        centers = np.array(centers_list)

    # Convert top-3 LAB centroids → RGB
    rgb_list = [_lab_to_rgb(*c) for c in centers[:3]]
    primary = rgb_list[0]
    secondary = rgb_list[1:] if len(rgb_list) > 1 else []

    # Primary colour → HSV for harmony scoring
    pr, pg, pb = primary
    hsv = _bgr_to_hsv_float(pb, pg, pr)  # _bgr_to_hsv expects B,G,R

    # Colour name
    color_name = get_color_name(primary)

    # Delta-E spread: how diverse the palette is
    if len(centers) >= 2:
        delta_e = float(np.mean([
            np.linalg.norm(centers[0] - centers[i])
            for i in range(1, min(3, len(centers)))
        ]))
    else:
        delta_e = 0.0

    return {
        "primary_color": primary,
        "secondary_colors": secondary,
        "primary_hsv": hsv,
        "color_name": color_name,
        "delta_e_spread": round(delta_e, 2),
    }
