import os
from datetime import datetime
from urllib.parse import urlparse

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

import app.config.db as db
from app.services.classifier_service import analyze_clothing

classify = Blueprint("classify", __name__)


def _resolve_local_upload_path(image_url):
    if not image_url:
        return None, "image_url is required"

    parsed = urlparse(image_url)
    path = parsed.path or ""
    if "/uploads/" not in path:
        return None, "Only uploaded images are allowed"

    filename = os.path.basename(path)
    if not filename:
        return None, "Invalid image URL"

    upload_root = os.path.abspath(current_app.config.get("UPLOAD_FOLDER", "uploads"))
    local_path = os.path.abspath(os.path.join(upload_root, filename))
    if not local_path.startswith(f"{upload_root}{os.sep}") and local_path != upload_root:
        return None, "Invalid image path"
    if current_app.config.get("TESTING"):
        return local_path, None
    if not os.path.exists(local_path):
        return None, "Image file not found"
    return local_path, None


@classify.route("/", methods=["POST"])
@jwt_required()
def classify_image():
    current_user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    image_url = data.get("image_url")

    local_path, error = _resolve_local_upload_path(image_url)
    if error:
        return jsonify({"error": error}), 400

    result = analyze_clothing(local_path)
    clothing_item = {
        "user_id": current_user_id,
        "image_url": image_url,
        "type": result["type"],
        "style": result.get("style", "casual"),
        "colors": result["colors"],
        "primary_color": result["primary_color"],
        "color_name": result.get("color_name", "Unknown"),
        "occasion_tags": result["occasion_tags"],
        "wear_count": 0,
        "last_worn": None,
        "in_laundry": False,
        "created_at": datetime.utcnow(),
    }

    insert_res = db.clothes_collection.insert_one(clothing_item)
    clothing_item["_id"] = str(insert_res.inserted_id)
    clothing_item["created_at"] = clothing_item["created_at"].isoformat()

    return (
        jsonify(
            {
                "message": "Item classified and saved successfully",
                "item": clothing_item,
            }
        ),
        201,
    )
