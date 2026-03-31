import { useState } from "react";

const PHASES = [
  {
    id: 0,
    days: "Day 0",
    title: "Antigravity Setup",
    subtitle: "Project init, environment, dependencies",
    color: "#00FFB2",
    icon: "⚡",
    tasks: [
      { id: "t0-1", text: "Create new project in Antigravity IDE → New Project → Python (Flask)" },
      { id: "t0-2", text: "Set project structure: create /backend and /frontend folders in file tree" },
      { id: "t0-3", text: "Open Antigravity terminal → install backend dependencies" },
      { id: "t0-4", text: "Open second terminal tab → create Vite React frontend" },
      { id: "t0-5", text: "Create .env file in /backend with all placeholder keys" },
      { id: "t0-6", text: "Verify both servers run simultaneously (Flask :5000, Vite :5173)" },
    ],
    files: [
      {
        name: "Terminal — Backend Setup",
        lang: "bash",
        path: "Antigravity Terminal",
        code: `# In Antigravity terminal, run these commands in order:

cd backend
pip install flask flask-cors flask-jwt-extended pymongo \
  bcrypt python-dotenv opencv-python-headless \
  scikit-learn pillow requests google-auth \
  google-auth-oauthlib google-api-python-client \
  stripe apscheduler gunicorn cloudinary

# Verify installs
python -c "import flask, cv2, sklearn, stripe; print('All good!')"`,
      },
      {
        name: "Terminal — Frontend Setup",
        lang: "bash",
        path: "Antigravity Terminal (Tab 2)",
        code: `# Open a second terminal tab in Antigravity

cd frontend
npm create vite@latest . -- --template react
npm install
npm install axios react-router-dom react-dropzone \
  @stripe/stripe-js lucide-react

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Start dev server
npm run dev`,
      },
      {
        name: ".env",
        lang: "bash",
        path: "backend/.env",
        code: `# ── Auth ──────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/wardrobeai
JWT_SECRET_KEY=replace_with_64_char_random_string
JWT_REFRESH_SECRET=replace_with_different_64_char_string

# ── Image Storage (Cloudinary - free 25GB) ────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── AI — Hugging Face API (free tier) ─────────
HF_API_TOKEN=hf_your_token_here
HF_CLASSIFY_URL=https://api-inference.huggingface.co/models/microsoft/resnet-50

# ── Google Calendar ───────────────────────────
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback

# ── Stripe ────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_ID=price_your_price_id

# ── App ───────────────────────────────────────
FRONTEND_URL=http://localhost:5173
FLASK_ENV=development`,
      },
    ],
    note: "💡 Antigravity tip: Use the split-pane view (View → Split Terminal) to run Flask and Vite side by side without switching tabs.",
  },
  {
    id: 1,
    days: "Days 1–2",
    title: "Backend Core + Auth",
    subtitle: "Flask app, MongoDB schemas, JWT register/login",
    color: "#4DFFFF",
    icon: "🔐",
    tasks: [
      { id: "t1-1", text: "Create backend/app.py — Flask app with CORS, JWT, error handlers" },
      { id: "t1-2", text: "Create backend/config.py — load .env, export config object" },
      { id: "t1-3", text: "Create backend/models.py — User + Clothes + OutfitPlan schemas" },
      { id: "t1-4", text: "Create backend/routes/auth.py — register + login endpoints" },
      { id: "t1-5", text: "Create backend/utils/jwt_helpers.py — token refresh decorator" },
      { id: "t1-6", text: "Test: POST /api/auth/register returns 201 with tokens" },
      { id: "t1-7", text: "Test: POST /api/auth/login returns access + refresh tokens" },
      { id: "t1-8", text: "Test: protected route returns 401 without valid JWT" },
    ],
    files: [
      {
        name: "app.py",
        lang: "python",
        path: "backend/app.py",
        code: `from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from routes.auth import auth_bp
from routes.clothes import clothes_bp
from routes.classify import classify_bp
from routes.calendar_sync import calendar_bp
from routes.planner import planner_bp
from routes.stripe_webhooks import stripe_bp

app = Flask(__name__)
app.config.from_object(Config)

# Extensions
CORS(app, resources={r"/api/*": {"origins": Config.FRONTEND_URL}},
     supports_credentials=True)
jwt = JWTManager(app)

# Blueprints
app.register_blueprint(auth_bp,     url_prefix="/api/auth")
app.register_blueprint(clothes_bp,  url_prefix="/api/clothes")
app.register_blueprint(classify_bp, url_prefix="/api")
app.register_blueprint(calendar_bp, url_prefix="/api/calendar")
app.register_blueprint(planner_bp,  url_prefix="/api")
app.register_blueprint(stripe_bp,   url_prefix="/api/stripe")

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)`,
      },
      {
        name: "config.py",
        lang: "python",
        path: "backend/config.py",
        code: `import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # JWT
    JWT_SECRET_KEY          = os.getenv("JWT_SECRET_KEY")
    JWT_REFRESH_SECRET      = os.getenv("JWT_REFRESH_SECRET")
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY    = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # Hugging Face
    HF_API_TOKEN      = os.getenv("HF_API_TOKEN")
    HF_CLASSIFY_URL   = os.getenv("HF_CLASSIFY_URL")

    # Google
    GOOGLE_CLIENT_ID      = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET  = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI   = os.getenv("GOOGLE_REDIRECT_URI")

    # Stripe
    STRIPE_SECRET_KEY      = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET  = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_PRICE_ID        = os.getenv("STRIPE_PRICE_ID")

    # App
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")`,
      },
      {
        name: "models.py",
        lang: "python",
        path: "backend/models.py",
        code: `from pymongo import MongoClient, ASCENDING
from bson import ObjectId
from config import Config
from datetime import datetime

client = MongoClient(Config.MONGO_URI, maxPoolSize=5)
db     = client["wardrobeai"]

# ── Collections ───────────────────────────────
users       = db["users"]
clothes     = db["clothes"]
outfit_plans = db["outfit_plans"]

# ── Indexes (run once on startup) ─────────────
def create_indexes():
    users.create_index("email", unique=True)
    clothes.create_index("user_id")
    clothes.create_index("occasion_tags")
    outfit_plans.create_index([("user_id", ASCENDING),
                                ("week_start", ASCENDING)])

create_indexes()

# ── Schema helpers ────────────────────────────
def new_user(name, email, password_hash):
    return {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "tier": "free",               # "free" | "pro"
        "stripe_customer_id": None,
        "stripe_subscription_id": None,
        "google_tokens": None,
        "outfits_this_week": 0,
        "week_reset_date": datetime.utcnow(),
        "created_at": datetime.utcnow(),
    }

def new_cloth(user_id, image_url, cloth_type, primary_color,
              secondary_colors, primary_hsv, occasion_tags,
              confidence_score, subtype=""):
    return {
        "user_id": ObjectId(user_id),
        "image_url": image_url,
        "type": cloth_type,           # "shirt","pants","dress",...
        "subtype": subtype,
        "primary_color": primary_color,     # [r, g, b]
        "secondary_colors": secondary_colors,
        "primary_hsv": primary_hsv,         # [h, s, v]
        "occasion_tags": occasion_tags,     # ["casual","formal",...]
        "season_tags": [],
        "usage_count": 0,
        "last_worn": None,
        "confidence_score": confidence_score,
        "created_at": datetime.utcnow(),
    }`,
      },
      {
        name: "routes/auth.py",
        lang: "python",
        path: "backend/routes/auth.py",
        code: `from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
import bcrypt
from models import users, new_user
from bson import ObjectId
import re

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@]+@[^@]+\.[^@]+$")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name  = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    pw    = data.get("password") or ""

    if not name or not EMAIL_RE.match(email) or len(pw) < 8:
        return jsonify({"error": "Invalid input"}), 400
    if users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt())
    user   = new_user(name, email, hashed.decode())
    result = users.insert_one(user)
    uid    = str(result.inserted_id)

    return jsonify({
        "access_token":  create_access_token(identity=uid),
        "refresh_token": create_refresh_token(identity=uid),
        "user": {"id": uid, "name": name, "email": email, "tier": "free"}
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data  = request.get_json()
    email = (data.get("email") or "").strip().lower()
    pw    = (data.get("password") or "")
    user  = users.find_one({"email": email})

    if not user or not bcrypt.checkpw(pw.encode(),
                                       user["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    uid = str(user["_id"])
    return jsonify({
        "access_token":  create_access_token(identity=uid),
        "refresh_token": create_refresh_token(identity=uid),
        "user": {
            "id": uid, "name": user["name"],
            "email": email, "tier": user["tier"]
        }
    }), 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    uid = get_jwt_identity()
    return jsonify({"access_token": create_access_token(identity=uid)}), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    uid  = get_jwt_identity()
    user = users.find_one({"_id": ObjectId(uid)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": uid, "name": user["name"],
        "email": user["email"], "tier": user["tier"],
        "outfits_this_week": user.get("outfits_this_week", 0)
    }), 200`,
      },
    ],
    note: "💡 Antigravity tip: Use the built-in REST Client (Tools → HTTP Client) to test endpoints without leaving the IDE.",
  },
  {
    id: 2,
    days: "Days 3–4",
    title: "AI Engine",
    subtitle: "MobileNetV2 classifier + OpenCV color extraction",
    color: "#FF6B6B",
    icon: "🤖",
    tasks: [
      { id: "t2-1", text: "Create backend/ai/classifier.py — Hugging Face ResNet-50 clothing classifier" },
      { id: "t2-2", text: "Create backend/ai/color_extractor.py — OpenCV + KMeans top-3 colors" },
      { id: "t2-3", text: "Create backend/ai/occasion_tagger.py — type+color → occasion tags" },
      { id: "t2-4", text: "Create backend/utils/storage.py — Cloudinary upload helper" },
      { id: "t2-5", text: "Create backend/routes/classify.py — POST /api/classify endpoint" },
      { id: "t2-6", text: "Create backend/routes/clothes.py — CRUD routes" },
      { id: "t2-7", text: "Test: upload shirt.jpg → returns type='shirt', RGB color, occasion tags" },
      { id: "t2-8", text: "Test: confidence < 0.70 returns type='unknown' gracefully" },
    ],
    files: [
      {
        name: "ai/classifier.py",
        lang: "python",
        path: "backend/ai/classifier.py",
        code: `"""
Clothing classifier using Hugging Face Inference API (ResNet-50).
No local model needed — free tier gives 30k requests/month.
Falls back to rule-based type detection if API fails.
"""
import requests
import base64
from config import Config

# Map ImageNet/fashion labels → our wardrobe types
LABEL_MAP = {
    "jersey":         "shirt",
    "t-shirt":        "shirt",
    "shirt":          "shirt",
    "blouse":         "shirt",
    "dress":          "dress",
    "gown":           "dress",
    "skirt":          "skirt",
    "trousers":       "pants",
    "jeans":          "pants",
    "shorts":         "shorts",
    "sock":           "accessories",
    "shoe":           "shoes",
    "sneaker":        "shoes",
    "boot":           "shoes",
    "sandal":         "shoes",
    "coat":           "outerwear",
    "jacket":         "outerwear",
    "hoodie":         "outerwear",
    "sweater":        "outerwear",
    "tie":            "accessories",
    "scarf":          "accessories",
    "hat":            "accessories",
    "bag":            "accessories",
    "suit":           "formal_top",
}

HEADERS = {"Authorization": f"Bearer {Config.HF_API_TOKEN}"}

def classify_image(image_bytes: bytes) -> dict:
    """
    Returns: {
      "type": str,        # e.g. "shirt"
      "label": str,       # raw HF label
      "confidence": float # 0.0 – 1.0
    }
    """
    try:
        # Send raw bytes to HF Inference API
        resp = requests.post(
            Config.HF_CLASSIFY_URL,
            headers=HEADERS,
            data=image_bytes,
            timeout=10
        )
        resp.raise_for_status()
        predictions = resp.json()   # [{label, score}, ...]

        for pred in predictions:
            label = pred["label"].lower()
            score = pred["score"]
            # Match against our label map
            for key, clothing_type in LABEL_MAP.items():
                if key in label:
                    return {
                        "type": clothing_type,
                        "label": pred["label"],
                        "confidence": round(score, 3)
                    }

        # No match found
        top = predictions[0]
        if top["score"] < 0.70:
            return {"type": "unknown", "label": top["label"],
                    "confidence": top["score"]}
        return {"type": "unknown", "label": top["label"],
                "confidence": top["score"]}

    except Exception as e:
        print(f"Classifier error: {e}")
        return {"type": "unknown", "label": "error",
                "confidence": 0.0}`,
      },
      {
        name: "ai/color_extractor.py",
        lang: "python",
        path: "backend/ai/color_extractor.py",
        code: `"""
Color extraction using OpenCV + KMeans clustering.
Returns top 3 colors as RGB + primary in HSV for matching.
"""
import cv2
import numpy as np
from sklearn.cluster import KMeans
import colorsys

def extract_colors(image_bytes: bytes, k: int = 5) -> dict:
    """
    Args:
        image_bytes: raw image bytes
        k: number of clusters (use 5, return top 3)
    Returns: {
        "primary_color": [r, g, b],
        "secondary_colors": [[r,g,b], [r,g,b]],
        "primary_hsv": [h_degrees, s_percent, v_percent]
    }
    """
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"primary_color": [128,128,128],
                "secondary_colors": [], "primary_hsv": [0,0,50]}

    # Resize to 150x150 for speed
    img = cv2.resize(img, (150, 150), interpolation=cv2.INTER_AREA)

    # Remove near-white and near-black (background pixels)
    img_rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pixels   = img_rgb.reshape(-1, 3).astype(float)
    mask     = ~(
        (pixels.max(axis=1) > 240) |   # near white
        (pixels.max(axis=1) < 15)       # near black
    )
    filtered = pixels[mask]
    if len(filtered) < 50:
        filtered = pixels  # fallback: use all pixels

    # KMeans clustering
    km = KMeans(n_clusters=min(k, len(filtered)),
                n_init=10, random_state=42)
    km.fit(filtered)

    # Sort clusters by size (largest = dominant)
    counts = np.bincount(km.labels_)
    sorted_idx = np.argsort(-counts)
    centers = km.cluster_centers_[sorted_idx]

    colors = [[int(c[0]), int(c[1]), int(c[2])] for c in centers[:3]]
    primary = colors[0]
    secondary = colors[1:] if len(colors) > 1 else []

    # Convert primary to HSV
    r, g, b = primary[0]/255, primary[1]/255, primary[2]/255
    h, s, v  = colorsys.rgb_to_hsv(r, g, b)
    hsv = [round(h * 360, 1), round(s * 100, 1), round(v * 100, 1)]

    return {
        "primary_color": primary,
        "secondary_colors": secondary,
        "primary_hsv": hsv
    }`,
      },
      {
        name: "ai/occasion_tagger.py",
        lang: "python",
        path: "backend/ai/occasion_tagger.py",
        code: `"""
Rule-based occasion tagging from clothing type + color.
No ML needed — lookup table is fast and explainable.
"""

# [clothing_type] → base occasions
TYPE_OCCASIONS = {
    "shirt":      ["casual", "semi-formal"],
    "formal_top": ["formal", "business"],
    "pants":      ["casual", "semi-formal", "formal"],
    "dress":      ["casual", "semi-formal", "formal"],
    "skirt":      ["casual", "semi-formal"],
    "shorts":     ["casual", "athletic"],
    "outerwear":  ["casual", "formal", "business"],
    "shoes":      ["casual"],
    "accessories":["casual"],
    "unknown":    ["casual"],
}

# Color rules: (V threshold, S threshold) → occasion modifier
def _color_formality(hsv):
    """Returns 'formal', 'casual', or 'neutral' based on HSV."""
    h, s, v = hsv
    is_dark    = v < 35
    is_neutral = s < 20  # grey / white / beige
    is_bright  = s > 70 and v > 60

    if is_dark and is_neutral:    return "formal"
    if is_dark and not is_bright: return "formal"
    if is_bright:                 return "casual"
    return "neutral"

def get_occasion_tags(cloth_type: str, hsv: list) -> list:
    base = TYPE_OCCASIONS.get(cloth_type, ["casual"])
    formality = _color_formality(hsv)

    tags = set(base)

    if formality == "formal":
        tags.add("formal")
        tags.add("business")
        tags.discard("athletic")
    elif formality == "casual":
        tags.add("casual")
        tags.discard("formal")
        tags.discard("business")

    # Type-specific overrides
    if cloth_type in ("shoes", "shorts"):
        tags.discard("formal")
        tags.discard("business")
    if cloth_type == "formal_top":
        tags.discard("casual")
        tags.discard("athletic")

    return sorted(list(tags))`,
      },
      {
        name: "routes/classify.py",
        lang: "python",
        path: "backend/routes/classify.py",
        code: `from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ai.classifier import classify_image
from ai.color_extractor import extract_colors
from ai.occasion_tagger import get_occasion_tags
from utils.storage import upload_image
from models import clothes, new_cloth
import requests

classify_bp = Blueprint("classify", __name__)

@classify_bp.route("/classify", methods=["POST"])
@jwt_required()
def classify():
    uid = get_jwt_identity()

    # Accept: multipart file OR JSON {image_url}
    if "file" in request.files:
        img_bytes = request.files["file"].read()
        image_url = upload_image(img_bytes)          # Cloudinary
    elif request.is_json:
        url = request.json.get("image_url", "")
        resp = requests.get(url, timeout=10)
        img_bytes = resp.content
        image_url = url
    else:
        return jsonify({"error": "No image provided"}), 400

    # AI pipeline
    cls_result   = classify_image(img_bytes)
    color_result = extract_colors(img_bytes)
    occasions    = get_occasion_tags(cls_result["type"],
                                      color_result["primary_hsv"])

    # Save to MongoDB
    doc = new_cloth(
        user_id         = uid,
        image_url       = image_url,
        cloth_type      = cls_result["type"],
        primary_color   = color_result["primary_color"],
        secondary_colors= color_result["secondary_colors"],
        primary_hsv     = color_result["primary_hsv"],
        occasion_tags   = occasions,
        confidence_score= cls_result["confidence"],
    )
    result = clothes.insert_one(doc)

    return jsonify({
        "id":            str(result.inserted_id),
        "type":          cls_result["type"],
        "label":         cls_result["label"],
        "confidence":    cls_result["confidence"],
        "primary_color": color_result["primary_color"],
        "secondary_colors": color_result["secondary_colors"],
        "primary_hsv":   color_result["primary_hsv"],
        "occasion_tags": occasions,
        "image_url":     image_url,
    }), 201`,
      },
    ],
    note: "💡 Antigravity tip: Use the AI Chat panel (right sidebar) while writing — paste this code and ask 'Explain the KMeans step' for instant understanding.",
  },
  {
    id: 3,
    days: "Day 5",
    title: "Google Calendar Sync",
    subtitle: "OAuth2 flow + event ingestion + occasion mapping",
    color: "#FFD93D",
    icon: "📅",
    tasks: [
      { id: "t3-1", text: "Google Cloud Console: create project, enable Calendar API v3, create OAuth credentials" },
      { id: "t3-2", text: "Add http://localhost:5000/api/calendar/callback to Authorized redirect URIs" },
      { id: "t3-3", text: "Create backend/routes/calendar_sync.py with auth + sync endpoints" },
      { id: "t3-4", text: "Test: GET /api/calendar/auth redirects to Google consent screen" },
      { id: "t3-5", text: "Test: after consent, tokens stored in user's MongoDB document" },
      { id: "t3-6", text: "Test: POST /api/calendar/sync returns [{date, title, occasion}] for next 7 days" },
    ],
    files: [
      {
        name: "routes/calendar_sync.py",
        lang: "python",
        path: "backend/routes/calendar_sync.py",
        code: `from flask import Blueprint, redirect, request, jsonify, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import google.auth.transport.requests
from models import users
from bson import ObjectId
from config import Config
from datetime import datetime, timezone, timedelta
import re, json

calendar_bp = Blueprint("calendar", __name__)

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

# ── Keyword → occasion mapping ─────────────────────────────
OCCASION_KEYWORDS = {
    "formal":    ["meeting", "interview", "presentation", "conference",
                  "standup", "review", "client", "board", "sync", "call"],
    "athletic":  ["gym", "yoga", "run", "workout", "training", "sport",
                  "cycling", "swim", "hike", "crossfit", "pilates"],
    "semi-formal":["dinner", "party", "date", "brunch", "wedding",
                   "graduation", "ceremony", "gala", "reception"],
    "casual":    ["lunch", "coffee", "walk", "errand", "shopping"],
}

def infer_occasion(title: str) -> str:
    t = title.lower()
    for occasion, keywords in OCCASION_KEYWORDS.items():
        if any(k in t for k in keywords):
            return occasion
    return "casual"   # default fallback

# ── OAuth Flow ─────────────────────────────────────────────
def _make_flow():
    return Flow.from_client_config(
        client_config={
            "web": {
                "client_id":     Config.GOOGLE_CLIENT_ID,
                "client_secret": Config.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [Config.GOOGLE_REDIRECT_URI],
                "auth_uri":  "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=Config.GOOGLE_REDIRECT_URI
    )

@calendar_bp.route("/auth", methods=["GET"])
@jwt_required()
def calendar_auth():
    flow = _make_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline", include_granted_scopes="true",
        state=get_jwt_identity()    # pass user_id through OAuth state
    )
    return redirect(auth_url)

@calendar_bp.route("/callback", methods=["GET"])
def calendar_callback():
    uid  = request.args.get("state")
    code = request.args.get("code")
    flow = _make_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Store tokens in user document
    users.update_one({"_id": ObjectId(uid)}, {"$set": {
        "google_tokens": {
            "token":         creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri":     creds.token_uri,
            "client_id":     creds.client_id,
            "client_secret": creds.client_secret,
            "scopes":        list(creds.scopes) if creds.scopes else [],
        }
    }})
    return redirect(f"{Config.FRONTEND_URL}/profile?calendar=connected")

@calendar_bp.route("/sync", methods=["POST"])
@jwt_required()
def sync_calendar():
    uid  = get_jwt_identity()
    user = users.find_one({"_id": ObjectId(uid)})
    if not user or not user.get("google_tokens"):
        return jsonify({"error": "Calendar not connected"}), 400

    # Restore + refresh credentials
    t = user["google_tokens"]
    creds = Credentials(
        token=t["token"], refresh_token=t["refresh_token"],
        token_uri=t["token_uri"], client_id=t["client_id"],
        client_secret=t["client_secret"]
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(google.auth.transport.requests.Request())
        users.update_one({"_id": ObjectId(uid)},
                         {"$set": {"google_tokens.token": creds.token}})

    service = build("calendar", "v3", credentials=creds)
    now     = datetime.now(timezone.utc)
    week_end = now + timedelta(days=7)

    events_result = service.events().list(
        calendarId="primary",
        timeMin=now.isoformat(),
        timeMax=week_end.isoformat(),
        maxResults=50, singleEvents=True,
        orderBy="startTime"
    ).execute()

    events = []
    for e in events_result.get("items", []):
        start = (e["start"].get("dateTime") or
                 e["start"].get("date", ""))[:10]
        title    = e.get("summary", "Untitled")
        occasion = infer_occasion(title)
        events.append({
            "date":     start,
            "title":    title,
            "occasion": occasion
        })

    return jsonify({"events": events, "count": len(events)}), 200`,
      },
    ],
    note: "💡 Antigravity tip: Store your Google OAuth credentials as Secrets (Settings → Secrets) not in .env for production.",
  },
  {
    id: 4,
    days: "Days 6–7",
    title: "Outfit Planner Algorithm",
    subtitle: "Color contrast scoring + weekly plan generation",
    color: "#C77DFF",
    icon: "🎨",
    tasks: [
      { id: "t4-1", text: "Create backend/utils/color_math.py — HSV hue-difference contrast scorer" },
      { id: "t4-2", text: "Create backend/routes/planner.py — GET /api/plan?week=YYYY-MM-DD" },
      { id: "t4-3", text: "Implement generate_plan() function with occasion + color + variety scoring" },
      { id: "t4-4", text: "Test: plan generated for user with 5+ clothes items" },
      { id: "t4-5", text: "Test: Monday with formal calendar event uses formal-tagged clothes" },
      { id: "t4-6", text: "Test: same item does not appear on consecutive days" },
      { id: "t4-7", text: "Test: free user 4th plan request returns 403" },
    ],
    files: [
      {
        name: "utils/color_math.py",
        lang: "python",
        path: "backend/utils/color_math.py",
        code: `"""
Color contrast scoring using HSV hue-circle geometry.
Score 0.0–1.0 based on color theory rules.
"""

def hue_diff(h1: float, h2: float) -> float:
    """Circular hue difference in degrees (always 0–180)."""
    diff = abs(h1 - h2) % 360
    return min(diff, 360 - diff)

def color_contrast_score(hsv1: list, hsv2: list) -> float:
    """
    Score a top+bottom pair based on color theory:
    - Complementary (hue Δ ~180°) → 1.0
    - Triadic (hue Δ ~120°)       → 0.85
    - Analogous (Δ 30–60°)        → 0.70
    - Neutral pair (low saturation)→ 0.70
    - Clash (Δ 60–100°)           → 0.30
    """
    h1, s1, v1 = hsv1
    h2, s2, v2 = hsv2
    delta = hue_diff(h1, h2)

    # Neutral colors (grey/white/beige) pair with everything
    if s1 < 20 or s2 < 20:
        return 0.70

    if 155 <= delta <= 205:   return 1.00   # Complementary
    if 105 <= delta < 155:    return 0.85   # Triadic
    if  25 <= delta < 60:     return 0.70   # Analogous
    if delta < 25:            return 0.65   # Monochromatic
    if  60 <= delta < 105:    return 0.30   # Clash zone
    return 0.40

def occasion_match_score(cloth_tags: list, day_occasion: str) -> float:
    if day_occasion in cloth_tags:  return 1.0
    if "casual" in cloth_tags:      return 0.5
    return 0.2

def variety_score(item_id: str, worn_log: list) -> float:
    """worn_log: list of item_ids worn recently (most recent last)."""
    if not worn_log:              return 1.0
    if item_id == worn_log[-1]:   return 0.0   # worn today
    if item_id in worn_log[-3:]:  return 0.5   # worn this week
    return 1.0

def outfit_score(top, bottom, day_occasion: str,
                 worn_log: list) -> float:
    """
    Final score = 0.40 × occasion + 0.40 × color + 0.20 × variety
    """
    occ   = (occasion_match_score(top["occasion_tags"], day_occasion) +
             occasion_match_score(bottom["occasion_tags"], day_occasion)) / 2
    color = color_contrast_score(top["primary_hsv"], bottom["primary_hsv"])
    var   = (variety_score(str(top["_id"]), worn_log) +
             variety_score(str(bottom["_id"]), worn_log)) / 2

    return round(0.40 * occ + 0.40 * color + 0.20 * var, 3)`,
      },
      {
        name: "routes/planner.py",
        lang: "python",
        path: "backend/routes/planner.py",
        code: `from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import users, clothes, outfit_plans
from utils.color_math import outfit_score
from bson import ObjectId
from datetime import datetime, timedelta
import itertools

planner_bp = Blueprint("planner", __name__)

TOP_TYPES    = {"shirt", "formal_top", "outerwear", "dress"}
BOTTOM_TYPES = {"pants", "skirt", "shorts", "dress"}
FREE_LIMIT   = 3   # plans per week

DAYS = ["monday","tuesday","wednesday","thursday",
        "friday","saturday","sunday"]

def _reset_if_needed(user):
    """Reset weekly counter every Monday."""
    now        = datetime.utcnow()
    last_reset = user.get("week_reset_date", now)
    if (now - last_reset).days >= 7:
        users.update_one({"_id": user["_id"]}, {"$set": {
            "outfits_this_week": 0,
            "week_reset_date": now
        }})
        user["outfits_this_week"] = 0

def _best_outfit(wardrobe, occasion, worn_log):
    tops    = [c for c in wardrobe if c["type"] in TOP_TYPES]
    bottoms = [c for c in wardrobe if c["type"] in BOTTOM_TYPES
               and c["type"] != "dress"]  # dresses are standalone
    dresses = [c for c in wardrobe if c["type"] == "dress"]

    best_score, best = 0, None

    # Try top + bottom combinations
    for top, bottom in itertools.product(tops, bottoms):
        if str(top["_id"]) == str(bottom["_id"]):
            continue
        s = outfit_score(top, bottom, occasion, worn_log)
        if s > best_score:
            best_score = s
            best = {"top": top, "bottom": bottom, "score": s}

    # Try standalone dresses
    for dress in dresses:
        s = outfit_score(dress, dress, occasion, worn_log)
        if s > best_score:
            best_score = s
            best = {"dress": dress, "score": s}

    return best

@planner_bp.route("/plan", methods=["GET"])
@jwt_required()
def get_plan():
    uid  = get_jwt_identity()
    user = users.find_one({"_id": ObjectId(uid)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    _reset_if_needed(user)

    # Enforce free tier limit
    if user["tier"] == "free" and user.get("outfits_this_week",0) >= FREE_LIMIT:
        return jsonify({
            "error": "upgrade_required",
            "message": "Free plan: 3 outfit plans/week. Upgrade to Pro for unlimited.",
            "plans_used": user.get("outfits_this_week", 0)
        }), 403

    week_str = request.args.get("week",
                datetime.utcnow().strftime("%Y-%m-%d"))
    try:
        week_start = datetime.strptime(week_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Invalid week format (YYYY-MM-DD)"}), 400

    # Load user's wardrobe
    wardrobe = list(clothes.find({"user_id": ObjectId(uid)}))
    if len(wardrobe) < 3:
        return jsonify({
            "error": "not_enough_items",
            "message": "Add at least 3 clothing items to generate a plan."
        }), 400

    # Get calendar events for the week
    events = {e["date"]: e["occasion"]
              for e in (user.get("calendar_events") or [])}

    # Generate plan
    plan     = {}
    worn_log = []
    for i, day in enumerate(DAYS):
        date_str = (week_start + timedelta(days=i)).strftime("%Y-%m-%d")
        occasion = events.get(date_str, "casual")
        outfit   = _best_outfit(wardrobe, occasion, worn_log)

        if outfit:
            if "dress" in outfit:
                item_ids = [str(outfit["dress"]["_id"])]
                plan[day] = {
                    "type": "dress",
                    "dress": {
                        "id": str(outfit["dress"]["_id"]),
                        "image_url": outfit["dress"]["image_url"],
                        "primary_color": outfit["dress"]["primary_color"],
                    },
                    "score": outfit["score"],
                    "occasion": occasion,
                }
            else:
                item_ids = [str(outfit["top"]["_id"]),
                            str(outfit["bottom"]["_id"])]
                plan[day] = {
                    "type": "separates",
                    "top":  {
                        "id": str(outfit["top"]["_id"]),
                        "image_url": outfit["top"]["image_url"],
                        "primary_color": outfit["top"]["primary_color"],
                    },
                    "bottom": {
                        "id": str(outfit["bottom"]["_id"]),
                        "image_url": outfit["bottom"]["image_url"],
                        "primary_color": outfit["bottom"]["primary_color"],
                    },
                    "score": outfit["score"],
                    "occasion": occasion,
                }
            worn_log.extend(item_ids)
        else:
            plan[day] = {"type": "none", "occasion": occasion}

    # Persist plan + increment counter
    outfit_plans.replace_one(
        {"user_id": ObjectId(uid), "week_start": week_start},
        {"user_id": ObjectId(uid), "week_start": week_start,
         "days": plan, "generated_at": datetime.utcnow()},
        upsert=True
    )
    users.update_one({"_id": ObjectId(uid)},
                     {"$inc": {"outfits_this_week": 1}})

    return jsonify({"week_start": week_str, "plan": plan}), 200`,
      },
    ],
    note: "💡 Antigravity tip: Use the debugger (Debug → Add Breakpoint) inside _best_outfit() to inspect outfit scores in real time.",
  },
  {
    id: 5,
    days: "Day 8",
    title: "React Frontend",
    subtitle: "Pages, components, hooks, API client",
    color: "#56CFE1",
    icon: "⚛️",
    tasks: [
      { id: "t5-1", text: "Configure TailwindCSS in tailwind.config.js and add custom colors" },
      { id: "t5-2", text: "Create src/api/axiosClient.js — base Axios instance with auto token refresh" },
      { id: "t5-3", text: "Create src/hooks/useAuth.js — login, register, logout, user state" },
      { id: "t5-4", text: "Create pages: Login.jsx, Register.jsx with form validation" },
      { id: "t5-5", text: "Create src/pages/Wardrobe.jsx — grid + UploadZone drag-drop" },
      { id: "t5-6", text: "Create src/pages/Planner.jsx — 7-column week view + Generate button" },
      { id: "t5-7", text: "Create src/components/StripeModal.jsx — upgrade prompt overlay" },
      { id: "t5-8", text: "Wire React Router: / → Dashboard, /wardrobe, /planner, /profile" },
    ],
    files: [
      {
        name: "api/axiosClient.js",
        lang: "javascript",
        path: "frontend/src/api/axiosClient.js",
        code: `import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) {
        window.location.href = "/login";
        return Promise.reject(err);
      }
      try {
        const { data } = await axios.post(
          \`\${import.meta.env.VITE_API_URL}/auth/refresh\`,
          {},
          { headers: { Authorization: \`Bearer \${refresh}\` } }
        );
        localStorage.setItem("access_token", data.access_token);
        original.headers.Authorization = \`Bearer \${data.access_token}\`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;`,
      },
      {
        name: "hooks/useAuth.js",
        lang: "javascript",
        path: "frontend/src/hooks/useAuth.js",
        code: `import { useState, useEffect, createContext, useContext } from "react";
import api from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      api.get("/auth/me")
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token",  data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register",
                                    { name, email, password });
    localStorage.setItem("access_token",  data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);`,
      },
      {
        name: "pages/Planner.jsx (key section)",
        lang: "javascript",
        path: "frontend/src/pages/Planner.jsx",
        code: `import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axiosClient";
import StripeModal from "../components/StripeModal";

const DAYS = ["Monday","Tuesday","Wednesday",
              "Thursday","Friday","Saturday","Sunday"];
const DAY_KEYS = ["monday","tuesday","wednesday",
                  "thursday","friday","saturday","sunday"];

function ColorSwatch({ rgb }) {
  const [r,g,b] = rgb || [200,200,200];
  return (
    <div style={{ backgroundColor: \`rgb(\${r},\${g},\${b})\` }}
         className="w-6 h-6 rounded-full border border-white/20" />
  );
}

export default function Planner() {
  const { user }            = useAuth();
  const [plan, setPlan]     = useState(null);
  const [loading, setLoad]  = useState(false);
  const [showUpgrade, setUpgrade] = useState(false);
  const [error, setError]   = useState("");

  const generatePlan = async () => {
    setLoad(true); setError("");
    try {
      const weekStart = new Date();
      // Move to Monday
      const day = weekStart.getDay();
      const diff = (day === 0 ? -6 : 1 - day);
      weekStart.setDate(weekStart.getDate() + diff);
      const week = weekStart.toISOString().split("T")[0];

      const { data } = await api.get(\`/plan?week=\${week}\`);
      setPlan(data.plan);
    } catch (err) {
      if (err.response?.status === 403 &&
          err.response.data?.error === "upgrade_required") {
        setUpgrade(true);
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || "Not enough clothing items.");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Weekly Planner</h1>
        <button onClick={generatePlan} disabled={loading}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700
                     text-white rounded-lg font-medium transition">
          {loading ? "Generating…" : "✨ Generate Plan"}
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-7 gap-3">
        {DAY_KEYS.map((key, i) => {
          const day = plan?.[key];
          return (
            <div key={key} className="bg-white rounded-xl border p-3 min-h-48">
              <p className="text-xs font-bold text-gray-500 mb-2">
                {DAYS[i].toUpperCase()}
              </p>
              {loading && (
                <div className="animate-pulse space-y-2">
                  <div className="h-20 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
              )}
              {day && !loading && day.type !== "none" && (
                <div className="space-y-2">
                  {day.type === "separates" && (
                    <>
                      <img src={day.top.image_url} alt="top"
                           className="w-full h-20 object-cover rounded" />
                      <ColorSwatch rgb={day.top.primary_color} />
                      <img src={day.bottom.image_url} alt="bottom"
                           className="w-full h-20 object-cover rounded" />
                      <ColorSwatch rgb={day.bottom.primary_color} />
                    </>
                  )}
                  {day.type === "dress" && (
                    <>
                      <img src={day.dress.image_url} alt="dress"
                           className="w-full h-20 object-cover rounded" />
                      <ColorSwatch rgb={day.dress.primary_color} />
                    </>
                  )}
                  <span className="text-xs font-medium px-2 py-0.5
                                   bg-indigo-50 text-indigo-700 rounded-full">
                    {day.occasion}
                  </span>
                  <p className="text-xs text-gray-400">
                    Score: {(day.score * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showUpgrade && <StripeModal onClose={() => setUpgrade(false)} />}
    </div>
  );
}`,
      },
    ],
    note: "💡 Antigravity tip: Preview the React app inline using the built-in Browser preview (View → Preview) — no need to open a separate tab.",
  },
  {
    id: 6,
    days: "Day 9",
    title: "Stripe SaaS Integration",
    subtitle: "Checkout, webhooks, usage gates",
    color: "#06D6A0",
    icon: "💳",
    tasks: [
      { id: "t6-1", text: "Stripe Dashboard: create product 'WardrobeAI Pro' at $4.99/mo, copy Price ID" },
      { id: "t6-2", text: "Create backend/routes/stripe_webhooks.py — checkout + webhook endpoints" },
      { id: "t6-3", text: "Install Stripe CLI locally (or use Antigravity's port-forwarding for webhooks)" },
      { id: "t6-4", text: "Test with card 4242 4242 4242 4242 → user.tier becomes 'pro'" },
      { id: "t6-5", text: "Test: cancel subscription → user.tier reverts to 'free'" },
      { id: "t6-6", text: "Add APScheduler job to reset outfits_this_week every Monday" },
    ],
    files: [
      {
        name: "routes/stripe_webhooks.py",
        lang: "python",
        path: "backend/routes/stripe_webhooks.py",
        code: `from flask import Blueprint, request, jsonify, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import users
from config import Config
from bson import ObjectId
import stripe

stripe.api_key = Config.STRIPE_SECRET_KEY
stripe_bp = Blueprint("stripe", __name__)

# ── Create Checkout Session ────────────────────────────────
@stripe_bp.route("/create-checkout", methods=["POST"])
@jwt_required()
def create_checkout():
    uid  = get_jwt_identity()
    user = users.find_one({"_id": ObjectId(uid)})

    # Create or reuse Stripe customer
    if not user.get("stripe_customer_id"):
        customer = stripe.Customer.create(email=user["email"],
                                          metadata={"user_id": uid})
        users.update_one({"_id": ObjectId(uid)}, {
            "$set": {"stripe_customer_id": customer.id}
        })
        customer_id = customer.id
    else:
        customer_id = user["stripe_customer_id"]

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": Config.STRIPE_PRICE_ID, "quantity": 1}],
        mode="subscription",
        success_url=f"{Config.FRONTEND_URL}/planner?upgraded=true",
        cancel_url=f"{Config.FRONTEND_URL}/profile?cancelled=true",
        metadata={"user_id": uid}
    )
    return jsonify({"url": session.url}), 200

# ── Stripe Webhooks ────────────────────────────────────────
@stripe_bp.route("/webhook", methods=["POST"])
def webhook():
    payload = request.get_data()
    sig     = request.headers.get("Stripe-Signature")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig, Config.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return jsonify({"error": "Invalid signature"}), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        uid = session["metadata"]["user_id"]
        users.update_one({"_id": ObjectId(uid)}, {"$set": {
            "tier": "pro",
            "stripe_subscription_id": session.get("subscription")
        }})

    elif event["type"] == "customer.subscription.deleted":
        sub_id = event["data"]["object"]["id"]
        users.update_one({"stripe_subscription_id": sub_id},
                         {"$set": {"tier": "free",
                                   "stripe_subscription_id": None}})

    elif event["type"] == "invoice.payment_failed":
        # Keep Pro for 3-day grace period — just log for now
        print(f"Payment failed: {event['data']['object']['customer']}")

    return jsonify({"received": True}), 200`,
      },
      {
        name: "Weekly reset scheduler (add to app.py)",
        lang: "python",
        path: "backend/app.py — add this block",
        code: `# Add to app.py after creating the Flask app

from apscheduler.schedulers.background import BackgroundScheduler
from models import users
from datetime import datetime

def reset_weekly_counters():
    """Reset outfit count every Monday at midnight UTC."""
    now = datetime.utcnow()
    if now.weekday() == 0:  # Monday
        result = users.update_many(
            {},
            {"$set": {"outfits_this_week": 0,
                       "week_reset_date": now}}
        )
        print(f"Reset {result.modified_count} users' weekly counters")

scheduler = BackgroundScheduler(timezone="UTC")
scheduler.add_job(reset_weekly_counters, "cron",
                  day_of_week="mon", hour=0, minute=5)
scheduler.start()`,
      },
    ],
    note: "💡 Antigravity tip: Use Antigravity's built-in port-forwarding (Network → Expose Port 5000) to get a public URL for Stripe webhook testing.",
  },
  {
    id: 7,
    days: "Days 10–12",
    title: "Deploy + Polish",
    subtitle: "Render, Vercel, CI/CD, README",
    color: "#FF9F1C",
    icon: "🚀",
    tasks: [
      { id: "t7-1", text: "Create Procfile: web: gunicorn app:app --workers 2 --timeout 120" },
      { id: "t7-2", text: "Create render.yaml with service config" },
      { id: "t7-3", text: "Create frontend/vercel.json with SPA rewrite rules" },
      { id: "t7-4", text: "Push to GitHub, connect Render to /backend folder" },
      { id: "t7-5", text: "Connect Vercel to /frontend folder, add env vars" },
      { id: "t7-6", text: "Update Google OAuth redirect URI to Render URL" },
      { id: "t7-7", text: "Update Stripe webhook endpoint to Render URL" },
      { id: "t7-8", text: "Run post-deploy test script, verify all 10 acceptance tests pass" },
    ],
    files: [
      {
        name: "render.yaml",
        lang: "yaml",
        path: "backend/render.yaml",
        code: `services:
  - type: web
    name: wardrobeai-api
    env: python
    region: singapore
    plan: starter         # $7/mo for always-on (free spins down)
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app --workers 2 --timeout 120 --bind 0.0.0.0:$PORT
    envVars:
      - key: PYTHON_VERSION
        value: "3.11.0"
      - key: MONGO_URI
        sync: false       # Set manually in Render dashboard
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: FLASK_ENV
        value: production`,
      },
      {
        name: "vercel.json",
        lang: "json",
        path: "frontend/vercel.json",
        code: `{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options",        "value": "DENY" }
      ]
    }
  ]
}`,
      },
      {
        name: "test_deploy.sh",
        lang: "bash",
        path: "test_deploy.sh",
        code: `#!/bin/bash
# Run after deploy to verify all critical paths work

API="https://your-app.onrender.com/api"
FRONTEND="https://your-app.vercel.app"
PASS=0; FAIL=0

check() {
  local desc=$1 status=$2 expected=$3
  if [ "$status" -eq "$expected" ]; then
    echo "✅ $desc ($status)"
    ((PASS++))
  else
    echo "❌ $desc (got $status, expected $expected)"
    ((FAIL++))
  fi
}

# 1. Health
check "API alive" $(curl -s -o /dev/null -w "%{http_code}" $API/../) 200

# 2. Register
RESP=$(curl -s -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test1234"}')
check "Register user" $(echo $RESP | python3 -c "import sys,json; d=json.load(sys.stdin); print(201 if 'access_token' in d else 400)") 201
TOKEN=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

# 3. Auth required
check "Protected route blocks unauth" \
  $(curl -s -o /dev/null -w "%{http_code}" $API/clothes) 401

# 4. Authenticated route
check "Authenticated GET /clothes" \
  $(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" $API/clothes) 200

echo ""
echo "Results: $PASS passed, $FAIL failed"`,
      },
    ],
    note: "💡 Antigravity tip: Use Antigravity's Git integration (Source Control panel) to push directly to GitHub without leaving the IDE.",
  },
];

const STACK_CHANGES = [
  { old: "TensorFlow/Keras (local training)", new: "Hugging Face Inference API (ResNet-50)", reason: "No GPU needed, free 30k req/month, instant setup" },
  { old: "Cloudflare R2 (complex S3 setup)", new: "Cloudinary (free 25GB, 1-line upload)", reason: "Dead simple Python SDK, auto image optimization" },
  { old: "TFLite model loaded per-request", new: "Stateless API call to Hugging Face", reason: "Zero model memory on Render free tier" },
  { old: "Fashion-MNIST (10 classes only)", new: "ResNet-50 (1000 ImageNet classes)", reason: "Far better accuracy on real clothing photos" },
  { old: "Docker Compose for local dev", new: "Antigravity runs both servers natively", reason: "No Docker needed — Antigravity handles concurrency" },
];

export default function App() {
  const [activePhase, setActivePhase] = useState(0);
  const [activeFile, setActiveFile]   = useState(0);
  const [checked, setChecked]         = useState({});
  const [tab, setTab]                 = useState("roadmap");

  const phase = PHASES[activePhase];
  const totalTasks = PHASES.reduce((s, p) => s + p.tasks.length, 0);
  const doneCount  = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((doneCount / totalTasks) * 100);

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));

  const phaseDone = (ph) =>
    ph.tasks.every(t => checked[t.id]);

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: "#0A0E1A", minHeight: "100vh", color: "#E8EDF5" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0F1420; }
        ::-webkit-scrollbar-thumb { background: #2A3555; border-radius: 2px; }
        .phase-btn:hover { transform: translateX(3px); }
        .task-row:hover { background: rgba(255,255,255,0.03); }
        .code-block { background: #060911; border: 1px solid #1A2240; border-radius: 8px; overflow-x: auto; }
        pre { margin: 0; font-size: 12px; line-height: 1.7; padding: 20px; }
        .tab-active { border-bottom: 2px solid; }
        .pulse-dot { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .file-tab:hover { background: rgba(255,255,255,0.06); }
        .file-tab-active { background: rgba(255,255,255,0.1) !important; }
        .glow { box-shadow: 0 0 20px rgba(0,255,178,0.15); }
      `}</style>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid #1A2240", padding: "0 24px", background: "#080C16" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00FFB2" }} className="pulse-dot" />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#00FFB2", letterSpacing: "-0.5px" }}>
              WARDROBEAI
            </span>
            <span style={{ color: "#3A4A6A", margin: "0 8px" }}>×</span>
            <span style={{ color: "#4A5A7A", fontSize: 12 }}>Antigravity Roadmap</span>
          </div>

          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 160, height: 4, background: "#1A2240", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #00FFB2, #4DFFFF)", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 12, color: "#4A5A7A" }}>{doneCount}/{totalTasks} tasks</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#00FFB2" }}>{pct}%</span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {["roadmap", "stack", "apis"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ background: "none", border: "none", color: tab === t ? "#E8EDF5" : "#4A5A7A", fontSize: 12, cursor: "pointer", padding: "0 16px", height: 56, fontFamily: "inherit", fontWeight: tab === t ? 600 : 400, borderBottom: tab === t ? "2px solid #00FFB2" : "2px solid transparent", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── ROADMAP TAB ── */}
      {tab === "roadmap" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "220px 1fr", gap: 0, height: "calc(100vh - 56px)" }}>

          {/* Phase Sidebar */}
          <aside style={{ borderRight: "1px solid #1A2240", padding: "20px 0", overflowY: "auto", background: "#080C16" }}>
            {PHASES.map((ph, i) => {
              const done = phaseDone(ph);
              const active = i === activePhase;
              const phDone = ph.tasks.filter(t => checked[t.id]).length;
              return (
                <button key={ph.id} onClick={() => { setActivePhase(i); setActiveFile(0); }}
                  className="phase-btn"
                  style={{ width: "100%", background: active ? `${ph.color}12` : "none", border: "none", borderLeft: active ? `3px solid ${ph.color}` : "3px solid transparent", cursor: "pointer", padding: "14px 16px", textAlign: "left", transition: "all 0.2s", display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{ph.icon}</span>
                    <span style={{ fontSize: 11, color: active ? ph.color : "#3A4A6A", fontWeight: 600, letterSpacing: "0.05em" }}>{ph.days}</span>
                    {done && <span style={{ marginLeft: "auto", fontSize: 10, color: "#00FFB2" }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 12, color: active ? "#E8EDF5" : "#5A6A8A", fontWeight: active ? 600 : 400, lineHeight: 1.3 }}>{ph.title}</div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 2, background: "#1A2240", borderRadius: 1 }}>
                      <div style={{ width: `${(phDone/ph.tasks.length)*100}%`, height: "100%", background: ph.color, borderRadius: 1, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#3A4A6A" }}>{phDone}/{ph.tasks.length}</span>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Main Content */}
          <main style={{ overflowY: "auto", padding: 28 }}>

            {/* Phase header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: `${phase.color}18`, border: `1px solid ${phase.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {phase.icon}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: phase.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{phase.days}</span>
                  <span style={{ fontSize: 10, color: "#2A3555", padding: "1px 8px", background: "#1A2240", borderRadius: 4 }}>Phase {activePhase + 1} of {PHASES.length}</span>
                </div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, margin: 0, color: "#E8EDF5", letterSpacing: "-0.5px" }}>{phase.title}</h1>
                <p style={{ color: "#5A6A8A", fontSize: 13, margin: "4px 0 0" }}>{phase.subtitle}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Tasks */}
              <div>
                <div style={{ fontSize: 11, color: "#4A5A7A", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Checklist</div>
                <div style={{ background: "#0D1120", border: "1px solid #1A2240", borderRadius: 10, overflow: "hidden" }}>
                  {phase.tasks.map((task, i) => (
                    <div key={task.id} className="task-row" onClick={() => toggle(task.id)}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderBottom: i < phase.tasks.length - 1 ? "1px solid #1A2240" : "none", cursor: "pointer", transition: "background 0.15s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked[task.id] ? phase.color : "#2A3555"}`, background: checked[task.id] ? `${phase.color}22` : "none", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                        {checked[task.id] && <span style={{ fontSize: 11, color: phase.color, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 12, color: checked[task.id] ? "#3A4A6A" : "#B0BDD0", lineHeight: 1.5, textDecoration: checked[task.id] ? "line-through" : "none" }}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Note */}
                {phase.note && (
                  <div style={{ marginTop: 14, background: "#0D1A10", border: "1px solid #0F3020", borderRadius: 8, padding: "12px 14px" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#5AAA7A", lineHeight: 1.6 }}>{phase.note}</p>
                  </div>
                )}
              </div>

              {/* Code Files */}
              <div>
                <div style={{ fontSize: 11, color: "#4A5A7A", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Code Files</div>
                <div style={{ background: "#0D1120", border: "1px solid #1A2240", borderRadius: 10, overflow: "hidden" }}>
                  {/* File tabs */}
                  <div style={{ display: "flex", borderBottom: "1px solid #1A2240", overflowX: "auto" }}>
                    {phase.files.map((f, i) => (
                      <button key={i} onClick={() => setActiveFile(i)} className={`file-tab ${i === activeFile ? "file-tab-active" : ""}`}
                        style={{ background: i === activeFile ? "rgba(255,255,255,0.08)" : "none", border: "none", borderRight: "1px solid #1A2240", color: i === activeFile ? "#E8EDF5" : "#4A5A7A", fontSize: 11, cursor: "pointer", padding: "10px 14px", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.15s", borderBottom: i === activeFile ? `2px solid ${phase.color}` : "2px solid transparent" }}>
                        {f.name}
                      </button>
                    ))}
                  </div>
                  {/* File path */}
                  <div style={{ padding: "8px 16px", borderBottom: "1px solid #1A2240", background: "#060911" }}>
                    <span style={{ fontSize: 11, color: "#3A4A6A" }}>📁 </span>
                    <span style={{ fontSize: 11, color: "#4A6A9A", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {phase.files[activeFile]?.path}
                    </span>
                  </div>
                  {/* Code */}
                  <div className="code-block" style={{ borderRadius: 0, border: "none", maxHeight: 420, overflowY: "auto" }}>
                    <pre style={{ color: "#A8C0E0" }}>
                      {phase.files[activeFile]?.code.split("\n").map((line, i) => {
                        // Simple syntax highlighting
                        let color = "#A8C0E0";
                        const trimmed = line.trim();
                        if (trimmed.startsWith("#") || trimmed.startsWith("//")) color = "#4A7A5A";
                        else if (/^(def |class |import |from |const |let |var |function |export |return|if |for |elif |else|async |await )/.test(trimmed)) color = "#7DAFFF";
                        else if (/^["'`]/.test(trimmed) || /"""/.test(trimmed)) color = "#B5A060";
                        else if (/"[^"]*"/.test(line) || /'[^']*'/.test(line)) color = "#B5A060";
                        return (
                          <span key={i} style={{ display: "block", color }}>
                            <span style={{ color: "#2A3555", userSelect: "none", marginRight: 16, fontSize: 10 }}>
                              {String(i + 1).padStart(3, " ")}
                            </span>
                            {line || " "}
                          </span>
                        );
                      })}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase nav */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button onClick={() => { setActivePhase(Math.max(0, activePhase - 1)); setActiveFile(0); }}
                disabled={activePhase === 0}
                style={{ background: "#0D1120", border: "1px solid #1A2240", color: activePhase === 0 ? "#2A3555" : "#E8EDF5", padding: "10px 20px", borderRadius: 8, cursor: activePhase === 0 ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "inherit" }}>
                ← Previous Phase
              </button>
              <button onClick={() => { setActivePhase(Math.min(PHASES.length - 1, activePhase + 1)); setActiveFile(0); }}
                disabled={activePhase === PHASES.length - 1}
                style={{ background: activePhase === PHASES.length - 1 ? "#0D1120" : phase.color, border: `1px solid ${phase.color}`, color: activePhase === PHASES.length - 1 ? "#2A3555" : "#000", padding: "10px 20px", borderRadius: 8, cursor: activePhase === PHASES.length - 1 ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                Next Phase →
              </button>
            </div>
          </main>
        </div>
      )}

      {/* ── STACK TAB ── */}
      {tab === "stack" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#E8EDF5", marginBottom: 8 }}>Optimized Stack</h2>
          <p style={{ color: "#5A6A8A", fontSize: 14, marginBottom: 32 }}>Changes made from the original plan to work seamlessly in Antigravity</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {STACK_CHANGES.map((s, i) => (
              <div key={i} style={{ background: "#0D1120", border: "1px solid #1A2240", borderRadius: 10, padding: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ background: "#1A0A0A", border: "1px solid #3A1A1A", borderRadius: 6, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: "#7A3A3A", marginBottom: 2, fontWeight: 600 }}>REMOVED</div>
                    <div style={{ fontSize: 12, color: "#C07070" }}>{s.old}</div>
                  </div>
                  <div style={{ color: "#00FFB2", fontSize: 16 }}>→</div>
                  <div style={{ background: "#0A1A0F", border: "1px solid #1A3A20", borderRadius: 6, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: "#3A7A4A", marginBottom: 2, fontWeight: 600 }}>NEW</div>
                    <div style={{ fontSize: 12, color: "#70C07A" }}>{s.new}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#5A6A8A", borderTop: "1px solid #1A2240", paddingTop: 10 }}>
                  💡 {s.reason}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 36 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#E8EDF5", marginBottom: 16 }}>Final Stack</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { layer: "Backend", items: ["Flask + Flask-JWT-Extended", "PyMongo (MongoDB Atlas)", "OpenCV + scikit-learn (KMeans)", "google-auth-oauthlib", "stripe", "cloudinary", "apscheduler"], color: "#4DFFFF" },
                { layer: "Frontend", items: ["React 18 + Vite", "TailwindCSS", "Axios (auto JWT refresh)", "react-dropzone", "react-router-dom", "@stripe/stripe-js", "lucide-react"], color: "#C77DFF" },
                { layer: "AI / ML", items: ["Hugging Face Inference API", "ResNet-50 (1000-class ImageNet)", "OpenCV image preprocessing", "KMeans color clustering", "Rule-based occasion tagger", "HSV color contrast scorer"], color: "#FF6B6B" },
                { layer: "Infrastructure", items: ["MongoDB Atlas (free M0)", "Cloudinary (free 25GB)", "Render (backend)", "Vercel (frontend)", "Stripe (payments)", "Google Calendar API v3"], color: "#06D6A0" },
              ].map(({ layer, items, color }) => (
                <div key={layer} style={{ background: "#0D1120", border: `1px solid ${color}30`, borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{layer}</div>
                  {items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #1A2240" }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#8A9AB8" }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── APIS TAB ── */}
      {tab === "apis" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#E8EDF5", marginBottom: 8 }}>API Keys & Services</h2>
          <p style={{ color: "#5A6A8A", fontSize: 14, marginBottom: 32 }}>Every external service you need, how to get it, and where to put it</p>

          {[
            {
              service: "MongoDB Atlas", color: "#00ED64", free: "Free forever (M0, 512MB)",
              steps: ["Go to mongodb.com/atlas → Sign up", "Create free M0 cluster (AWS Singapore)", "Database Access → Add user (username + password)", "Network Access → Allow 0.0.0.0/0 for dev", "Connect → Drivers → copy connection string", "Replace <password> with your DB password"],
              var: "MONGO_URI"
            },
            {
              service: "Hugging Face (AI Model)", color: "#FFD21E", free: "Free 30k req/month",
              steps: ["huggingface.co → Sign up → Settings → Access Tokens", "New Token → Role: Read → Copy token", "Model used: microsoft/resnet-50 (auto-downloaded)", "No GPU required — inference runs on HF servers"],
              var: "HF_API_TOKEN"
            },
            {
              service: "Cloudinary (Images)", color: "#3448C5", free: "Free 25GB storage + 25GB bandwidth",
              steps: ["cloudinary.com → Sign up", "Dashboard → copy Cloud Name, API Key, API Secret", "Settings → Upload → Enable unsigned uploads (optional)"],
              var: "CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET"
            },
            {
              service: "Google Calendar API", color: "#4285F4", free: "Free (Calendar is free)",
              steps: ["console.cloud.google.com → New Project", "APIs & Services → Enable 'Google Calendar API'", "OAuth consent screen → External → fill form", "Credentials → Create OAuth 2.0 Client ID → Web App", "Add redirect URI: http://localhost:5000/api/calendar/callback", "Download JSON → copy client_id and client_secret"],
              var: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET"
            },
            {
              service: "Stripe (Payments)", color: "#635BFF", free: "Free to dev, 2.9% + 30¢ per transaction",
              steps: ["dashboard.stripe.com → Sign up", "Developers → API Keys → copy Secret + Publishable keys", "Products → Create product 'WardrobeAI Pro' → $4.99/mo → copy Price ID", "Webhooks → Add endpoint → URL: https://your.render.com/api/stripe/webhook", "Select events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed", "Copy Webhook Signing Secret"],
              var: "STRIPE_SECRET_KEY / WEBHOOK_SECRET / PRICE_ID"
            },
          ].map(({ service, color, free, steps, var: v }) => (
            <div key={service} style={{ background: "#0D1120", border: `1px solid ${color}25`, borderRadius: 10, padding: 22, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#E8EDF5" }}>{service}</span>
                </div>
                <span style={{ fontSize: 11, color: "#3A7A4A", background: "#0A1A0F", border: "1px solid #1A3A20", padding: "3px 10px", borderRadius: 4 }}>{free}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
                <div>
                  {steps.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: "1px solid #1A2240" }}>
                      <span style={{ fontSize: 11, color: color, fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: 12, color: "#8A9AB8", lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#060911", border: "1px solid #1A2240", borderRadius: 6, padding: "10px 14px", minWidth: 200 }}>
                  <div style={{ fontSize: 10, color: "#4A5A7A", marginBottom: 4, fontWeight: 600 }}>ENV VAR</div>
                  <code style={{ fontSize: 11, color: color, fontFamily: "'IBM Plex Mono', monospace" }}>{v}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
