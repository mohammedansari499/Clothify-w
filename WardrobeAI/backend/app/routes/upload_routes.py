from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import os
from werkzeug.utils import secure_filename

upload = Blueprint("upload", __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@upload.route("/", methods=["POST"])
@jwt_required()
def upload_image():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No filename"}), 400

    filename = secure_filename(file.filename)

    upload_path = os.path.join(UPLOAD_FOLDER, filename)

    file.save(upload_path)

    return jsonify({
        "message": "File uploaded successfully",
        "image_url": f"http://127.0.0.1:5000/uploads/{filename}"
    })
