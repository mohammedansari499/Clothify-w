from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os

# Load environment variables FIRST before any other imports
load_dotenv()

# Import routes (after dotenv so env vars are available)
from app.routes.auth_routes import auth
from app.routes.clothes_routes import clothes
from app.routes.upload_routes import upload
from app.routes.classify_routes import classify
from app.routes.outfit_routes import outfits
from app.routes.calendar_routes import calendar

# Create Flask application
app = Flask(__name__)

# Enable CORS for all origins and methods
CORS(app, resources={r"/api/*": {"origins": "*"}})

# App configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth, url_prefix="/api/auth")
app.register_blueprint(clothes, url_prefix="/api/clothes")
app.register_blueprint(upload, url_prefix="/api/upload")
app.register_blueprint(classify, url_prefix="/api/classify")
app.register_blueprint(outfits, url_prefix="/api/outfits")
app.register_blueprint(calendar, url_prefix="/api/calendar")


# Root test route
@app.route("/")
def home():
    return {"message": "WardrobeAI backend running successfully"}

# Serve uploaded images
@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# Run server
if __name__ == "__main__":
    app.run(debug=True)
