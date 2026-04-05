from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

import app.config.db as db
from app.services.outfit_service import generate_outfits

outfits = Blueprint("outfits", __name__)


@outfits.route("/plan", methods=["GET"])
@jwt_required()
def generate_plan():

    user_id = get_jwt_identity()

    clothes = list(db.clothes_collection.find({"user_id": user_id}))

    return jsonify(generate_outfits(clothes))


@outfits.route("/plan/save", methods=["POST"])
@jwt_required()
def save_plan():
    user_id = get_jwt_identity()
    data = request.json
    plan = data.get("plan")

    if not plan:
        return jsonify({"error": "Plan data is required"}), 400

    # Save the plan, overwriting any existing saved plan for this user
    db.outfit_plans_collection.update_one(
        {"user_id": user_id},
        {"$set": {"plan": plan}},
        upsert=True
    )

    return jsonify({"message": "Plan saved successfully"})


@outfits.route("/plan/saved", methods=["GET"])
@jwt_required()
def get_saved_plan():
    user_id = get_jwt_identity()

    saved_plan = db.outfit_plans_collection.find_one({"user_id": user_id})

    if not saved_plan or "plan" not in saved_plan:
        return jsonify({"plan": None})

    # Return the saved plan
    return jsonify({"plan": saved_plan["plan"]})
