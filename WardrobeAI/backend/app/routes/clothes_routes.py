from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from app.config.db import clothes_collection

clothes = Blueprint("clothes", __name__)


@clothes.route("/", methods=["POST"])
@jwt_required()
def add_clothing():

    user_id = get_jwt_identity()

    data = request.json

    image_url = data.get("image_url")
    clothing_type = data.get("type")
    colors = data.get("colors")
    occasion_tags = data.get("occasion_tags")

    if not image_url or not clothing_type:
        return jsonify({"error": "Missing required fields"}), 400

    clothing_item = {
        "user_id": user_id,
        "image_url": image_url,
        "type": clothing_type,
        "colors": colors,
        "occasion_tags": occasion_tags,
        "created_at": datetime.utcnow()
    }

    result = clothes_collection.insert_one(clothing_item)

    return jsonify({
        "message": "Clothing item added",
        "id": str(result.inserted_id)
    })


@clothes.route("/", methods=["GET"])
@jwt_required()
def get_clothes():

    user_id = get_jwt_identity()

    items = clothes_collection.find({"user_id": user_id})

    clothes_list = []

    for item in items:
        item["_id"] = str(item["_id"])
        clothes_list.append(item)

    return jsonify(clothes_list)


@clothes.route("/<id>", methods=["DELETE"])
@jwt_required()
def delete_clothing(id):

    user_id = get_jwt_identity()

    result = clothes_collection.delete_one({
        "_id": ObjectId(id),
        "user_id": user_id
    })

    if result.deleted_count == 0:
        return jsonify({"error": "Item not found"}), 404

    return jsonify({"message": "Item deleted"})
