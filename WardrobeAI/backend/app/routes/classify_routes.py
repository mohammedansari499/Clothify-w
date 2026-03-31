from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.classifier_service import analyze_clothing
import app.config.db as db
import os
from datetime import datetime

classify = Blueprint("classify", __name__)


@classify.route("/", methods=["POST"])
@jwt_required()
def classify_image():

    current_user_id = get_jwt_identity()
    data = request.json

    image_url = data.get("image_url")
    
    # Parse filename from URL to get local path for OpenCV
    filename = image_url.split("/")[-1]
    local_path = os.path.join("uploads", filename)

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
        "created_at": datetime.utcnow()
    }
    
    insert_res = db.clothes_collection.insert_one(clothing_item)
    clothing_item["_id"] = str(insert_res.inserted_id)
    clothing_item["created_at"] = clothing_item["created_at"].isoformat()

    return jsonify({
        "message": "Item classified and saved successfully",
        "item": clothing_item
    }), 201
