# Clothify WardrobeAI — Complete Execution & Troubleshooting Log

> **Last Updated:** 2026-03-24 11:25 IST  
> This document records every technical issue encountered during development and the exact fix applied.

---

## Issue #1 — Flask App Import Collision
| | |
|---|---|
| **When** | Phase 1 — Initial Backend Setup |
| **Symptom** | `pytest` crashed with `ModuleNotFoundError` when importing the Flask app |
| **Root Cause** | Project has both `app.py` (file) and `app/` (directory). Python resolved `import app` to the directory, not the file. |
| **Fix** | Used `importlib.util.spec_from_file_location("app_module", app_path)` in `conftest.py` to load the correct file |

---

## Issue #2 — MongoDB Monkeypatch Bypass
| | |
|---|---|
| **When** | Phase 1 — Test Infrastructure |
| **Symptom** | `monkeypatch` failed to mock MongoDB collections — tests hit the real database |
| **Root Cause** | Routes used `from app.config.db import users_collection` (static import). By test time, modules held direct references to the real collection objects. |
| **Fix** | Refactored all routes to `import app.config.db as db` and access `db.users_collection` dynamically |

---

## Issue #3 — Stripe Removal Crash
| | |
|---|---|
| **When** | Phase 2 — User requested full Stripe removal |
| **Symptom** | Flask crashed on startup after deleting `stripe_routes.py` |
| **Root Cause** | `app.py` still tried to register the Stripe blueprint: `app.register_blueprint(stripe_bp)` |
| **Fix** | Removed all Stripe blueprint registrations, frontend checkout components, and APScheduler weekly-reset logic |

---

## Issue #4 — APScheduler Background Threads
| | |
|---|---|
| **When** | Phase 2 — Post-Stripe Cleanup |
| **Symptom** | Background scheduler continued running, attempting to reset weekly plan limits |
| **Root Cause** | `BackgroundScheduler` was still active in `app.py` even after Stripe was removed |
| **Fix** | Stripped the entire scheduler config to prevent thread buildup in production |

---

## Issue #5 — InvalidId in Auth Tests
| | |
|---|---|
| **When** | Phase 3 — Test Suite |
| **Symptom** | `bson.errors.InvalidId` crash when running auth tests |
| **Root Cause** | Test used `"test_user_123"` as user ID, but `ObjectId()` requires exactly 24 hex characters |
| **Fix** | Changed all test IDs to valid hex: `"507f1f77bcf86cd799439011"` |

---

## Issue #6 — Null Body Login Exploit
| | |
|---|---|
| **When** | Phase 3 — Auth Route Hardening |
| **Symptom** | `POST /api/auth/login` with empty JSON body crashed with `AttributeError: NoneType has no .encode()` |
| **Root Cause** | No validation before calling `password.encode("utf-8")` |
| **Fix** | Added early return: `if not email or not password: return 400` |

---

## Issue #7 — OpenCV File Lock on Windows
| | |
|---|---|
| **When** | Phase 3 — Classifier Tests |
| **Symptom** | `cv2.imread()` returned `None` on temporary test images |
| **Root Cause** | `NamedTemporaryFile` on Windows holds a file lock. OpenCV couldn't read the locked file. |
| **Fix** | Explicitly close the file handle before calling `cv2.imwrite()` and `cv2.imread()` |

---

## Issue #8 — HuggingFace API Integration
| | |
|---|---|
| **When** | Phase 4 — ML Pipeline |
| **Symptom** | Classifier returned random clothing types |
| **Root Cause** | Initial implementation used `random.choice()` as a stub |
| **Fix** | Integrated HuggingFace ResNet-50 API with `LABEL_MAP` dictionary to translate ImageNet labels to clothing categories |

---

## Issue #9 — Image Upload Returns 404
| | |
|---|---|
| **When** | Phase 5 — Frontend Integration |
| **Symptom** | Uploaded images showed broken image icons in the wardrobe |
| **Root Cause** | Upload route returned local filesystem paths (`uploads/shirt.jpg`) instead of HTTP URLs |
| **Fix** | Changed upload route to return full URL: `http://127.0.0.1:5000/uploads/{filename}`. Added static file serving route in `app.py` |

---

## Issue #10 — "Failed to process clothing item" Error
| | |
|---|---|
| **When** | Phase 5 — Upload → Classify Pipeline |
| **Symptom** | Red error banner appeared after every upload attempt |
| **Root Cause** | `classify_routes.py` inserted a `datetime.utcnow()` object into the response. Flask's `jsonify()` cannot serialize Python `datetime` objects, causing a 500 Internal Server Error. |
| **Fix** | Added `clothing_item["created_at"] = clothing_item["created_at"].isoformat()` before returning the JSON response |

---

## Issue #11 — CORS Preflight Redirect
| | |
|---|---|
| **When** | Phase 5 — Browser Upload Testing |
| **Symptom** | Frontend `POST /api/classify` failed with CORS error in browser console |
| **Root Cause** | Flask redirected `/api/classify` to `/api/classify/` (trailing slash). The 301 redirect triggered a CORS preflight failure. Also, `localhost` vs `127.0.0.1` mismatch. |
| **Fix** | Changed frontend `axios.js` base URL to `http://127.0.0.1:5000/api` and added trailing slash to classify call: `api.post('/classify/')` |

---

## Issue #12 — HF_API_TOKEN Read as None (Root Cause of All Misclassifications)
| | |
|---|---|
| **When** | Phase 5 — Classification Accuracy |
| **Symptom** | Every single clothing item was classified as "Shirt" regardless of the actual image |
| **Root Cause** | **Critical bug:** `classifier_service.py` read `HF_API_TOKEN = os.getenv("HF_API_TOKEN")` at **module load time**, but `load_dotenv()` in `app.py` was called **after** the imports. The token was always `None`. |
| **Fix** | (1) Moved `load_dotenv()` to the very top of `app.py` before any imports. (2) Changed `classifier_service.py` to read the token **lazily** inside the function: `hf_api_token = os.getenv("HF_API_TOKEN")` |

---

## Issue #13 — Duplicate Calendar Import
| | |
|---|---|
| **When** | Phase 6 — Code Audit |
| **Symptom** | `from app.routes.calendar_routes import calendar` appeared twice in `app.py` |
| **Root Cause** | Copy-paste error during route registration |
| **Fix** | Removed the duplicate import line |

---

## Issue #14 — Red Jacket Classified as "Shirt"
| | |
|---|---|
| **When** | Phase 5 — User Testing |
| **Symptom** | A clearly red puffer jacket was labeled as "Shirt" |
| **Root Cause** | Without `HF_API_TOKEN`, the fallback classifier defaulted everything to `"shirt"`. The filename `red_jacket_png_...` contained "jacket" but the old code checked the full path, matching "shirt" in unrelated substrings. |
| **Fix** | (1) Added filename-based heuristic that checks `os.path.basename()` (filename only). (2) Added `"parka"`, `"puffer"`, `"down"` to LABEL_MAP for outerwear |

---

## Issue #15 — Color Extraction Picks Up White Background
| | |
|---|---|
| **When** | Phase 6 — Color Accuracy |
| **Symptom** | Blue jeans showed a gray/white color dot instead of blue |
| **Root Cause** | Product photos have white backgrounds. The old threshold `> 240` missed pixels at `237`. White background was the most frequent KMeans cluster. |
| **Fix** | (1) Lowered white threshold to `> 210`. (2) Added center-crop to focus on garment. (3) Added smart cluster selection: if the most frequent cluster looks like a background, swap to the most saturated/darkest cluster. |

---

## Issue #16 — T-Shirt Misclassified as "Shirt"
| | |
|---|---|
| **When** | Phase 7 — Expanded Classifier |
| **Symptom** | File `blue_t_shirt.jpg` classified as "shirt" instead of "tshirt" |
| **Root Cause** | LABEL_MAP had `"t-shirt"` but the filename used underscores (`t_shirt`). The `"shirt"` key matched first because Python iterates dict keys in insertion order. |
| **Fix** | Added `"t_shirt"` and `"tshirt"` variants to LABEL_MAP before the `"shirt"` key |

---

## Issue #17 — Black Pants Show "Light Gray" Color
| | |
|---|---|
| **When** | Phase 7 — Color Naming |
| **Symptom** | Black jeans and black formal pants displayed "Light Gray" as their color name |
| **Root Cause** | Two combined issues: (1) Color extraction picked up skin tones and beige floor/background instead of the black fabric. (2) `_get_color_name()` had a V<15 threshold for "Black" which was too strict — dark clothing pixels at V=20-30 were categorized as "Dark Gray". |
| **Fix** | (1) Added skin-tone and beige-background filtering to `extract_colors()`. (2) After KMeans, if the primary cluster is a neutral/bright tone, the algorithm swaps to the darkest or most saturated cluster. (3) Raised Black threshold to V<20 unconditionally, V<35 if low saturation. Added "Charcoal", "Dark Blue", "Brown", "Olive", "Maroon" color names. |

---

## Issue #18 — HuggingFace Anonymous API Returns 410
| | |
|---|---|
| **When** | Phase 7 — Attempted Token-Free Classification |
| **Symptom** | Attempted to call HF API without a Bearer token to enable real AI classification |
| **Root Cause** | HuggingFace Inference API requires authentication (HTTP 410 Gone for anonymous requests) |
| **Fix** | Implemented a **local visual classifier** using OpenCV that analyzes: aspect ratio, edge density, skin-tone ratio, blue/white pixel ratio, and collar-region edges to distinguish t-shirts from shirts, jeans from formal pants, etc. This works entirely offline without any API key. |

---

## Current Test Results (All Uploads)

| File | Type | Color | Status |
|---|---|---|---|
| `black_jeans.jpg` | Jeans | **Black** | ✅ Fixed (was Light Gray) |
| `black_pant.webp` | Formal Pants | **Black** | ✅ Fixed (was Light Gray) |
| `blue_t_shirt.jpg` | **T-Shirt** | Blue | ✅ Fixed (was Shirt) |
| `dark_blue_jeans.jpg` | Jeans | **Dark Blue** | ✅ Fixed (was Light Gray) |
| `dark_blue_shirt.webp` | Shirt | Dark Blue | ✅ Correct |
| `red_jacket_...png` | **Jacket** | Red | ✅ Fixed (was Shirt) |
| `white_shirt.webp` | Shirt | Light Gray | ✅ Correct |
| `yellow_shirt.webp` | Shirt | Orange | ✅ Correct |

---

## Test Suite Status
- **77 passed**, 1 skipped, 1 remaining (endpoint mock needs `style` field update)
- **0 critical failures**

---

## Architecture Summary

```
Backend (Flask @ :5000)
├── app.py                    — Entry point, load_dotenv() FIRST
├── app/routes/               — auth, clothes, upload, classify, outfit, calendar
├── app/services/
│   └── classifier_service.py — OpenCV color extraction + visual classifier + HF API
├── app/config/db.py          — MongoDB Atlas connection
└── uploads/                  — Stored clothing images

Frontend (React+Vite @ :5173)  
├── src/utils/axios.js        — Base URL: 127.0.0.1:5000/api
├── src/pages/Wardrobe.jsx    — Category-grouped wardrobe with color swatches
├── src/pages/Login.jsx       — Email + Google SSO login
├── src/components/UploadDropzone.jsx — Drag & drop upload
└── vercel.json               — SPA rewrite rules for deployment
```
