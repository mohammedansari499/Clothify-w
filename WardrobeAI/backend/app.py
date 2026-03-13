from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os

# Import routes
from app.routes.auth_routes import auth
from app.routes.clothes_routes import clothes
from app.routes.upload_routes import upload
from app.routes.classify_routes import classify

# Load environment variables
load_dotenv()

# Create Flask application
app = Flask(__name__)

# Enable CORS
CORS(app)

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


# Root test route
@app.route("/")
def home():
    return {"message": "WardrobeAI backend running successfully"}


# Run server
if __name__ == "__main__":
    app.run(debug=True)
