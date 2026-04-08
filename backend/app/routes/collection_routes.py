import datetime

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.config.db import collections_collection

collections = Blueprint("collections", __name__)


def _serialize_doc(doc):
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc


def _object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


@collections.route("/", methods=["GET"])
@jwt_required()
def get_collections():
    user_id = get_jwt_identity()
    user_collections = list(collections_collection.find({"user_id": user_id}))
    return jsonify([_serialize_doc(c) for c in user_collections]), 200


@collections.route("/", methods=["POST"])
@jwt_required()
def create_collection():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Collection name is required"}), 400

    new_collection = {
        "user_id": user_id,
        "name": name,
        "outfits": [],
        "created_at": datetime.datetime.utcnow(),
    }
    result = collections_collection.insert_one(new_collection)
    return jsonify({"message": "Collection created", "id": str(result.inserted_id)}), 201


@collections.route("/<collection_id>/add", methods=["POST"])
@jwt_required()
def add_to_collection(collection_id):
    user_id = get_jwt_identity()
    object_id = _object_id(collection_id)
    if not object_id:
        return jsonify({"error": "Invalid collection id"}), 400

    data = request.get_json(silent=True) or {}
    if "outfit" not in data:
        return jsonify({"error": "Outfit data is required"}), 400

    collection = collections_collection.find_one({"_id": object_id, "user_id": user_id})
    if not collection:
        return jsonify({"error": "Collection not found"}), 404

    collections_collection.update_one(
        {"_id": object_id},
        {"$push": {"outfits": {"items": data["outfit"], "saved_at": datetime.datetime.utcnow()}}},
    )
    return jsonify({"message": "Outfit added to collection"}), 200


@collections.route("/<collection_id>", methods=["DELETE"])
@jwt_required()
def delete_collection(collection_id):
    user_id = get_jwt_identity()
    object_id = _object_id(collection_id)
    if not object_id:
        return jsonify({"error": "Invalid collection id"}), 400

    result = collections_collection.delete_one({"_id": object_id, "user_id": user_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Collection not found"}), 404
    return jsonify({"message": "Collection deleted"}), 200


@collections.route("/<collection_id>/outfit/<int:outfit_index>", methods=["DELETE"])
@jwt_required()
def remove_outfit(collection_id, outfit_index):
    user_id = get_jwt_identity()
    object_id = _object_id(collection_id)
    if not object_id:
        return jsonify({"error": "Invalid collection id"}), 400

    collection = collections_collection.find_one({"_id": object_id, "user_id": user_id})
    if not collection:
        return jsonify({"error": "Collection not found"}), 404

    outfits = collection.get("outfits", [])
    if outfit_index < 0 or outfit_index >= len(outfits):
        return jsonify({"error": "Outfit index out of range"}), 400

    collections_collection.update_one({"_id": object_id}, {"$unset": {f"outfits.{outfit_index}": 1}})
    collections_collection.update_one({"_id": object_id}, {"$pull": {"outfits": None}})
    return jsonify({"message": "Outfit removed from collection"}), 200
