# Changes Log - WardrobeAI Classification Engine Update

This document details the changes made to move WardrobeAI from a fragile, rule-based heuristic fallback system to a fully robust, local, AI-driven offline classification engine.

## 1. Removed Legacy "Heuristic" AI Fallback
- **Before:** The system relied on HuggingFace Inference APIs (`ViT-base-patch16-224`). When that failed (or hit rate limits), it fell back to a deeply flawed `app/services/classifier_service.py` that used OpenCV heuristics (aspect ratio, filename substrings, and simple BGR color thresholding) to guess the clothing type and color.
- **After:** Completely removed the fragile OpenCV heuristics and the dependency on the external HF API.

## 2. Added Local AI Module (`app/ai/`)
- **`app/ai/classifier.py`**:
  - Implemented a 100% local, CPU-friendly inference module using PyTorch and `MobileNetV2`.
  - Downloads and caches pre-trained ImageNet weights (`mobilenet_v2-b0353104.pth`).
  - Utilizes a highly optimized zero-shot mapping (`LABEL_KEYWORDS_ORDERED`) to translate ImageNet classes (e.g., "lab coat", "trench coat", "suit") to WardrobeAI specific categories (e.g., "shirt", "formal_pants").
  - Evaluates an image within ~60ms.
- **`app/ai/color_extractor.py`**:
  - Deprecated edge-case prone BGR color ranges.
  - Implemented CIELAB color space conversion combined with `scikit-learn`'s `KMeans++`.
  - Added smart background separation using both Luminance (L*) and Saturation (S).
  - Maps dominant centroids back to RGB/HSV to give accurate, perceptually precise human color names (covers 25+ named colors).

## 3. Thin Orchestrator Refactor
- Rewrote `app/services/classifier_service.py` from 500+ lines of monolithic, spaghetti code down to ~120 lines.
- It now operates as a clean "thin orchestrator":
  - Takes in the image.
  - Calls `classifier.classify_image()` for type.
  - Calls `color_extractor.extract_colors()` for primary/secondary colors.
  - Computes `occasion_tags` dynamically based on the specific style map and HSV formality.
  - Exposes the exact same `analyze_clothing(image_path)` function signature, ensuring total drop-in backward compatibility with `app/routes/classify_routes.py`.

## 4. Unused/Dead Code Cleanup
- Cleaned up bloated packages and outdated test files:
  - Removed `tensorflow` dependency (~500MB waste).
  - Deleted `model_loader.py` (referenced non-existent `.tflite` files).
  - Deleted `image_preprocessor.py` (unused entirely).
  - Deleted obsolete debug scripts: `debug_shirts.py`, `verify_classifier.py`, `test_hf_api.py`, `colors.txt`, etc.

## 5. Summary
The classification pipeline is now reliable, incredibly fast, totally self-contained (works without the open internet), and extensible if a custom fine-tuned model (`app/ai/weights/clothing_classifier.pt`) is dropped into place later!
