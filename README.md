# Clothify AI

Clothify is a full-stack wardrobe app with a local AI pipeline for clothing subtype classification, color extraction, and outfit planning.

## Current AI stack (local)

- Backend: Flask + MongoDB
- Classifier: PyTorch + TorchVision backbones in `backend/app/ai/classifier.py`
  - Preferred: local custom TorchScript model if present:
    - `backend/app/ai/weights/clothing_classifier.pt`
    - `backend/app/ai/weights/class_index.json`
  - Fallback: official TorchVision backbone (`efficientnet_v2_s`, `convnext_tiny`, `mobilenet_v2`)
- Color extraction: OpenCV + CIELAB + KMeans in `backend/app/ai/color_extractor.py`

## Classification contract

The saved wardrobe item keeps subtype-level `type` as the source of truth.

- `type` (required): subtype label (for example `formal_shirt`, `cargo_pants`, `loafers`)
- `category` (optional): broad bucket (`tops`, `bottoms`, `outerwear`, `footwear`, `watch`, `other`)
- `style`: style tag returned by classifier/service (`formal`, `semi-formal`, `casual`, etc.)

Important: `category` is auxiliary metadata and does not replace `type`.

## Classifier download behavior

`ALLOW_MODEL_DOWNLOAD` controls remote TorchVision weight download behavior:

- `ALLOW_MODEL_DOWNLOAD=1` (default): official weights may be downloaded if missing
- `ALLOW_MODEL_DOWNLOAD=0`: remote download is blocked; only cached official weights or local custom weights are used

## API behavior for AI failures

`POST /api/classify` now rejects failed AI analysis instead of saving placeholder results.

- Success: `201` with saved item
- AI analysis failure: `422` with a clear error payload

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Key endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/clothes/`
- `POST /api/classify/`
- `GET /api/outfits/plan`

## License

MIT
