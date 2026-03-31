import cv2
import numpy as np
import requests
import colorsys
import os


HF_CLASSIFY_URL = "https://api-inference.huggingface.co/models/microsoft/resnet-50"

# Comprehensive clothing type mapping — covers 40+ garment categories
LABEL_MAP = {
    # Tops — t-shirt variants MUST come before shirt
    "t-shirt": "tshirt", "t_shirt": "tshirt", "tshirt": "tshirt", "tee": "tshirt",
    "jersey": "tshirt",
    "blouse": "shirt",
    "polo": "shirt",
    "shirt": "shirt",
    # Formal Tops
    "suit": "formal_shirt", "blazer": "blazer", "waistcoat": "blazer",
    "vest": "blazer",
    # Outerwear
    "coat": "coat", "overcoat": "coat",
    "jacket": "jacket", "leather": "jacket",
    "hoodie": "hoodie", "sweatshirt": "hoodie",
    "sweater": "sweater", "cardigan": "sweater", "pullover": "sweater",
    "parka": "jacket", "puffer": "jacket", "windbreaker": "jacket",
    "turtle": "sweater",
    # Indian Wear
    "kurta": "kurta", "sherwani": "sherwani",
    # Bottoms
    "jeans": "jeans", "denim": "jeans", "baggy": "jeans",
    "trousers": "formal_pants", "slacks": "formal_pants",
    "cargo": "cargo_pants",
    "shorts": "shorts",
    "track": "track_pants", "jogger": "track_pants", "sweatpant": "track_pants",
    "pyjama": "pyjama", "pajama": "pyjama",
    # Dresses & Skirts
    "dress": "dress", "gown": "dress",
    "skirt": "skirt",
    # Footwear
    "sneaker": "sneakers", "trainer": "sneakers",
    "loafer": "loafers",
    "boot": "shoes",
    "shoe": "shoes", "oxford": "shoes",
    "sandal": "sandals",
    "slipper": "slippers", "flipflop": "slippers", "flip-flop": "slippers",
    # Accessories
    "watch": "watch",
    "belt": "belt",
    "cap": "cap", "hat": "cap",
    "sock": "socks",
    "ring": "ring",
    "chain": "chain", "necklace": "chain",
    "bracelet": "bracelet",
    "tie": "tie", "bow": "tie",
    "scarf": "scarf",
    "bag": "bag", "backpack": "bag",
    "sunglasses": "accessories", "glasses": "accessories",
    # Sportswear
    "sportswear": "sportswear", "athletic": "sportswear",
    "tracksuit": "tracksuit",
}

# Style hints based on clothing type
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
}


def _crop_to_foreground(image):
    """
    Automatically crop the image to the bounding box of the main object (garment/person).
    This removes empty background margins to focus analysis on the clothes.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    
    # Try to extract foreground assuming a light/white background (common for products)
    # Blurring helps remove noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image
        
    largest_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_contour)
    
    # Only crop if the bounding box isn't suspiciously small or capturing just a logo
    if w * h < (image.shape[0] * image.shape[1] * 0.1):
        return image
        
    # Add a small pad
    pad = 10
    h_orig, w_orig = image.shape[:2]
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(w_orig, x + w + pad)
    y2 = min(h_orig, y + h + pad)
    
    return image[y1:y2, x1:x2]


def extract_colors(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return [[128, 128, 128]]
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Crop to garment bounding box first to strictly focus on cloth
    image = _crop_to_foreground(image)
    image = cv2.resize(image, (200, 200))

    # Center-crop the middle 60% to focus on the garment
    h, w = image.shape[:2]
    crop_y, crop_x = int(h * 0.2), int(w * 0.2)
    cropped = image[crop_y:h - crop_y, crop_x:w - crop_x]

    pixels = cropped.reshape((-1, 3))

    # Convert to HSV for smarter filtering
    cropped_hsv = cv2.cvtColor(cropped, cv2.COLOR_RGB2HSV)
    hsv_pixels = cropped_hsv.reshape((-1, 3))

    avg_brightness = pixels.mean(axis=1)
    max_channel = pixels.max(axis=1)
    min_channel = pixels.min(axis=1)
    channel_range = max_channel - min_channel

    h_vals = hsv_pixels[:, 0]
    s_vals = hsv_pixels[:, 1]
    v_vals = hsv_pixels[:, 2]

    # Filter out:
    is_white = avg_brightness > 210
    is_near_black = max_channel < 15
    is_neutral_bg = (channel_range < 15) & (avg_brightness > 170)
    # Skin tones: H=0-25, S=40-170, V=80-255
    is_skin = ((h_vals <= 25) & (s_vals >= 40) & (s_vals <= 170) & (v_vals >= 80) & (v_vals <= 240))
    # Beige/tan backgrounds: low saturation, warm mid-brightness
    is_beige_bg = (s_vals < 50) & (v_vals > 130) & (v_vals < 220)

    mask = ~(is_white | is_near_black | is_neutral_bg | is_skin | is_beige_bg)
    filtered = pixels[mask]

    if len(filtered) < 50:
        # Relax: only remove obvious white/skin
        mask = ~(is_white | is_skin)
        filtered = pixels[mask]
    if len(filtered) < 50:
        # Even more relaxed
        mask = ~(avg_brightness > 240)
        filtered = pixels[mask]
    if len(filtered) < 50:
        filtered = pixels

    filtered = np.float32(filtered)

    n_clusters = min(3, len(filtered))
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(
        filtered, n_clusters, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS
    )

    colors = centers.astype(int)
    counts = np.bincount(labels.flatten())

    # Smart primary color selection:
    # If the most frequent color looks like a background (neutral, bright),
    # prefer the most saturated or darkest cluster as the garment color
    sorted_idx = np.argsort(-counts)
    primary_rgb = colors[sorted_idx[0]]
    
    # Check if primary looks like background
    p_max, p_min = int(primary_rgb.max()), int(primary_rgb.min())
    p_range = p_max - p_min
    p_brightness = int(primary_rgb.mean())
    
    if p_range < 30 and p_brightness > 150 and n_clusters > 1:
        # Primary is a neutral/bright background — find the real garment color
        best_idx = sorted_idx[0]
        best_score = -1
        for idx in range(n_clusters):
            c = colors[idx]
            c_max, c_min = int(c.max()), int(c.min())
            c_range = c_max - c_min
            c_brightness = int(c.mean())
            # Score: higher saturation (range) and darker = more likely garment
            score = c_range + max(0, 200 - c_brightness)
            if score > best_score:
                best_score = score
                best_idx = idx
        # Move best garment color to front
        result = [colors[best_idx].tolist()]
        for idx in sorted_idx:
            if idx != best_idx:
                result.append(colors[idx].tolist())
        return result

    return colors[sorted_idx].tolist()


def classify_clothing(image_path):
    """Classify a clothing image using HuggingFace ResNet-50 API.
    Falls back to filename heuristics if no API token is available.
    """
    hf_api_token = os.getenv("HF_API_TOKEN")

    try:
        if not hf_api_token:
            return _heuristic_classify(image_path)

        with open(image_path, "rb") as f:
            image_bytes = f.read()

        resp = requests.post(
            HF_CLASSIFY_URL,
            headers={"Authorization": f"Bearer {hf_api_token}"},
            data=image_bytes,
            timeout=15
        )
        resp.raise_for_status()
        predictions = resp.json()

        if isinstance(predictions, dict):
            print(f"HF API returned non-list response: {predictions}")
            return _heuristic_classify(image_path)

        for pred in predictions:
            label = pred["label"].lower()
            score = pred["score"]
            for key, clothing_type in LABEL_MAP.items():
                if key in label:
                    return {
                        "type": clothing_type,
                        "label": pred["label"],
                        "confidence": round(score, 3),
                        "style": STYLE_MAP.get(clothing_type, "casual")
                    }

        top = predictions[0]
        return {"type": "unknown", "label": top["label"], "confidence": top["score"], "style": "casual"}

    except Exception as e:
        print(f"Classifier error: {e}")
        return _heuristic_classify(image_path)


def _heuristic_classify(image_path):
    """Smart fallback: visual analysis FIRST, filename only as last resort."""
    # 1) Try visual image analysis first — this actually looks at the image
    result = _visual_classify(image_path)
    if result and result["confidence"] >= 0.5:
        return result

    # 2) Filename hint only as fallback when visual analysis fails
    filename = os.path.basename(image_path).lower()
    for key, clothing_type in LABEL_MAP.items():
        if key in filename:
            return {
                "type": clothing_type,
                "label": f"filename_{key}",
                "confidence": 0.4,
                "style": STYLE_MAP.get(clothing_type, "casual")
            }

    # 3) If visual gave a low-confidence result, still use it over nothing
    if result:
        return result

    return {"type": "unknown", "confidence": 0.3, "label": "unrecognized", "style": "casual"}


def _visual_classify(image_path):
    """Analyze image visually using OpenCV to guess garment type."""
    img = cv2.imread(image_path)
    if img is None:
        return None

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_rgb = _crop_to_foreground(img_rgb)
    img = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

    h_orig, w_orig = img.shape[:2]
    aspect_ratio = h_orig / max(w_orig, 1)

    # Resize for analysis
    img_resized = cv2.resize(img, (224, 224))
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)

    # 1. Edge density (busy patterns vs solid)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.mean(edges > 0)

    # 2. Color analysis
    h_channel, s_channel, v_channel = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    avg_saturation = np.mean(s_channel)
    avg_brightness = np.mean(v_channel)

    # 3. Skin tone detection (indicates model wearing the item)
    # Skin in HSV: H=0-25, S=40-180, V=80-255
    skin_mask = ((h_channel >= 0) & (h_channel <= 25) &
                 (s_channel >= 40) & (s_channel <= 180) &
                 (v_channel >= 80))
    skin_ratio = np.mean(skin_mask)

    # Center-crop HSV for color analysis to ignore backgrounds
    center_hsv = hsv[30:194, 30:194]
    c_h, c_s, c_v = center_hsv[:, :, 0], center_hsv[:, :, 1], center_hsv[:, :, 2]

    # 4. Blue/indigo detection (common for jeans/denim)
    blue_mask = ((c_h >= 90) & (c_h <= 130) & (c_s >= 30))
    blue_ratio = np.mean(blue_mask)

    # 5. White detection (formal shirts often white)
    white_mask = (c_s < 30) & (c_v > 200)
    white_ratio = np.mean(white_mask)

    # 6. Top vs bottom: analyze garment shape coverage
    # Center-crop to focus on garment
    center_region = gray[30:194, 30:194]
    _, binary = cv2.threshold(center_region, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    garment_coverage = np.mean(binary > 0)

    # 7. Upper vs lower body detection
    upper_half = gray[:112, :]
    lower_half = gray[112:, :]
    upper_edges = np.mean(cv2.Canny(upper_half, 50, 150) > 0)
    lower_edges = np.mean(cv2.Canny(lower_half, 50, 150) > 0)

    # 8. Check for collar/neckline (shirts have more edges at top)
    collar_region = gray[15:60, 50:174]
    collar_edges = np.mean(cv2.Canny(collar_region, 50, 150) > 0)

    # Red/warm detection (jackets, sweaters)
    red_mask = (((c_h <= 10) | (c_h >= 170)) &
                (c_s >= 80) & (c_v >= 50))
    red_ratio = np.mean(red_mask)

    # Dark pixel ratio (for detecting dark garments vs backgrounds)
    dark_mask = c_v < 60
    dark_ratio = np.mean(dark_mask)

    # Decision tree based on visual features
    detected_type = None
    confidence = 0.5

    # --- First: check universal features that override aspect ratio ---

    # Predominantly white/light + collar edges = shirt (regardless of shape)
    if white_ratio > 0.25 and collar_edges > 0.05:
        detected_type = "shirt"
        confidence = 0.65
    elif white_ratio > 0.35:
        detected_type = "shirt"
        confidence = 0.6

    # Strong red/warm color = likely jacket/outerwear
    elif red_ratio > 0.15 and edge_density > 0.1:
        detected_type = "jacket"
        confidence = 0.6

    # Strong blue denim + visible legs (taller images, dark lower half)
    elif blue_ratio > 0.2 and aspect_ratio > 1.3:
        detected_type = "jeans"
        confidence = 0.75

    # --- Then: aspect-ratio guided decisions ---

    # Tall images
    elif aspect_ratio > 1.4:
        # Upper-body features present = still a top
        if collar_edges > 0.15 or upper_edges > lower_edges * 1.5:
            if avg_saturation > 80:
                detected_type = "tshirt"
                confidence = 0.55
            else:
                detected_type = "shirt"
                confidence = 0.55
        elif blue_ratio > 0.1:
            detected_type = "jeans"
            confidence = 0.65
        elif dark_ratio > 0.4 and avg_saturation < 40:
            detected_type = "formal_pants"
            confidence = 0.6
        elif skin_ratio > 0.15:
            # Model visible = could be full-body shot of a top
            if upper_edges > lower_edges or collar_edges > 0.1:
                detected_type = "shirt"
                confidence = 0.5
            else:
                detected_type = "jeans"
                confidence = 0.5
        elif edge_density < 0.08:
            detected_type = "formal_pants"
            confidence = 0.55
        else:
            detected_type = "jeans"
            confidence = 0.5

    # Wide/short images = likely top
    elif aspect_ratio < 1.1:
        if skin_ratio > 0.15 and collar_edges > 0.15:
            if edge_density < 0.1 and avg_saturation > 80:
                detected_type = "tshirt"
                confidence = 0.65
            else:
                detected_type = "shirt"
                confidence = 0.6
        elif avg_saturation > 100 and edge_density < 0.1:
            detected_type = "tshirt"
            confidence = 0.6
        else:
            detected_type = "shirt"
            confidence = 0.5

    # Square-ish images
    else:
        if skin_ratio > 0.2:
            if avg_saturation > 80 and edge_density < 0.12:
                detected_type = "tshirt"
                confidence = 0.6
            else:
                detected_type = "shirt"
                confidence = 0.55
        elif blue_ratio > 0.15 and aspect_ratio > 1.2:
            detected_type = "jeans"
            confidence = 0.6
        elif edge_density > 0.2:
            detected_type = "jacket"
            confidence = 0.55
        elif white_ratio > 0.2:
            detected_type = "shirt"
            confidence = 0.55
        elif avg_saturation > 90:
            detected_type = "tshirt"
            confidence = 0.55
        else:
            detected_type = "shirt"
            confidence = 0.45

    if detected_type:
        return {
            "type": detected_type,
            "label": f"visual_{detected_type}",
            "confidence": confidence,
            "style": STYLE_MAP.get(detected_type, "casual")
        }
    return None


def _color_formality(hsv):
    h, s, v = hsv
    is_dark = v < 35
    is_neutral = s < 20
    is_bright = s > 70 and v > 60

    if is_dark and is_neutral:
        return "formal"
    if is_dark and not is_bright:
        return "formal"
    if is_bright:
        return "casual"
    return "neutral"


def _get_occasion_tags(clothing_type, primary_rgb):
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

    r, g, b = primary_rgb[0] / 255, primary_rgb[1] / 255, primary_rgb[2] / 255
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    hsv = [h * 360, s * 100, v * 100]

    formality = _color_formality(hsv)

    if formality == "formal":
        tags.add("formal")
        tags.discard("athletic")
    elif formality == "casual":
        tags.add("casual")

    return list(tags)


def _get_color_name(rgb):
    """Convert RGB to a human-readable color name."""
    r, g, b = rgb
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h, s, v = h * 360, s * 100, v * 100

    # Very dark colors
    if v < 20:
        return "Black"
    if v < 35 and s < 25:
        return "Black"
    # White
    if v > 90 and s < 10:
        return "White"
    # Gray tones
    if s < 12:
        if v < 40:
            return "Charcoal"
        if v < 65:
            return "Gray"
        return "Light Gray"

    # Dark but saturated = "Dark X"
    prefix = "Dark " if v < 40 else ""

    if h < 15 or h >= 345:
        return prefix + "Red"
    elif h < 45:
        return prefix + "Orange" if not prefix else "Brown"
    elif h < 70:
        return prefix + "Yellow" if not prefix else "Olive"
    elif h < 160:
        return prefix + "Green"
    elif h < 200:
        return prefix + "Teal" if prefix else "Cyan"
    elif h < 260:
        return prefix + "Blue"
    elif h < 290:
        return prefix + "Purple"
    elif h < 345:
        return prefix + "Pink" if not prefix else "Maroon"
    return "Red"


def analyze_clothing(image_path):
    colors = extract_colors(image_path)
    classification = classify_clothing(image_path)

    primary_color = colors[0] if colors else [128, 128, 128]
    secondary_colors = colors[1:] if len(colors) > 1 else []

    occasion_tags = _get_occasion_tags(classification["type"], primary_color)
    color_name = _get_color_name(primary_color)

    return {
        "type": classification["type"],
        "style": classification.get("style", "casual"),
        "colors": colors,
        "primary_color": primary_color,
        "color_name": color_name,
        "secondary_colors": secondary_colors,
        "occasion_tags": occasion_tags,
        "classification_details": classification
    }
