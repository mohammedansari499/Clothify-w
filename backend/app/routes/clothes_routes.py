from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

import app.config.db as db

clothes = Blueprint("clothes", __name__)


def _object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


@clothes.route("/", methods=["POST"])
@jwt_required()
def add_clothing():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    image_url = data.get("image_url")
    clothing_type = data.get("type")
    colors = data.get("colors")
    occasion_tags = data.get("occasion_tags")

    if not image_url or not clothing_type:
        return jsonify({"error": "Missing required fields"}), 400

    thresholds = {
        "top": 3,
        "bottom": 5,
        "outerwear": 10,
        "shoe": 20,
        "accessory": 30,
    }

    category = "accessory"
    for cat in thresholds:
        if cat in clothing_type.lower():
            category = cat
            break

    clothing_item = {
        "user_id": user_id,
        "image_url": image_url,
        "type": clothing_type,
        "colors": colors,
        "occasion_tags": occasion_tags,
        "wear_count": 0,
        "last_worn": None,
        "laundry_threshold": thresholds.get(category, 5),
        "created_at": datetime.utcnow(),
    }

    result = db.clothes_collection.insert_one(clothing_item)
    return jsonify({"message": "Clothing item added", "id": str(result.inserted_id)})


@clothes.route("/", methods=["GET"])
@jwt_required()
def get_clothes():
    user_id = get_jwt_identity()
    items = db.clothes_collection.find({"user_id": user_id})

    clothes_list = []
    for item in items:
        item["_id"] = str(item["_id"])
        clothes_list.append(item)
    return jsonify(clothes_list)


@clothes.route("/<item_id>", methods=["DELETE"])
@jwt_required()
def delete_clothing(item_id):
    user_id = get_jwt_identity()
    object_id = _object_id(item_id)
    if not object_id:
        return jsonify({"error": "Invalid item id"}), 400

    result = db.clothes_collection.delete_one({"_id": object_id, "user_id": user_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Item not found"}), 404
    return jsonify({"message": "Item deleted"})


@clothes.route("/<item_id>/wear", methods=["PATCH"])
@jwt_required()
def mark_worn(item_id):
    user_id = get_jwt_identity()
    object_id = _object_id(item_id)
    if not object_id:
        return jsonify({"error": "Invalid item id"}), 400

    result = db.clothes_collection.update_one(
        {"_id": object_id, "user_id": user_id},
        {"$inc": {"wear_count": 1}, "$set": {"last_worn": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        return jsonify({"error": "Item not found"}), 404
    return jsonify({"message": "Wear count updated"})


@clothes.route("/<item_id>/reset-wear", methods=["PATCH"])
@jwt_required()
def reset_worn(item_id):
    user_id = get_jwt_identity()
    object_id = _object_id(item_id)
    if not object_id:
        return jsonify({"error": "Invalid item id"}), 400

    result = db.clothes_collection.update_one(
        {"_id": object_id, "user_id": user_id},
        {"$set": {"wear_count": 0, "last_worn": None}},
    )
    if result.matched_count == 0:
        return jsonify({"error": "Item not found"}), 404
    return jsonify({"message": "Wear count reset"})
