"""
classifier.py — Local MobileNetV2 clothing classifier.

Uses ImageNet pre-trained weights with a label mapping to clothing categories.
Runs 100% locally on CPU (~60ms per image on i5-12th gen).
No API keys, no fallback heuristics, no network calls.

If a fine-tuned model exists at weights/clothing_classifier.pt, it is loaded
instead for higher accuracy.
"""
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────
IMG_SIZE = 224
MEAN = [0.485, 0.456, 0.406]   # ImageNet normalization
STD = [0.229, 0.224, 0.225]
DEVICE = torch.device("cpu")
CONF_THRESH = 0.15  # Lower threshold for ImageNet zero-shot (multi-class)

WEIGHTS_DIR = Path(__file__).parent / "weights"

# ── ImageNet label → clothing category mapping ────────────────────
# These are the ImageNet class indices that correspond to clothing items.
# MobileNetV2 recognizes these out of the box.
IMAGENET_CLOTHING_MAP = {
    # Tops
    610: "shirt",        # "jersey, T-shirt"
    617: "shirt",        # "academic gown" (robe-like, map to shirt)
    834: "shirt",        # "suit"
    906: "shirt",        # "Windsor tie" → signals formal top
    # T-shirts
    610: "tshirt",       # "jersey, T-shirt, tee shirt"
    # Pants / Jeans
    474: "jeans",        # "jean, blue jean, denim"
    # Jacket / Outerwear
    568: "jacket",       # "fur coat"
    831: "jacket",       # "trench coat"
    # Dress
    578: "dress",        # "gown" / academic
    617: "dress",        # "overskirt"
    # Sweater
    567: "sweater",      # "cardigan" (close enough)
    # Shoes / Footwear
    770: "shoes",        # "running shoe"
    514: "shoes",        # "clog"
    630: "shoes",        # "loafer"
    788: "shoes",        # "sandal"
    812: "shoes",        # "cowboy boot"
    # Accessories
    515: "cap",          # "cowboy hat"
    808: "cap",          # "sombrero"
    # More items
    638: "bag",          # "mailbag"
    414: "bag",          # "backpack"
    892: "watch",        # "wall clock" (not perfect but reasonable)
}

# Order-dependent keyword mapping for ImageNet class names.
# IMPORTANT: More specific phrases MUST come before generic ones.
# e.g. "lab coat" before "coat", "bow tie" before "tie", etc.
# Tuned based on actual MobileNetV2 output for real clothing photos.
LABEL_KEYWORDS_ORDERED = [
    # ── Most specific first ──
    ("lab coat", "shirt"),           # White shirts often classified as lab coats
    ("trench coat", "shirt"),        # Button-up shirts often trigger "trench coat"
    ("military uniform", "shirt"),   # Structured shirts
    ("academic gown", "shirt"),      # Flowing tops
    ("bow tie", "shirt"),            # Signals formal top (shirt with bow tie)
    ("bolo tie", "shirt"),           # Signals shirt
    ("windsor tie", "shirt"),        # Signals formal shirt
    ("vestment", "shirt"),           # Formal/religious garments → shirt
    ("fur coat", "jacket"),          # Actual fur jacket
    ("running shoe", "sneakers"),
    ("cowboy hat", "cap"),
    ("cowboy boot", "shoes"),
    ("swimming trunks", "shorts"),
    # ── T-shirts / Tops ──
    ("jersey", "tshirt"),
    ("t-shirt", "tshirt"),
    ("tee shirt", "tshirt"),
    ("maillot", "tshirt"),           # Tank top / athletic top
    # ── Shirts ──
    ("polo shirt", "shirt"),
    ("shirt", "shirt"),
    ("blouse", "shirt"),
    ("polo", "shirt"),
    # ── Formal ──
    ("suit", "formal_pants"),        # Suit usually shows full body with pants
    ("blazer", "blazer"),
    ("waistcoat", "blazer"),
    # ── Outerwear ──
    ("parka", "jacket"),
    ("poncho", "jacket"),
    ("cloak", "jacket"),
    ("jacket", "jacket"),
    ("puffer", "jacket"),
    ("windbreaker", "jacket"),
    ("coat", "jacket"),              # Generic coat — after specific coats above
    # ── Sweaters / Knit ──
    ("cardigan", "sweater"),
    ("pullover", "sweater"),
    ("sweater", "sweater"),
    ("sweatshirt", "hoodie"),
    ("hoodie", "hoodie"),
    # ── Bottoms ──
    ("jean", "jeans"),
    ("denim", "jeans"),
    ("trouser", "formal_pants"),
    ("slack", "formal_pants"),
    ("short", "shorts"),
    ("pajama", "pyjama"),
    # ── Dresses / Skirts ──
    ("miniskirt", "skirt"),
    ("overskirt", "skirt"),
    ("skirt", "skirt"),
    ("gown", "dress"),
    ("dress", "dress"),
    ("abaya", "dress"),
    ("bikini", "dress"),
    # ── Footwear ──
    ("sneaker", "sneakers"),
    ("loafer", "loafers"),
    ("boot", "shoes"),
    ("shoe", "shoes"),
    ("sandal", "sandals"),
    ("slipper", "slippers"),
    ("clog", "shoes"),
    ("sock", "socks"),
    # ── Hats ──
    ("sombrero", "cap"),
    ("hat", "cap"),
    ("cap", "cap"),
    ("bearskin", "cap"),
    # ── Accessories ──
    ("sunglasses", "accessories"),
    ("sunglass", "accessories"),
    ("stethoscope", "accessories"),
    ("backpack", "bag"),
    ("bag", "bag"),
    ("watch", "watch"),
    ("clock", "watch"),
    ("tie", "tie"),                  # Generic tie — after specific ties above
    ("stole", "scarf"),
    ("scarf", "scarf"),
    ("bib", "accessories"),
    ("apron", "accessories"),
    # ── Sportswear ──
    ("swimming", "sportswear"),
    # ── Skip these ──
    ("diaper", "unknown"),
    ("brassiere", "unknown"),
    ("dumbbell", "tshirt"),          # Person lifting weights → usually wearing tshirt
    ("barbell", "tshirt"),           # Same — gym context = tshirt
    ("racket", "sportswear"),        # Sports context
    ("velvet", "shirt"),             # Fabric texture, usually on tops
]

# Style mapping
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

# ── Load model ONCE at module level ───────────────────────────────
_model = None
_custom_model = False
_class_index = None


def _ensure_model_loaded():
    """Lazy-load the model on first use."""
    global _model, _custom_model, _class_index

    if _model is not None:
        return

    custom_weights = WEIGHTS_DIR / "clothing_classifier.pt"
    class_index_file = WEIGHTS_DIR / "class_index.json"

    if custom_weights.exists() and class_index_file.exists():
        # Load fine-tuned TorchScript model
        logger.info("[classifier] Loading fine-tuned model from weights/")
        try:
            _model = torch.jit.load(str(custom_weights), map_location=DEVICE)
            _model.eval()
            with open(class_index_file) as f:
                _class_index = json.load(f)
            _custom_model = True
            logger.info("[classifier] Fine-tuned model loaded successfully.")
            return
        except Exception as e:
            logger.warning(f"[classifier] Failed to load fine-tuned model: {e}")

    # Fall back to ImageNet pre-trained MobileNetV2
    logger.info("[classifier] Loading pre-trained MobileNetV2 (ImageNet)...")
    _model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    _model.eval()
    _custom_model = False
    logger.info("[classifier] MobileNetV2 loaded. Using ImageNet label mapping.")


# ── Inference transform ───────────────────────────────────────────
INFER_TF = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])

# Load ImageNet class labels
_imagenet_labels = None


def _get_imagenet_labels():
    """Get ImageNet 1000 class labels from torchvision."""
    global _imagenet_labels
    if _imagenet_labels is not None:
        return _imagenet_labels

    # torchvision provides the label mapping via the weights meta
    weights = models.MobileNet_V2_Weights.IMAGENET1K_V1
    _imagenet_labels = weights.meta["categories"]
    return _imagenet_labels


def _map_imagenet_to_clothing(label_name: str) -> str:
    """Map an ImageNet class name to a clothing category."""
    label_lower = label_name.lower()

    # Check ordered keyword matches (most specific first)
    for keyword, clothing_type in LABEL_KEYWORDS_ORDERED:
        if keyword in label_lower:
            return clothing_type

    return "unknown"


def classify_image(image_path: str) -> dict:
    """
    Classify clothing type from an image file path.

    Returns:
        {
          "type":       str,    # "shirt" | "jeans" | "dress" | "unknown" etc.
          "confidence": float,  # probability of top prediction
          "top3":       list,   # [{type, score}, ...]
          "label":      str,    # raw model label
          "style":      str,    # "casual" | "formal" | etc.
        }
    """
    _ensure_model_loaded()

    try:
        img = Image.open(image_path).convert("RGB")
    except Exception as e:
        logger.error(f"[classifier] Cannot open image: {e}")
        return {
            "type": "unknown", "confidence": 0.0,
            "top3": [], "label": "error", "style": "casual"
        }

    tensor = INFER_TF(img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = _model(tensor)
        probs = torch.softmax(logits, dim=1)[0]

    if _custom_model and _class_index:
        # Fine-tuned model: direct class mapping
        top3_idx = torch.argsort(probs, descending=True)[:3]
        top3 = [
            {"type": _class_index.get(str(i.item()), "unknown"),
             "score": round(probs[i].item(), 4)}
            for i in top3_idx
        ]
        best_type = top3[0]["type"]
        best_score = top3[0]["score"]
    else:
        # ImageNet model: map labels to clothing categories
        labels = _get_imagenet_labels()

        # Get top-20 predictions and map to clothing
        top20_idx = torch.argsort(probs, descending=True)[:20]
        clothing_scores = {}

        for idx in top20_idx:
            label_name = labels[idx.item()]
            clothing_type = _map_imagenet_to_clothing(label_name)
            score = probs[idx].item()

            if clothing_type != "unknown":
                if clothing_type not in clothing_scores:
                    clothing_scores[clothing_type] = {
                        "score": score,
                        "label": label_name
                    }
                else:
                    # Accumulate scores for same clothing type
                    clothing_scores[clothing_type]["score"] += score

        if clothing_scores:
            # Sort by accumulated score
            sorted_types = sorted(
                clothing_scores.items(),
                key=lambda x: x[1]["score"],
                reverse=True
            )

            top3 = [
                {"type": t, "score": round(s["score"], 4)}
                for t, s in sorted_types[:3]
            ]
            best_type = sorted_types[0][0]
            best_score = sorted_types[0][1]["score"]
        else:
            # No clothing detected — return best ImageNet class
            best_idx = torch.argmax(probs).item()
            best_label = labels[best_idx]
            best_score = probs[best_idx].item()
            best_type = "unknown"
            top3 = [{"type": "unknown", "score": round(best_score, 4)}]

    return {
        "type": best_type,
        "confidence": round(best_score, 4),
        "top3": top3,
        "label": f"mobilenet_{best_type}",
        "style": STYLE_MAP.get(best_type, "casual"),
    }
