# Changes log - AI contract and taxonomy alignment

## Scope

Updated only the planned files to align the local AI stack, subtype taxonomy, and API behavior.

## 1. `backend/app/ai/classifier.py`

- Added explicit success/failure signal (`ok` + `error`) in classifier responses.
- Ensured `ALLOW_MODEL_DOWNLOAD=0` prevents remote TorchVision weight attempts when weights are not cached.
- Preserved subtype-level `type` values and optional separate `category`.
- Kept schema compatibility by adding fields without removing existing core ones.

## 2. `backend/app/ai/color_extractor.py`

- Removed fake successful gray fallback on unreadable image.
- Added explicit failure payload (`ok: false`, `error`) for extraction failures.
- Preserved successful behavior for valid images (`ok: true` + existing color fields).

## 3. `backend/app/services/classifier_service.py`

- Removed duplicate type-to-style mapping logic.
- Aligned occasion tagging to classifier-provided style output.
- Propagated optional `category` separately from `type`.
- Added explicit pipeline failure output for route-level handling.

## 4. `backend/app/services/outfit_service.py`

- Updated slot grouping taxonomy constants to current subtype set.
- Adjusted weather checks to current subtype values.
- Preserved stored `type` values (no migration, no schema change).

## 5. `backend/app/routes/classify_routes.py`

- Added failure gate: rejects failed AI analysis with `422`.
- Prevents saving placeholder classifier/color results.
- Saves optional `category` as separate field.

## 6. `frontend/src/pages/Wardrobe.jsx`

- Added support for `semi-formal` style rendering.
- Fixed stale config labels (`pyjama`, `loafers`).
- Uses `category` as auxiliary metadata only (display/search), while subtype `type` remains primary for grouping.

## 7. `backend/requirements.txt`

- Normalized file encoding to UTF-8 (no UTF-16 BOM) to keep pip/runtime compatibility stable.
- Kept package list intact (no removals).

## 8. Documentation updates

- `README.md`, `backend/how_it_works.md`, and this log now reflect:
  - local classifier/color pipeline,
  - download guard behavior,
  - subtype `type` + optional `category` contract,
  - route-level AI failure handling.
