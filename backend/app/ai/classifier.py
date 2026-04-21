"""
classifier.py — Local clothing classifier with project-compatible output labels.

Drop-in replacement for backend/app/ai/classifier.py

Design goals:
- Keep backend/frontend compatibility by returning existing subtype labels:
  tshirt, shirt, formal_shirt, hoodie, sweater,
  blazer, jacket, coat,
  jeans, formal_pants, cargo_pants, track_pants, shorts, skirt, pyjama,
  sneakers, shoes, loafers, sandals, slippers,
  watch, unknown
- Keep broad bucket in `category`
- Keep local PyTorch inference
- Use official TorchVision weight preprocessing when using built-in models
- Prefer custom fine-tuned TorchScript model if present:
    weights/clothing_classifier.pt
    weights/class_index.json
"""

import json
import logging
import os
from pathlib import Path
from urllib.parse import urlparse

try:
    import torch
    import torch.nn.functional as F
    from PIL import Image, ImageOps
    from torchvision import models, transforms

    _ML_STACK_AVAILABLE = True
except Exception:  # pragma: no cover
    torch = None
    F = None
    Image = None
    ImageOps = None
    models = None
    transforms = None
    _ML_STACK_AVAILABLE = False

logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# Basic config
# -------------------------------------------------------------------

IMG_SIZE = 224
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]
DEVICE = torch.device("cpu") if torch is not None else None
WEIGHTS_DIR = Path(__file__).parent / "weights"

# Environment switches
ALLOW_MODEL_DOWNLOAD = os.getenv("ALLOW_MODEL_DOWNLOAD", "1").strip() == "1"
REQUESTED_BACKBONE = os.getenv("CLOTHING_BACKBONE", "efficientnet_v2_s").strip().lower()
ENABLE_TTA = os.getenv("CLOTHING_TTA", "0").strip() == "1"

# Confidence gates for official-backbone remapping
STRICT_TOTAL_MASS_MIN = 0.15
STRICT_BEST_SCORE_MIN = 0.10
SHIRT_OUTERWEAR_AMBIGUITY_GAP_MAX = 0.035
SHIRT_OUTERWEAR_MIN_SCORE = 0.08
WEAK_OUTERWEAR_WITH_SHIRT_RATIO = 0.75

CROP_MODES = {"original", "torso", "lower_body"}
SHIRT_FAMILY = {"shirt", "formal_shirt", "tshirt"}
OUTERWEAR_LIKE_FAMILY = {"blazer", "jacket", "coat", "sweater", "hoodie"}

# -------------------------------------------------------------------
# Output taxonomy
# -------------------------------------------------------------------

CATEGORY_MAP = {
    # Tops
    "tshirt": "tops",
    "shirt": "tops",
    "formal_shirt": "tops",
    "hoodie": "tops",
    "sweater": "tops",

    # Outerwear
    "blazer": "outerwear",
    "jacket": "outerwear",
    "coat": "outerwear",

    # Bottoms
    "jeans": "bottoms",
    "formal_pants": "bottoms",
    "cargo_pants": "bottoms",
    "track_pants": "bottoms",
    "shorts": "bottoms",
    "skirt": "bottoms",
    "pyjama": "bottoms",

    # Footwear
    "sneakers": "footwear",
    "shoes": "footwear",
    "loafers": "footwear",
    "sandals": "footwear",
    "slippers": "footwear",

    # Allowed accessory
    "watch": "watch",

    "unknown": "other",
}

STYLE_MAP = {
    # Tops
    "tshirt": "casual",
    "shirt": "semi-formal",
    "formal_shirt": "formal",
    "hoodie": "casual",
    "sweater": "casual",

    # Outerwear
    "blazer": "formal",
    "jacket": "casual",
    "coat": "semi-formal",

    # Bottoms
    "jeans": "casual",
    "formal_pants": "formal",
    "cargo_pants": "casual",
    "track_pants": "casual",
    "shorts": "casual",
    "skirt": "semi-formal",
    "pyjama": "casual",

    # Footwear
    "sneakers": "casual",
    "shoes": "formal",
    "loafers": "semi-formal",
    "sandals": "casual",
    "slippers": "casual",

    # Watch
    "watch": "accessory",

    "unknown": "casual",
}

# -------------------------------------------------------------------
# Mapping rules
# Ordered: specific before generic
# Tuple format: (keywords_tuple, output_type, weight)
# -------------------------------------------------------------------

LABEL_KEYWORDS_ORDERED = [
    # --- Tops / formal tops ---
    (("dress shirt",), "formal_shirt", 1.45),
    (("button-down", "button down"), "formal_shirt", 1.40),
    (("t-shirt", "tee shirt", "jersey", "maillot", "tank top"), "tshirt", 1.35),
    (("polo shirt",), "shirt", 1.30),
    (("blouse",), "shirt", 1.25),
    (("shirt",), "shirt", 1.20),

    # Common false positives for shirts
    (("lab coat",), "shirt", 1.20),
    (("military uniform",), "shirt", 1.20),
    (("academic gown",), "shirt", 1.00),
    (("vestment",), "shirt", 1.00),
    (("gown", "robe", "caftan", "kaftan", "abaya"), "shirt", 0.95),
    (("bow tie",), "formal_shirt", 1.15),
    (("bolo tie",), "formal_shirt", 1.10),
    (("windsor tie",), "formal_shirt", 1.15),
    (("necktie",), "formal_shirt", 1.10),

    # Knit / casual top
    (("hoodie", "sweatshirt"), "hoodie", 1.05),
    (("cardigan", "pullover", "sweater"), "sweater", 0.95),

    # --- Outerwear ---
    (("blazer", "waistcoat"), "blazer", 1.15),
    (("trench coat",), "coat", 1.15),
    (("fur coat",), "coat", 1.10),
    (("overcoat", "topcoat", "raincoat", "duffel coat", "pea coat"), "coat", 1.00),
    (("coat",), "coat", 0.80),
    (("parka", "poncho", "cloak", "windbreaker", "jacket", "puffer"), "jacket", 0.82),

    # --- Bottoms ---
    (("business suit",), "formal_pants", 1.20),
    (("suit",), "formal_shirt", 0.95),
    (("blue jean", "jean", "denim"), "jeans", 1.30),
    (("cargo", "utility pants", "pocketed pants"), "cargo_pants", 1.25),
    (("sweatpants", "jogger", "track pants"), "track_pants", 1.20),
    (("trouser", "trousers", "slack", "slacks", "pant", "pants"), "formal_pants", 1.10),
    (("swimming trunks", "shorts", "short"), "shorts", 1.15),
    (("miniskirt", "overskirt", "skirt"), "skirt", 1.15),
    (("pajama", "pyjama"), "pyjama", 1.10),

    # --- Footwear ---
    (("running shoe", "tennis shoe", "sneaker"), "sneakers", 1.25),
    (("loafer",), "loafers", 1.20),
    (("sandal",), "sandals", 1.15),
    (("slipper",), "slippers", 1.10),
    (("clog", "oxford", "brogue", "cowboy boot", "boot", "shoe"), "shoes", 1.00),

    # --- Watch only ---
    (("digital watch", "stopwatch", "watch"), "watch", 1.30),
]

# Ignore these accessory / non-target labels entirely.
# You asked to remove accessories except watch.
SKIP_KEYWORDS = (
    "backpack",
    "mailbag",
    "handbag",
    "purse",
    "bag",
    "belt",
    "buckle",
    "tie",          # handled above only via explicit formal-shirt rules
    "scarf",
    "stole",
    "sombrero",
    "beanie",
    "beret",
    "bonnet",
    "hat",
    "cap",
    "sunglass",
    "eyewear",
    "ring",
    "chain",
    "necklace",
    "bracelet",
    "wristband",
    "sock",
    "stocking",
    "bib",
    "apron",
    "brassiere",
    "diaper",
    "mask",
    "wallet",
    "wall clock",
    "alarm clock",
)

# -------------------------------------------------------------------
# Global state
# -------------------------------------------------------------------

_model = None
_custom_model = False
_class_index = None
_model_unavailable = False
_labels = []
_model_name = "unloaded"
INFER_TF = None

# -------------------------------------------------------------------
# Backbone registry
# -------------------------------------------------------------------

_BACKBONE_SPECS = {
    "efficientnet_v2_s": {
        "builder_name": "efficientnet_v2_s",
        "weights_name": "EfficientNet_V2_S_Weights",
    },
    "convnext_tiny": {
        "builder_name": "convnext_tiny",
        "weights_name": "ConvNeXt_Tiny_Weights",
    },
    "mobilenet_v2": {
        "builder_name": "mobilenet_v2",
        "weights_name": "MobileNet_V2_Weights",
    },
}


def _candidate_backbones():
    ordered = []

    if REQUESTED_BACKBONE in _BACKBONE_SPECS:
        ordered.append(REQUESTED_BACKBONE)

    for name in ("efficientnet_v2_s", "convnext_tiny", "mobilenet_v2"):
        if name not in ordered:
            ordered.append(name)

    return ordered


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def preload_models():
    _ensure_model_loaded()


def _custom_infer_transform():
    if transforms is None:
        return None

    return transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(IMG_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(mean=MEAN, std=STD),
        ]
    )


def _extract_logits(output):
    if torch is None:
        raise RuntimeError("torch unavailable")

    if torch.is_tensor(output):
        return output

    if isinstance(output, dict):
        for key in ("logits", "output", "outputs", "preds"):
            if key in output and torch.is_tensor(output[key]):
                return output[key]

    if isinstance(output, (list, tuple)):
        for item in output:
            if torch.is_tensor(item):
                return item

    raise TypeError("Unsupported model output format")


def _empty_result():
    return {
        "ok": False,
        "error": "classification_failed",
        "type": "unknown",
        "category": "other",
        "style": "casual",
        "confidence": 0.0,
        "top3": [{"type": "unknown", "score": 0.0}],
        "label": "unknown",
    }


def _failure_result(
    reason: str,
    candidate_type: str = "unknown",
    candidate_score: float = 0.0,
    candidate_top3=None,
    extra: dict | None = None,
):
    result = _empty_result()
    result["error"] = reason or "classification_failed"
    normalized_candidate = _normalize_type(candidate_type)
    if normalized_candidate != "unknown":
        result["type"] = normalized_candidate
        result["category"] = _category_for(normalized_candidate)
        result["style"] = _style_for(normalized_candidate)
        result["confidence"] = round(float(candidate_score), 4)
        result["label"] = f"{_model_name}:{normalized_candidate}"
    if candidate_top3:
        result["top3"] = candidate_top3
    if extra:
        result.update(extra)
    return result


def _normalize_type(value: str) -> str:
    if not value:
        return "unknown"

    item_type = str(value).strip().lower().replace("-", "_").replace(" ", "_")

    aliases = {
        # Tops
        "tee": "tshirt",
        "tee_shirt": "tshirt",
        "t_shirt": "tshirt",
        "tshirt": "tshirt",
        "shirt": "shirt",
        "formalshirt": "formal_shirt",
        "formal_shirt": "formal_shirt",
        "hoodie": "hoodie",
        "sweatshirt": "hoodie",
        "sweater": "sweater",
        "cardigan": "sweater",
        "pullover": "sweater",

        # Outerwear
        "blazer": "blazer",
        "jacket": "jacket",
        "coat": "coat",
        "trench_coat": "coat",
        "overcoat": "coat",

        # Bottoms
        "jeans": "jeans",
        "jean": "jeans",
        "formal_pants": "formal_pants",
        "formalpants": "formal_pants",
        "suit": "formal_pants",
        "pants": "formal_pants",
        "pant": "formal_pants",
        "trousers": "formal_pants",
        "trouser": "formal_pants",
        "slacks": "formal_pants",
        "slack": "formal_pants",
        "cargo_pants": "cargo_pants",
        "cargopants": "cargo_pants",
        "track_pants": "track_pants",
        "trackpants": "track_pants",
        "joggers": "track_pants",
        "jogger": "track_pants",
        "short": "shorts",
        "shorts": "shorts",
        "skirt": "skirt",
        "pyjama": "pyjama",
        "pajama": "pyjama",

        # Footwear
        "sneaker": "sneakers",
        "sneakers": "sneakers",
        "shoe": "shoes",
        "shoes": "shoes",
        "loafer": "loafers",
        "loafers": "loafers",
        "sandal": "sandals",
        "sandals": "sandals",
        "slipper": "slippers",
        "slippers": "slippers",
        "boot": "shoes",
        "boots": "shoes",
        "clog": "shoes",
        "oxford": "shoes",
        "brogue": "shoes",

        # Watch
        "watch": "watch",
        "watches": "watch",
    }

    normalized = aliases.get(item_type, "unknown")
    return normalized if normalized in CATEGORY_MAP else "unknown"


def _category_for(item_type: str) -> str:
    return CATEGORY_MAP.get(item_type, "other")


def _style_for(item_type: str) -> str:
    return STYLE_MAP.get(item_type, "casual")


def _normalize_input_image(img, image_path: str):
    if Image is None:
        return img

    suffix = Path(image_path or "").suffix.lower()
    has_alpha = (
        img.mode in {"RGBA", "LA"}
        or (img.mode == "P" and "transparency" in getattr(img, "info", {}))
    )

    # Alpha-bearing WEBP uploads often have transparent padding that distorts cues.
    if suffix == ".webp" and has_alpha:
        neutral_bg = Image.new("RGBA", img.size, (242, 242, 242, 255))
        composited = Image.alpha_composite(neutral_bg, img.convert("RGBA"))
        return composited.convert("RGB")

    return img.convert("RGB")


def _normalize_crop_mode(crop_mode: str | None) -> str:
    normalized = str(crop_mode or "original").strip().lower()
    return normalized if normalized in CROP_MODES else "original"


def _safe_crop_box(width: int, height: int, box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    left, top, right, bottom = box
    left = max(0, min(int(left), width - 1))
    top = max(0, min(int(top), height - 1))
    right = max(left + 1, min(int(right), width))
    bottom = max(top + 1, min(int(bottom), height))
    return left, top, right, bottom


def _crop_box_for_mode(width: int, height: int, crop_mode: str) -> tuple[int, int, int, int]:
    if crop_mode == "torso":
        box = (
            int(width * 0.12),
            int(height * 0.08),
            int(width * 0.88),
            int(height * 0.72),
        )
        return _safe_crop_box(width, height, box)

    if crop_mode == "lower_body":
        box = (
            int(width * 0.15),
            int(height * 0.42),
            int(width * 0.85),
            int(height * 0.98),
        )
        return _safe_crop_box(width, height, box)

    return 0, 0, width, height


def _apply_crop_mode(img, crop_mode: str):
    crop_mode = _normalize_crop_mode(crop_mode)
    if crop_mode == "original":
        return img

    width, height = img.size
    if width < 32 or height < 32:
        return img

    box = _crop_box_for_mode(width, height, crop_mode)
    cropped = img.crop(box)
    if cropped.size[0] < 24 or cropped.size[1] < 24:
        return img
    return cropped


def _build_top3(ranked, raw_scores, limit=3):
    return [
        {
            "type": item_type,
            "score": round(float(raw_scores.get(item_type, 0.0)), 4),
        }
        for item_type, _ in ranked[:limit]
    ]


def _is_shirt_vs_outerwear_ambiguity(
    best_type: str,
    best_score: float,
    runner_up_type: str,
    runner_up_score: float,
    raw_scores: dict[str, float],
) -> bool:
    pair_is_mixed = (
        (best_type in SHIRT_FAMILY and runner_up_type in OUTERWEAR_LIKE_FAMILY)
        or (best_type in OUTERWEAR_LIKE_FAMILY and runner_up_type in SHIRT_FAMILY)
    )
    if pair_is_mixed and best_score >= SHIRT_OUTERWEAR_MIN_SCORE and runner_up_score >= SHIRT_OUTERWEAR_MIN_SCORE:
        if (best_score - runner_up_score) <= SHIRT_OUTERWEAR_AMBIGUITY_GAP_MAX:
            return True

    shirt_mass = sum(raw_scores.get(item, 0.0) for item in SHIRT_FAMILY)
    outerwear_mass = sum(raw_scores.get(item, 0.0) for item in OUTERWEAR_LIKE_FAMILY)
    if best_type in OUTERWEAR_LIKE_FAMILY and shirt_mass >= best_score * WEAK_OUTERWEAR_WITH_SHIRT_RATIO:
        return True
    if best_type in SHIRT_FAMILY and outerwear_mass >= best_score * WEAK_OUTERWEAR_WITH_SHIRT_RATIO:
        return True

    return False


def _map_label_to_type(label_name: str):
    label_lower = label_name.lower()

    # allow explicit formal-shirt rules before broad skip of "tie"
    if "bow tie" in label_lower:
        return "formal_shirt", 1.15
    if "bolo tie" in label_lower:
        return "formal_shirt", 1.10
    if "windsor tie" in label_lower:
        return "formal_shirt", 1.15
    if "necktie" in label_lower:
        return "formal_shirt", 1.10

    if any(skip in label_lower for skip in SKIP_KEYWORDS):
        return "unknown", 0.0

    for keywords, item_type, weight in LABEL_KEYWORDS_ORDERED:
        if any(keyword in label_lower for keyword in keywords):
            return item_type, weight

    return "unknown", 0.0


def _get_labels():
    return _labels if _labels else []


def _official_weight_cache_path(weights):
    if weights is None or torch is None:
        return None

    url = getattr(weights, "url", "") or ""
    if not url:
        return None

    checkpoint_name = os.path.basename(urlparse(url).path)
    if not checkpoint_name:
        return None

    return Path(torch.hub.get_dir()) / "checkpoints" / checkpoint_name


def _load_official_backbone():
    global _model, _custom_model, _model_unavailable, _labels, INFER_TF, _model_name

    if models is None:
        _model_unavailable = True
        return

    last_error = None

    for backbone_name in _candidate_backbones():
        spec = _BACKBONE_SPECS.get(backbone_name)
        if spec is None:
            continue

        builder = getattr(models, spec["builder_name"], None)
        weights_enum = getattr(models, spec["weights_name"], None)

        if builder is None or weights_enum is None:
            continue

        try:
            weights = weights_enum.DEFAULT
            if not ALLOW_MODEL_DOWNLOAD:
                cached_path = _official_weight_cache_path(weights)
                if cached_path is None or not cached_path.exists():
                    logger.info(
                        "[classifier] Skipping %s: no cached weights and ALLOW_MODEL_DOWNLOAD=0",
                        backbone_name,
                    )
                    continue

            _model = builder(weights=weights)
            _model.eval()

            _custom_model = False
            _labels = list(weights.meta.get("categories", []))
            INFER_TF = weights.transforms()
            _model_name = backbone_name
            logger.info("[classifier] Loaded official backbone: %s", backbone_name)
            return
        except Exception as e:
            last_error = e
            logger.warning("[classifier] Failed to load %s: %s", backbone_name, e)

            # If downloads are blocked or unavailable, try next fallback.
            if not ALLOW_MODEL_DOWNLOAD:
                continue

    logger.warning("[classifier] Could not load any official backbone: %s", last_error)
    _model_unavailable = True


def _ensure_model_loaded():
    global _model, _custom_model, _class_index, _model_unavailable, INFER_TF, _model_name

    if not _ML_STACK_AVAILABLE:
        _model_unavailable = True
        return

    if _model is not None or _model_unavailable:
        return

    custom_weights = WEIGHTS_DIR / "clothing_classifier.pt"
    class_index_file = WEIGHTS_DIR / "class_index.json"

    # Prefer fine-tuned local model if present
    if custom_weights.exists() and class_index_file.exists():
        try:
            _model = torch.jit.load(str(custom_weights), map_location=DEVICE)
            _model.eval()

            with open(class_index_file, "r", encoding="utf-8") as f:
                _class_index = json.load(f)

            _custom_model = True
            INFER_TF = _custom_infer_transform()
            _model_name = "custom_fashion_model"
            logger.info("[classifier] Loaded custom clothing model")
            return
        except Exception as e:
            logger.warning("[classifier] Failed to load custom model: %s", e)

    # Fallback to official TorchVision model
    _load_official_backbone()


def _run_logits(img):
    if _model is None or INFER_TF is None:
        raise RuntimeError("Model is not loaded")

    x = INFER_TF(img).unsqueeze(0).to(DEVICE)

    with torch.inference_mode():
        logits = _extract_logits(_model(x))

        if ENABLE_TTA and ImageOps is not None:
            x_flip = INFER_TF(ImageOps.mirror(img)).unsqueeze(0).to(DEVICE)
            logits_flip = _extract_logits(_model(x_flip))
            logits = (logits + logits_flip) / 2.0

        if logits.ndim == 2:
            logits = logits[0]

    return logits


# -------------------------------------------------------------------
# Main API
# -------------------------------------------------------------------

def classify_image(image_path: str, crop_mode: str = "original") -> dict:
    _ensure_model_loaded()
    crop_mode = _normalize_crop_mode(crop_mode)

    if (
        _model_unavailable
        or _model is None
        or INFER_TF is None
        or Image is None
        or torch is None
        or F is None
    ):
        return _failure_result("model_unavailable")

    try:
        img = Image.open(image_path)
        if ImageOps is not None:
            img = ImageOps.exif_transpose(img)
        img = _normalize_input_image(img, image_path)
        img_for_inference = _apply_crop_mode(img, crop_mode)
    except Exception as e:
        logger.error("[classifier] Cannot open image: %s", e)
        return _failure_result("image_open_failed")

    try:
        logits = _run_logits(img_for_inference)
        probs = F.softmax(logits, dim=0)
    except Exception as e:
        logger.error("[classifier] Inference failed: %s", e)
        return _failure_result("inference_failed")

    # ---------------------------------------------------------------
    # Custom model path
    # ---------------------------------------------------------------
    if _custom_model and _class_index:
        top3_idx = torch.argsort(probs, descending=True)[:3]
        top3 = []

        for idx in top3_idx:
            raw_type = _class_index.get(str(idx.item()), "unknown")
            item_type = _normalize_type(raw_type)
            if item_type == "unknown":
                continue

            top3.append(
                {
                    "type": item_type,
                    "score": round(float(probs[idx].item()), 4),
                }
            )

        if not top3:
            return _failure_result("unmapped_custom_prediction")

        best_type = top3[0]["type"]
        best_score = float(top3[0]["score"])
        runner_up_type = top3[1]["type"] if len(top3) > 1 else "unknown"
        runner_up_score = float(top3[1]["score"]) if len(top3) > 1 else 0.0
        raw_scores = {entry["type"]: float(entry["score"]) for entry in top3}

        if best_score < STRICT_BEST_SCORE_MIN:
            return _failure_result(
                "low_confidence",
                candidate_type=best_type,
                candidate_score=best_score,
                candidate_top3=top3,
                extra={
                    "runner_up_type": runner_up_type,
                    "runner_up_score": round(runner_up_score, 4),
                    "confidence_gap": round(float(best_score - runner_up_score), 4),
                },
            )

        if _is_shirt_vs_outerwear_ambiguity(
            best_type=best_type,
            best_score=best_score,
            runner_up_type=runner_up_type,
            runner_up_score=runner_up_score,
            raw_scores=raw_scores,
        ):
            return _failure_result(
                "shirt_vs_outerwear_ambiguity",
                candidate_type=best_type,
                candidate_score=best_score,
                candidate_top3=top3,
                extra={
                    "runner_up_type": runner_up_type,
                    "runner_up_score": round(runner_up_score, 4),
                    "confidence_gap": round(float(best_score - runner_up_score), 4),
                },
            )

        return {
            "ok": True,
            "type": best_type,
            "category": _category_for(best_type),
            "style": _style_for(best_type),
            "confidence": round(best_score, 4),
            "top3": top3,
            "label": f"{_model_name}:{best_type}",
        }

    # ---------------------------------------------------------------
    # Official ImageNet backbone path
    # ---------------------------------------------------------------
    labels = _get_labels()
    if not labels:
        return _failure_result("model_labels_missing")

    topk = min(30, probs.numel())
    topk_idx = torch.argsort(probs, descending=True)[:topk]

    weighted_scores = {}
    raw_scores = {}

    for idx in topk_idx:
        raw_label = labels[idx.item()]
        item_type, weight = _map_label_to_type(raw_label)
        if item_type == "unknown":
            continue

        score = float(probs[idx].item())
        weighted_scores[item_type] = weighted_scores.get(item_type, 0.0) + (score * weight)
        raw_scores[item_type] = raw_scores.get(item_type, 0.0) + score

    if not weighted_scores:
        return _failure_result("no_supported_garment_detected")

    ranked = sorted(weighted_scores.items(), key=lambda x: x[1], reverse=True)

    best_type = ranked[0][0]
    best_score = raw_scores.get(best_type, 0.0)
    total_mass = sum(raw_scores.values())

    # Near-tie adjustment using raw mass
    if len(ranked) >= 2:
        a_type, a_sel = ranked[0]
        b_type, b_sel = ranked[1]
        if abs(a_sel - b_sel) < 0.025 and raw_scores.get(b_type, 0.0) > raw_scores.get(a_type, 0.0):
            ranked[0], ranked[1] = ranked[1], ranked[0]
            best_type = ranked[0][0]
            best_score = raw_scores.get(best_type, 0.0)

    runner_up_type = ranked[1][0] if len(ranked) > 1 else "unknown"
    runner_up_score = raw_scores.get(runner_up_type, 0.0)
    normalized_best_type = _normalize_type(best_type)
    top3 = _build_top3(ranked, raw_scores, limit=3)

    if normalized_best_type == "unknown":
        return _failure_result(
            "unknown",
            candidate_type=best_type,
            candidate_score=best_score,
            candidate_top3=top3,
        )

    if _is_shirt_vs_outerwear_ambiguity(
        best_type=normalized_best_type,
        best_score=best_score,
        runner_up_type=runner_up_type,
        runner_up_score=runner_up_score,
        raw_scores=raw_scores,
    ):
        return _failure_result(
            "shirt_vs_outerwear_ambiguity",
            candidate_type=normalized_best_type,
            candidate_score=best_score,
            candidate_top3=top3,
            extra={
                "total_mass": round(float(total_mass), 4),
                "runner_up_type": runner_up_type,
                "runner_up_score": round(float(runner_up_score), 4),
                "confidence_gap": round(float(best_score - runner_up_score), 4),
            },
        )

    # Weak-evidence rejection
    if total_mass < STRICT_TOTAL_MASS_MIN or best_score < STRICT_BEST_SCORE_MIN:
        return _failure_result(
            "low_confidence",
            candidate_type=normalized_best_type,
            candidate_score=best_score,
            candidate_top3=top3,
            extra={
                "total_mass": round(float(total_mass), 4),
                "runner_up_type": runner_up_type,
                "runner_up_score": round(float(runner_up_score), 4),
                "confidence_gap": round(float(best_score - runner_up_score), 4),
            },
        )

    return {
        "ok": True,
        "type": normalized_best_type,
        "category": _category_for(normalized_best_type),
        "style": _style_for(normalized_best_type),
        "confidence": round(float(best_score), 4),
        "top3": top3,
        "label": f"{_model_name}:{normalized_best_type}",
    }
