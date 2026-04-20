"""
classifier.py — Local MobileNetV2 clothing classifier (v2).

Uses ImageNet pre-trained weights with a structured multi-label scoring
system and rule-based correction layer for 30+ clothing categories.

Runs 100% locally on CPU (~60ms per image on i5-12th gen).
No API keys, no fallback heuristics, no network calls after first run.

If a fine-tuned model exists at weights/clothing_classifier.pt, it is loaded
instead for higher accuracy.
"""
import json
import logging
import os
from datetime import datetime
from pathlib import Path

try:
    import torch
    from PIL import Image
    from torchvision import models, transforms
    _ML_STACK_AVAILABLE = True
except Exception:  # pragma: no cover - environment dependent
    torch = None
    Image = None
    models = None
    transforms = None
    _ML_STACK_AVAILABLE = False

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────
IMG_SIZE = 224
MEAN = [0.485, 0.456, 0.406]   # ImageNet normalization
STD = [0.229, 0.224, 0.225]
DEVICE = torch.device("cpu") if torch is not None else None
CONF_THRESH = 0.15  # Lower threshold for ImageNet zero-shot (multi-class)
TOP_K = 30          # Consider top-30 ImageNet predictions (was 20)

WEIGHTS_DIR = Path(__file__).parent / "weights"
LOCAL_WEIGHTS_PATH = WEIGHTS_DIR / "mobilenet_v2.pth"
PREDICTION_LOG_PATH = WEIGHTS_DIR / "prediction_log.jsonl"

CLOTHING_CATEGORIES = [
    "tshirt", "shirt", "jacket", "blazer", "sweater", "hoodie",
    "kurta", "sherwani", "tracksuit", "robe",
    "jeans", "formal_pants", "cargo_pants", "shorts", "track_pants", "pyjama",
    "dress", "skirt",
    "tie", "bow_tie", "belt", "cap", "bag", "scarf",
    "slippers", "shoes", "formal_shoes", "loafers", "sneakers", "sandals",
    "socks", "watch", "ring", "chain", "bracelet",
    "sportswear", "accessories", "waistcoat", "unknown",
]

# ── Category Whitelist and Blacklist ───────────────────────────
VALID_CATEGORIES = set(CLOTHING_CATEGORIES)
INVALID_ITEMS = {"underwear", "diaper", "swimsuit_top", "brassiere", "none", "body_part"}

# ── Weighted ImageNet → Clothing Mapping ──────────────────────────
# Each entry: (keyword_in_imagenet_label, [(clothing_category, weight), ...])
# Weights allow a single ImageNet label to contribute to multiple categories.
# More specific phrases MUST come before generic ones.
WEIGHTED_LABEL_MAP = [
    # ── Highly specific (unique identifiers) ──
    ("lab coat",           [("shirt", 0.7), ("robe", 0.3)]),
    ("trench coat",        [("jacket", 0.8), ("blazer", 0.2)]),
    ("military uniform",   [("shirt", 0.5), ("jacket", 0.3), ("formal_pants", 0.2)]),
    ("academic gown",      [("robe", 0.7), ("dress", 0.3)]),
    ("bow tie",            [("bow_tie", 1.0)]),
    ("bolo tie",           [("tie", 0.8), ("shirt", 0.2)]),
    ("windsor tie",        [("tie", 0.8), ("shirt", 0.2)]),
    ("fur coat",           [("jacket", 0.9), ("blazer", 0.1)]),
    ("running shoe",       [("sneakers", 1.0)]),
    ("cowboy hat",         [("cap", 1.0)]),
    ("cowboy boot",        [("shoes", 0.7), ("formal_shoes", 0.3)]),
    ("swimming trunks",    [("shorts", 0.8), ("sportswear", 0.2)]),
    ("bath towel",         [("robe", 0.6), ("unknown", 0.4)]),
    ("shower curtain",     [("robe", 0.3), ("unknown", 0.7)]),

    # ── T-shirts / Tops ──
    ("jersey",             [("tshirt", 0.9), ("sportswear", 0.1)]),
    ("t-shirt",            [("tshirt", 1.0)]),
    ("tee shirt",          [("tshirt", 1.0)]),
    ("maillot",            [("tshirt", 0.7), ("sportswear", 0.3)]),
    ("tank top",           [("tshirt", 0.9), ("sportswear", 0.1)]),

    # ── Shirts ──
    ("polo shirt",         [("shirt", 1.0)]),
    ("dress shirt",        [("shirt", 0.9), ("formal_pants", 0.1)]),
    ("blouse",             [("shirt", 0.9), ("dress", 0.1)]),
    ("vestment",           [("waistcoat", 0.7), ("robe", 0.3)]),
    ("velvet",             [("shirt", 0.5), ("blazer", 0.3), ("jacket", 0.2)]),

    # ── Formal / Suits ──
    ("suit",               [("blazer", 0.4), ("formal_pants", 0.4), ("waistcoat", 0.2)]),
    ("tuxedo",             [("blazer", 0.5), ("formal_pants", 0.3), ("waistcoat", 0.2)]),
    ("waistcoat",          [("waistcoat", 1.0)]),
    ("vest",               [("waistcoat", 1.0)]),
    ("blazer",             [("blazer", 1.0)]),

    # ── Outerwear ──
    ("parka",              [("jacket", 1.0)]),
    ("poncho",             [("jacket", 0.7), ("sherwani", 0.1), ("robe", 0.2)]),
    ("cloak",              [("jacket", 0.5), ("robe", 0.3), ("sherwani", 0.2)]),
    ("puffer",             [("jacket", 1.0)]),
    ("windbreaker",        [("jacket", 0.9), ("tracksuit", 0.1)]),
    ("jacket",             [("jacket", 1.0)]),
    ("coat",               [("jacket", 0.7), ("blazer", 0.3)]),
    ("overcoat",           [("jacket", 0.8), ("blazer", 0.2)]),

    # ── Sweaters / Knit ──
    ("cardigan",           [("sweater", 1.0)]),
    ("pullover",           [("sweater", 1.0)]),
    ("sweater",            [("sweater", 1.0)]),
    ("sweatshirt",         [("hoodie", 0.8), ("sweater", 0.2)]),
    ("hoodie",             [("hoodie", 1.0)]),

    # ── Traditional / Ethnic ──
    ("sarong",             [("kurta", 0.5), ("dress", 0.5)]),
    ("kimono",             [("robe", 0.6), ("kurta", 0.4)]),
    ("abaya",              [("kurta", 0.6), ("dress", 0.4)]),
    ("tunic",              [("kurta", 0.8), ("shirt", 0.2)]),
    ("caftan",             [("kurta", 0.6), ("robe", 0.4)]),
    ("dashiki",            [("kurta", 0.7), ("shirt", 0.3)]),
    ("kurta",              [("kurta", 1.0)]),
    ("sherwani",           [("sherwani", 1.0)]),

    # ── Tracksuits / Athletic ──
    ("tracksuit",          [("tracksuit", 1.0)]),
    ("sweatsuit",          [("tracksuit", 0.9), ("hoodie", 0.1)]),
    ("jogging suit",       [("tracksuit", 0.9), ("track_pants", 0.1)]),
    ("warm-up suit",       [("tracksuit", 0.8), ("sportswear", 0.2)]),

    # ── Robes ──
    ("robe",               [("robe", 1.0)]),
    ("bathrobe",           [("robe", 1.0)]),
    ("dressing gown",      [("robe", 1.0)]),

    # ── Bottoms ──
    ("jean",               [("jeans", 1.0)]),
    ("denim",              [("jeans", 1.0)]),
    ("cargo",              [("cargo_pants", 1.0)]),
    ("utility pants",      [("cargo_pants", 0.9), ("formal_pants", 0.1)]),
    ("pocketed pants",     [("cargo_pants", 0.8), ("formal_pants", 0.2)]),
    ("chino",              [("formal_pants", 0.7), ("jeans", 0.3)]),
    ("sweatpants",         [("track_pants", 0.9), ("tracksuit", 0.1)]),
    ("jogger",             [("track_pants", 0.9), ("tracksuit", 0.1)]),
    ("track pants",        [("track_pants", 1.0)]),
    ("trouser",            [("formal_pants", 1.0)]),
    ("slack",              [("formal_pants", 1.0)]),
    ("pant",               [("formal_pants", 0.6), ("jeans", 0.2), ("cargo_pants", 0.2)]),
    ("short",              [("shorts", 1.0)]),
    ("pajama",             [("pyjama", 1.0)]),

    # ── Dresses / Skirts ──
    ("miniskirt",          [("skirt", 1.0)]),
    ("overskirt",          [("skirt", 0.9), ("dress", 0.1)]),
    ("skirt",              [("skirt", 1.0)]),
    ("gown",               [("dress", 0.8), ("robe", 0.2)]),
    ("dress",              [("dress", 1.0)]),
    ("bikini",             [("sportswear", 0.7), ("dress", 0.3)]),

    # ── Footwear (order matters: specific before generic) ──
    ("sneaker",            [("sneakers", 1.0)]),
    ("loafer",             [("loafers", 1.0)]),
    ("oxford",             [("formal_shoes", 0.9), ("shoes", 0.1)]),
    ("brogue",             [("formal_shoes", 0.9), ("shoes", 0.1)]),
    ("derby",              [("formal_shoes", 0.8), ("shoes", 0.2)]),
    ("dress shoe",         [("formal_shoes", 1.0)]),
    ("slipper",            [("slippers", 1.0)]),
    ("flip-flop",          [("slippers", 0.9), ("sandals", 0.1)]),
    ("thong",              [("slippers", 0.7), ("sandals", 0.3)]),
    ("mule",               [("slippers", 0.8), ("shoes", 0.2)]),
    ("sandal",             [("sandals", 1.0)]),
    ("boot",               [("shoes", 0.7), ("formal_shoes", 0.3)]),
    ("shoe",               [("shoes", 0.5), ("formal_shoes", 0.3), ("sneakers", 0.2)]),
    ("clog",               [("shoes", 0.7), ("slippers", 0.3)]),
    ("sock",               [("socks", 1.0)]),

    # ── Hats ──
    ("sombrero",           [("cap", 1.0)]),
    ("bonnet",             [("cap", 1.0)]),
    ("beanie",             [("cap", 1.0)]),
    ("beret",              [("cap", 1.0)]),
    ("helmet",             [("cap", 0.8), ("accessories", 0.2)]),
    ("hat",                [("cap", 1.0)]),
    ("cap",                [("cap", 1.0)]),
    ("bearskin",           [("cap", 1.0)]),

    # ── Accessories ──
    ("sunglasses",         [("accessories", 1.0)]),
    ("sunglass",           [("accessories", 1.0)]),
    ("eyewear",            [("accessories", 1.0)]),
    ("stethoscope",        [("accessories", 1.0)]),
    ("backpack",           [("bag", 1.0)]),
    ("handbag",            [("bag", 1.0)]),
    ("purse",              [("bag", 1.0)]),
    ("briefcase",          [("bag", 0.9), ("accessories", 0.1)]),
    ("mailbag",            [("bag", 1.0)]),
    ("bag",                [("bag", 1.0)]),
    ("watch",              [("watch", 1.0)]),
    ("clock",              [("watch", 0.6), ("accessories", 0.4)]),
    ("buckle",             [("belt", 0.9), ("accessories", 0.1)]),
    ("belt",               [("belt", 1.0)]),
    ("strap",              [("belt", 0.6), ("watch", 0.4)]),
    ("band",               [("belt", 0.4), ("watch", 0.3), ("bracelet", 0.3)]),
    ("ring",               [("ring", 1.0)]),
    ("chain",              [("chain", 1.0)]),
    ("necklace",           [("chain", 1.0)]),
    ("pendant",            [("chain", 0.9), ("accessories", 0.1)]),
    ("bracelet",           [("bracelet", 1.0)]),
    ("wristband",          [("bracelet", 0.8), ("watch", 0.2)]),
    ("cravat",             [("tie", 0.9), ("scarf", 0.1)]),
    ("necktie",            [("tie", 1.0)]),
    ("tie",                [("tie", 1.0)]),
    ("stole",              [("scarf", 1.0)]),
    ("scarf",              [("scarf", 1.0)]),
    ("muffler",            [("scarf", 1.0)]),
    ("bib",                [("accessories", 1.0)]),
    ("apron",              [("accessories", 0.7), ("shirt", 0.3)]),
    ("wallet",             [("accessories", 1.0)]),
    ("umbrella",           [("accessories", 1.0)]),

    # ── Sportswear ──
    ("swimming",           [("sportswear", 0.8), ("shorts", 0.2)]),
    ("leotard",            [("sportswear", 1.0)]),
    ("unitard",            [("sportswear", 0.8), ("tracksuit", 0.2)]),

    # ── Context signals (non-clothing objects → implied clothing) ──
    ("dumbbell",           [("tshirt", 0.6), ("sportswear", 0.4)]),
    ("barbell",            [("tshirt", 0.5), ("sportswear", 0.5)]),
    ("racket",             [("sportswear", 0.8), ("tshirt", 0.2)]),

    # ── Skip / suppress ──
    ("diaper",             [("unknown", 1.0)]),
    ("brassiere",          [("unknown", 1.0)]),
    ("mask",               [("accessories", 0.8), ("unknown", 0.2)]),
]

# ── Rule-Based Correction Layer ───────────────────────────────────
# Each rule: (predicted_type, condition_fn, corrected_type, priority)
# condition_fn receives the set of raw ImageNet labels from top-K predictions.
# Higher priority rules override lower ones.

def _has_any(labels_set, keywords):
    """Check if any keyword appears in any label."""
    for label in labels_set:
        for kw in keywords:
            if kw in label:
                return True
    return False


def _has_all(labels_set, keywords):
    """Check if all keywords appear somewhere across the labels."""
    for kw in keywords:
        found = False
        for label in labels_set:
            if kw in label:
                found = True
                break
        if not found:
            return False
    return True


CORRECTION_RULES = [
    # Jackets misclassified as shirts
    {
        "from": "shirt",
        "condition": lambda labels: _has_any(labels, ["coat", "parka", "puffer", "windbreaker"]),
        "to": "jacket",
        "priority": 10,
    },
    # Blazers misclassified as shirts/formal_pants
    {
        "from": "shirt",
        "condition": lambda labels: _has_any(labels, ["suit", "tuxedo"]) and not _has_any(labels, ["waistcoat", "vest"]),
        "to": "blazer",
        "priority": 10,
    },
    {
        "from": "formal_pants",
        "condition": lambda labels: _has_any(labels, ["suit", "tuxedo"]) and not _has_any(labels, ["trouser", "slack", "pant", "waistcoat", "vest"]),
        "to": "blazer",
        "priority": 10,
    },
    # Waistcoat / Vest detection
    {
        "from": "blazer",
        "condition": lambda labels: _has_any(labels, ["waistcoat", "vest"]),
        "to": "waistcoat",
        "priority": 11,
    },
    {
        "from": "shirt",
        "condition": lambda labels: _has_any(labels, ["waistcoat", "vest"]),
        "to": "waistcoat",
        "priority": 11,
    },
    # Sweaters confused with T-shirts
    {
        "from": "tshirt",
        "condition": lambda labels: _has_any(labels, ["cardigan", "pullover", "sweater", "knit", "wool"]),
        "to": "sweater",
        "priority": 10,
    },
    # Sherwani misclassified as jacket
    {
        "from": "jacket",
        "condition": lambda labels: _has_any(labels, ["embroid", "ornate", "brocade", "gold"]) or _has_any(labels, ["vestment", "cloak", "poncho"]),
        "to": "sherwani",
        "priority": 9,
    },
    # Kurta misclassified as shirt
    {
        "from": "shirt",
        "condition": lambda labels: _has_any(labels, ["tunic", "caftan", "dashiki", "sarong", "abaya"]),
        "to": "kurta",
        "priority": 10,
    },
    # Formal pants misclassified as T-shirts
    {
        "from": "tshirt",
        "condition": lambda labels: _has_any(labels, ["trouser", "slack", "suit", "pant"]) and not _has_any(labels, ["jersey", "t-shirt", "maillot"]),
        "to": "formal_pants",
        "priority": 9,
    },
    # Cargo pants not separated
    {
        "from": "formal_pants",
        "condition": lambda labels: _has_any(labels, ["cargo", "utility", "pocket"]),
        "to": "cargo_pants",
        "priority": 10,
    },
    {
        "from": "jeans",
        "condition": lambda labels: _has_any(labels, ["cargo", "utility"]),
        "to": "cargo_pants",
        "priority": 10,
    },
    # Belts misclassified as caps
    {
        "from": "cap",
        "condition": lambda labels: _has_any(labels, ["buckle", "strap", "belt", "leather"]) and not _has_any(labels, ["hat", "brim", "visor", "bonnet"]),
        "to": "belt",
        "priority": 10,
    },
    # Caps misclassified as bags
    {
        "from": "bag",
        "condition": lambda labels: _has_any(labels, ["hat", "brim", "visor", "beanie", "beret", "bonnet", "cap"]) and not _has_any(labels, ["backpack", "handbag", "purse"]),
        "to": "cap",
        "priority": 10,
    },
    # Ties / Bow ties not detected
    {
        "from": "shirt",
        "condition": lambda labels: _has_any(labels, ["bow tie"]),
        "to": "bow_tie",
        "priority": 11,
    },
    {
        "from": "accessories",
        "condition": lambda labels: _has_any(labels, ["necktie", "cravat", "windsor"]),
        "to": "tie",
        "priority": 10,
    },
    # Slippers misclassified as shoes
    {
        "from": "shoes",
        "condition": lambda labels: _has_any(labels, ["slipper", "flip-flop", "mule", "thong"]),
        "to": "slippers",
        "priority": 10,
    },
    # Formal shoes misclassified as loafers (or vice versa)
    {
        "from": "loafers",
        "condition": lambda labels: _has_any(labels, ["oxford", "brogue", "derby", "lace-up", "dress shoe"]),
        "to": "formal_shoes",
        "priority": 9,
    },
    {
        "from": "shoes",
        "condition": lambda labels: _has_any(labels, ["oxford", "brogue", "derby", "dress shoe"]) and not _has_any(labels, ["running", "sneaker", "athletic"]),
        "to": "formal_shoes",
        "priority": 8,
    },
    # Robe detection
    {
        "from": "dress",
        "condition": lambda labels: _has_any(labels, ["robe", "bathrobe", "dressing gown", "bath towel"]),
        "to": "robe",
        "priority": 10,
    },
    {
        "from": "shirt",
        "condition": lambda labels: _has_any(labels, ["robe", "bathrobe"]),
        "to": "robe",
        "priority": 10,
    },
    # Tracksuit recognition
    {
        "from": "jacket",
        "condition": lambda labels: _has_any(labels, ["sweatpants", "jogger", "tracksuit"]),
        "to": "tracksuit",
        "priority": 9,
    },
    {
        "from": "hoodie",
        "condition": lambda labels: _has_any(labels, ["sweatpants", "jogger", "track"]),
        "to": "tracksuit",
        "priority": 8,
    },
    # Track pants vs formal pants
    {
        "from": "formal_pants",
        "condition": lambda labels: _has_any(labels, ["sweatpants", "jogger", "track"]),
        "to": "track_pants",
        "priority": 10,
    },
]

# ── Style Mapping ─────────────────────────────────────────────────
STYLE_MAP = {
    "tshirt": "casual", "shirt": "semi-formal", "formal_shirt": "formal",
    "blazer": "formal", "coat": "formal",
    "jacket": "casual", "hoodie": "casual", "sweater": "casual",
    "kurta": "traditional", "sherwani": "traditional",
    "tracksuit": "athletic", "robe": "casual",
    "jeans": "casual", "formal_pants": "formal", "cargo_pants": "casual",
    "track_pants": "casual", "shorts": "casual", "pyjama": "casual",
    "dress": "semi-formal", "skirt": "semi-formal",
    "sneakers": "casual", "loafers": "semi-formal",
    "shoes": "formal", "formal_shoes": "formal",
    "sandals": "casual", "slippers": "casual",
    "sportswear": "athletic",
    "watch": "accessory", "belt": "accessory", "cap": "casual",
    "socks": "accessory", "ring": "accessory", "chain": "accessory",
    "bracelet": "accessory", "tie": "formal", "bow_tie": "formal",
    "scarf": "casual", "bag": "accessory", "accessories": "accessory",
    "waistcoat": "formal",
    "unknown": "casual",
}

# ── Load model ONCE at module level ───────────────────────────────
_model = None
_custom_model = False
_class_index = None
_model_unavailable = False


def preload_models():
    """Manually pre-load models to avoid lag on first request."""
    logger.info("[classifier] Pre-loading models...")
    _ensure_model_loaded()


def _ensure_model_loaded():
    """Lazy-load the model on first use with local caching."""
    global _model, _custom_model, _class_index, _model_unavailable

    if not _ML_STACK_AVAILABLE:
        _model_unavailable = True
        return

    if _model is not None or _model_unavailable:
        return

    custom_weights = WEIGHTS_DIR / "clothing_classifier.pt"
    class_index_file = WEIGHTS_DIR / "class_index.json"

    # ── Priority 1: Fine-tuned model ──
    if custom_weights.exists() and class_index_file.exists():
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

    # ── Priority 2: Locally cached MobileNetV2 weights ──
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        if LOCAL_WEIGHTS_PATH.exists():
            logger.info(
                f"[classifier] Loading cached MobileNetV2 from "
                f"{LOCAL_WEIGHTS_PATH} ({LOCAL_WEIGHTS_PATH.stat().st_size // 1024 // 1024}MB)"
            )
            _model = models.mobilenet_v2(weights=None)
            state_dict = torch.load(
                str(LOCAL_WEIGHTS_PATH), map_location=DEVICE, weights_only=True
            )
            _model.load_state_dict(state_dict)
        else:
            logger.info(
                "[classifier] Local weights not found — downloading "
                "MobileNetV2 (one-time, ~14MB)..."
            )
            _model = models.mobilenet_v2(
                weights=models.MobileNet_V2_Weights.IMAGENET1K_V1
            )
            # Save for future offline use
            torch.save(_model.state_dict(), str(LOCAL_WEIGHTS_PATH))
            logger.info(
                f"[classifier] Weights cached to {LOCAL_WEIGHTS_PATH}"
            )

        _model.eval()
        _custom_model = False
        logger.info("[classifier] MobileNetV2 loaded. Using weighted label mapping v2.")
    except Exception as e:
        logger.warning(f"[classifier] Could not load model stack: {e}")
        _model_unavailable = True


# ── Inference transform ───────────────────────────────────────────
if transforms is not None:
    INFER_TF = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=MEAN, std=STD),
    ])
else:
    INFER_TF = None

# Load ImageNet class labels
_imagenet_labels = None


def _get_imagenet_labels():
    """Get ImageNet 1000 class labels from torchvision."""
    global _imagenet_labels
    if models is None:
        return []
    if _imagenet_labels is not None:
        return _imagenet_labels

    # torchvision provides the label mapping via the weights meta
    weights = models.MobileNet_V2_Weights.IMAGENET1K_V1
    _imagenet_labels = weights.meta["categories"]
    return _imagenet_labels


def _map_imagenet_weighted(label_name: str) -> list:
    """
    Map an ImageNet class name to weighted clothing category scores.

    Returns:
        List of (category, weight) tuples, or [("unknown", 0.1)] if no match.
    """
    label_lower = label_name.lower()

    for keyword, mappings in WEIGHTED_LABEL_MAP:
        if keyword in label_lower:
            return mappings

    return [("unknown", 0.1)]


def _apply_correction_rules(
    predicted_type: str,
    raw_labels_set: set,
) -> str:
    """
    Apply rule-based corrections to fix known misclassification patterns.

    Args:
        predicted_type: The type from weighted scoring.
        raw_labels_set: Set of lowercase ImageNet label strings from top-K.

    Returns:
        Corrected clothing type.
    """
    best_correction = None
    best_priority = -1

    for rule in CORRECTION_RULES:
        if rule["from"] != predicted_type:
            continue
        if rule["priority"] <= best_priority:
            continue
        try:
            if rule["condition"](raw_labels_set):
                best_correction = rule["to"]
                best_priority = rule["priority"]
        except Exception:
            continue

    if best_correction:
        logger.debug(
            f"[classifier] Rule correction: {predicted_type} → {best_correction}"
        )
        return best_correction

    return predicted_type


def _log_prediction(image_path: str, result: dict, raw_labels: list):
    """Append prediction to JSONL log for offline error analysis."""
    try:
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "image": os.path.basename(image_path),
            "predicted_type": result["type"],
            "confidence": result["confidence"],
            "top3": result["top3"],
            "raw_imagenet_labels": raw_labels[:10],
            "style": result["style"],
        }
        with open(str(PREDICTION_LOG_PATH), "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception:
        pass  # Logging should never break the pipeline


def classify_image(image_path: str) -> dict:
    """
    Classify clothing type from an image file path.

    Pipeline:
      1. Load image (supports multi-format via preprocessor fallback)
      2. Run MobileNetV2 inference → top-K ImageNet predictions
      3. Weighted multi-label scoring → candidate clothing type
      4. Rule-based correction → final clothing type
      5. Log prediction for error analysis

    Returns:
        {
          "type":       str,    # "shirt" | "jeans" | "blazer" | etc.
          "confidence": float,  # accumulated weighted score
          "top3":       list,   # [{type, score}, ...]
          "label":      str,    # raw model label
          "style":      str,    # "casual" | "formal" | etc.
        }
    """
    _ensure_model_loaded()
    if _model_unavailable or _model is None or INFER_TF is None or Image is None or torch is None:
        return {
            "type": "unknown",
            "confidence": 0.0,
            "top3": [{"type": "unknown", "score": 0.0}],
            "label": "unavailable_model_stack",
            "style": "casual",
        }

    # ── Load image (multi-format support) ──
    try:
        # Try the preprocessor first for AVIF/HEIC/etc
        from app.ai.image_preprocessor import load_image as preprocess_load
        img = preprocess_load(image_path)
        if img is None:
            raise ValueError("Preprocessor returned None")
    except Exception:
        # Fallback to direct PIL open
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
        raw_labels = []
    else:
        # ── Weighted multi-label scoring ──
        labels = _get_imagenet_labels()
        topk_idx = torch.argsort(probs, descending=True)[:TOP_K]

        # Collect raw labels for rule-based correction
        raw_labels = []
        clothing_scores = {}

        for idx in topk_idx:
            i = idx.item()
            label_name = labels[i]
            raw_score = probs[i].item()
            raw_labels.append(label_name.lower())

            # Get weighted mappings for this ImageNet label
            mappings = _map_imagenet_weighted(label_name)

            for category, weight in mappings:
                if category == "unknown":
                    continue
                weighted_score = raw_score * weight

                if category not in clothing_scores:
                    clothing_scores[category] = {
                        "score": weighted_score,
                        "label": label_name,
                        "raw_score": raw_score,
                    }
                else:
                    clothing_scores[category]["score"] += weighted_score

        if clothing_scores:
            # Sort by accumulated weighted score
            sorted_types = sorted(
                clothing_scores.items(),
                key=lambda x: x[1]["score"],
                reverse=True,
            )

            top3 = [
                {"type": t, "score": round(s["score"], 4)}
                for t, s in sorted_types[:3]
            ]
            best_type = sorted_types[0][0]
            best_score = sorted_types[0][1]["score"]
        else:
            # No clothing detected
            best_idx = torch.argmax(probs).item()
            best_label = labels[best_idx]
            best_score = probs[best_idx].item()
            best_type = "unknown"
            top3 = [{"type": "unknown", "score": round(best_score, 4)}]

        # ── Apply rule-based corrections ──
        raw_labels_set = set(raw_labels)
        best_type = _apply_correction_rules(best_type, raw_labels_set)

    # ── Whitelist & Blacklist Enforcement ──
    if best_type in INVALID_ITEMS or best_type not in VALID_CATEGORIES:
        best_type = "unknown"

    # Ensure all top3 outputs stay within the whitelist
    top3 = [
        {
            "type": t["type"] if (t["type"] in VALID_CATEGORIES and t["type"] not in INVALID_ITEMS) else "unknown",
            "score": t["score"]
        }
        for t in top3
    ]

    result = {
        "type": best_type,
        "confidence": round(best_score, 4),
        "top3": top3,
        "label": f"mobilenet_{best_type}",
        "style": STYLE_MAP.get(best_type, "casual"),
    }

    # ── Log prediction for error analysis ──
    _log_prediction(image_path, result, raw_labels)

    return result
