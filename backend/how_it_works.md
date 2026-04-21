# How the local AI pipeline works

This backend uses a local AI stack in `backend/app/ai/` to produce subtype classification and color metadata.

## 1. Route flow (`/api/classify`)

1. `backend/app/routes/classify_routes.py` resolves a local upload path.
2. It calls `analyze_clothing(image_path)` from `backend/app/services/classifier_service.py`.
3. On success, the route saves the wardrobe item.
4. On AI failure, the route returns `422` and does not save placeholder results.

## 2. Clothing classification (`backend/app/ai/classifier.py`)

- Prefers local custom TorchScript weights when both files exist:
  - `weights/clothing_classifier.pt`
  - `weights/class_index.json`
- Otherwise falls back to official TorchVision backbones.
- Output keeps subtype-level `type` values for compatibility.
- Optional `category` is returned as separate broad metadata.

### Download guard

`ALLOW_MODEL_DOWNLOAD=0` blocks remote weight attempts.

- If official weights are not already cached locally, those backbones are skipped.
- This prevents unintended online downloads in restricted/offline environments.

## 3. Color extraction (`backend/app/ai/color_extractor.py`)

- Reads image with OpenCV.
- Applies type-aware focus crop.
- Converts to CIELAB, filters background-heavy pixels.
- Runs KMeans++ clustering and returns dominant colors.

Failure behavior:

- If image read fails, returns explicit failure payload (`ok: false`, `error`).
- No fake gray fallback is returned on read failure.

## 4. Service orchestration (`backend/app/services/classifier_service.py`)

- Uses classifier style output directly for style/occasion tagging.
- Passes `category` separately from subtype `type`.
- Returns `ok: false` on classification/color extraction failure so routes can reject invalid analysis.

## 5. Data contract summary

- `type`: required subtype (source of truth for wardrobe behavior)
- `category`: optional broad grouping metadata
- `style`: style label used by planning and UI
- `colors` / `primary_color` / `color_name`: extracted color metadata

The app must not replace subtype `type` with broad categories.
