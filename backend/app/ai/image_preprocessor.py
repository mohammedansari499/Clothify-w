"""
image_preprocessor.py — Multi-format image loader with graceful fallbacks.

Accepts: JPG, JPEG, PNG, WEBP, AVIF, BMP, TIFF, HEIC
Returns: PIL.Image in RGB mode, ready for classifier or color extraction.

Falls back to OpenCV raw-byte decode if PIL fails.
Never raises — returns None on unrecoverable failure.
"""
import io
import logging
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

try:
    from PIL import Image
except ImportError:
    Image = None

# Register AVIF support (no-op if already registered or unavailable)
try:
    import pillow_avif  # noqa: F401 — side-effect import registers the codec
except ImportError:
    pass

# Register HEIF/HEIC support (optional)
try:
    import pillow_heif  # noqa: F401
    pillow_heif.register_heif_opener()
except (ImportError, Exception):
    pass

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".avif",
    ".bmp", ".tiff", ".tif", ".heic", ".heif",
}


def load_image(image_path: str) -> Optional["Image.Image"]:
    """
    Load an image from disk and return it as an RGB PIL Image.

    Tries PIL first (handles AVIF/WEBP/HEIC via plugins).
    Falls back to OpenCV raw-byte decode on failure.

    Args:
        image_path: Absolute or relative path to the image file.

    Returns:
        PIL.Image in RGB mode, or None if the image cannot be loaded.
    """
    if Image is None:
        logger.error("[preprocessor] PIL/Pillow is not installed.")
        return None

    path = Path(image_path)
    if not path.exists():
        logger.warning(f"[preprocessor] File not found: {image_path}")
        return None

    ext = path.suffix.lower()

    # ── Attempt 1: PIL (supports most formats + plugins) ──
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        logger.debug(f"[preprocessor] PIL loaded {path.name} ({ext})")
        return img
    except Exception as e:
        logger.debug(f"[preprocessor] PIL failed for {path.name}: {e}")

    # ── Attempt 2: OpenCV raw-byte decode (handles edge cases) ──
    try:
        raw_bytes = path.read_bytes()
        arr = np.frombuffer(raw_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is not None:
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(rgb)
            logger.debug(
                f"[preprocessor] OpenCV fallback loaded {path.name} ({ext})"
            )
            return img
    except Exception as e:
        logger.debug(f"[preprocessor] OpenCV fallback failed for {path.name}: {e}")

    # ── Attempt 3: Force-convert via temp PNG (last resort) ──
    try:
        bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
        if bgr is not None:
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(rgb)
            logger.debug(
                f"[preprocessor] OpenCV imread fallback loaded {path.name}"
            )
            return img
    except Exception as e:
        logger.debug(f"[preprocessor] Final fallback failed: {e}")

    logger.error(
        f"[preprocessor] All loaders failed for {path.name}. "
        f"Format '{ext}' may not be supported."
    )
    return None


def load_image_cv2(image_path: str) -> Optional[np.ndarray]:
    """
    Load an image as an OpenCV BGR numpy array.

    Tries OpenCV first, falls back to PIL → numpy conversion.

    Args:
        image_path: Path to the image file.

    Returns:
        BGR numpy array, or None on failure.
    """
    path = Path(image_path)
    if not path.exists():
        return None

    # ── Attempt 1: Direct OpenCV imread ──
    try:
        bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
        if bgr is not None:
            return bgr
    except Exception:
        pass

    # ── Attempt 2: Raw bytes → imdecode ──
    try:
        raw_bytes = path.read_bytes()
        arr = np.frombuffer(raw_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is not None:
            return bgr
    except Exception:
        pass

    # ── Attempt 3: PIL → numpy ──
    try:
        pil_img = load_image(image_path)
        if pil_img is not None:
            rgb = np.array(pil_img)
            bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            return bgr
    except Exception:
        pass

    logger.error(f"[preprocessor] Cannot load image for OpenCV: {image_path}")
    return None


def is_supported_format(image_path: str) -> bool:
    """Check if the file extension is in our supported list."""
    ext = Path(image_path).suffix.lower()
    return ext in SUPPORTED_EXTENSIONS
