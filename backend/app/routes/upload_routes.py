import os
from uuid import uuid4

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

upload = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "avif", "heic", "heif"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@upload.route("/", methods=["POST"])
@jwt_required()
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No filename"}), 400

    if not _allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
    os.makedirs(upload_folder, exist_ok=True)

    base_name = secure_filename(file.filename)
    _, ext = os.path.splitext(base_name)
    unique_name = f"{uuid4().hex}_{base_name}" if base_name else f"{uuid4().hex}{ext.lower()}"
    upload_path = os.path.join(upload_folder, unique_name)

    file.save(upload_path)

    base_url = request.host_url.rstrip("/")
    return jsonify(
        {
            "message": "File uploaded successfully",
            "image_url": f"{base_url}/uploads/{unique_name}",
            "filename": unique_name,
        }
    )
