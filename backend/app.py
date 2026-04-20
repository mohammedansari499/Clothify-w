import os
import threading
from datetime import timedelta

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from app.ai.classifier import preload_models
from app.routes.auth_routes import auth
from app.routes.calendar_routes import calendar
from app.routes.classify_routes import classify
from app.routes.clothes_routes import clothes
from app.routes.collection_routes import collections
from app.routes.outfit_routes import outfits
from app.routes.upload_routes import upload
from app.routes.weather_routes import weather_bp
from app.config.db import check_db_connection

app = Flask(__name__)

frontend_origins = [origin.strip() for origin in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",") if origin.strip()]
CORS(app, resources={r"/api/*": {"origins": frontend_origins}})

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY") or "dev-secret-key"
app.config["UPLOAD_FOLDER"] = os.path.abspath(os.getenv("UPLOAD_FOLDER", "uploads"))
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET") or "dev-jwt-secret"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
app.config["FRONTEND_URL"] = frontend_origins[0] if frontend_origins else ""

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

jwt = JWTManager(app)

app.register_blueprint(auth, url_prefix="/api/auth")
app.register_blueprint(clothes, url_prefix="/api/clothes")
app.register_blueprint(upload, url_prefix="/api/upload")
app.register_blueprint(classify, url_prefix="/api/classify")
app.register_blueprint(outfits, url_prefix="/api/outfits")
app.register_blueprint(calendar, url_prefix="/api/calendar")
app.register_blueprint(weather_bp, url_prefix="/api/weather")
app.register_blueprint(collections, url_prefix="/api/collections")


@app.route("/")
def home():
    return {"message": "WardrobeAI backend running successfully"}


@app.route("/api/health")
def health():
    db_status = check_db_connection()
    return {
        "status": "online",
        "database": "connected" if db_status else "disconnected"
    }, 200 if db_status else 503


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


if __name__ == "__main__":
    print("Checking database connection...")
    if check_db_connection():
        print("Database connected successfully.")
    else:
        print("WARNING: Database connection failed. Some features may not work.")
    
    threading.Thread(target=preload_models, daemon=True).start()
    debug = os.getenv("FLASK_DEBUG", "false").lower() in {"1", "true", "yes"}
    app.run(debug=debug)
