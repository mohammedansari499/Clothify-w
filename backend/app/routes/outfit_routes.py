from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

import app.config.db as db
from app.services.outfit_service import (
    generate_outfits, 
    generate_single_day_outfit,
    confirm_worn_outfit
)
from app.services.weather_service import get_weather

outfits = Blueprint("outfits", __name__)


@outfits.route("/plan", methods=["GET", "POST"])
@jwt_required()
def generate_plan():
    user_id = get_jwt_identity()
    
    # Get city and occasions from JSON body (POST) or query params (GET)
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        city = data.get("city")
        daily_occasions = data.get("occasions")
    else:
        city = request.args.get("city")
        daily_occasions = None

    # Optional weather context
    weather_data = get_weather(city) if city else None
    
    # Get user's clothes
    clothes = list(db.clothes_collection.find({"user_id": user_id}))

    plan = generate_outfits(clothes, weather_data, daily_occasions)

    if request.method == "GET":
        return jsonify(plan)

    return jsonify({"plan": plan, "weather_context": weather_data})


@outfits.route("/plan/save", methods=["POST"])
@jwt_required()
def save_plan():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    plan = data.get("plan")
    city = data.get("city")
    occasions = data.get("occasions")

    if not plan:
        return jsonify({"error": "Plan data is required"}), 400

    # Save the plan along with context
    db.outfit_plans_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "plan": plan,
            "city": city,
            "occasions": occasions
        }},
        upsert=True
    )

    return jsonify({"message": "Plan saved successfully"})


@outfits.route("/plan/saved", methods=["GET"])
@jwt_required()
def get_saved_plan():
    user_id = get_jwt_identity()

    saved_doc = db.outfit_plans_collection.find_one({"user_id": user_id})

    if not saved_doc or "plan" not in saved_doc:
        return jsonify({"plan": None})

    return jsonify({
        "plan": saved_doc["plan"],
        "city": saved_doc.get("city"),
        "occasions": saved_doc.get("occasions")
    })

@outfits.route("/wear", methods=["POST"])
@jwt_required()
def record_worn_outfit():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    outfit = data.get("outfit")

    if not outfit:
        return jsonify({"error": "Outfit data is required"}), 400

    # Extract item IDs from the outfit dictionary
    item_ids = []
    slots = ["top", "bottom", "shoes", "outerwear", "accessories"]
    
    for slot in slots:
        item_data = outfit.get(slot)
        if not item_data:
            continue
            
        if isinstance(item_data, list):
            for item in item_data:
                if isinstance(item, dict) and "_id" in item:
                    item_ids.append(str(item["_id"]))
                elif isinstance(item, str):
                    item_ids.append(item)
        elif isinstance(item_data, dict) and "_id" in item_data:
            item_ids.append(str(item_data["_id"]))
        elif isinstance(item_data, str):
            item_ids.append(item_data)
    
    if not item_ids:
        # Check if the outfit is just a list of items
        if isinstance(outfit, list):
            item_ids = [str(item["_id"]) for item in outfit if isinstance(item, dict) and "_id" in item]
    
    if not item_ids:
        return jsonify({"error": "No valid items found in outfit"}), 400

    result = confirm_worn_outfit(user_id, item_ids)
    
    if "error" in result:
        return jsonify(result), 400
        
    return jsonify(result)

@outfits.route("/plan/day", methods=["POST"])
@jwt_required()
def generate_single_day():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    
    # Accept both 'day' and 'day_index' for flexibility
    day = data.get("day") or data.get("day_index")
    occasion = data.get("occasion")
    exclude_ids = data.get("exclude_ids", [])
    city = data.get("city")
    weather_data = data.get("weather_data")

    if day is None:
        return jsonify({"error": "Day identifier is required"}), 400

    # If weather_data wasn't passed directly, try to fetch it via city
    if not weather_data and city:
        weather_data = get_weather(city)
    
    # Get user's clothes
    clothes = list(db.clothes_collection.find({"user_id": user_id}))

    new_outfit = generate_single_day_outfit(clothes, day, occasion, exclude_ids, weather_data)

    if not new_outfit:
        return jsonify({"error": "Could not generate outfit. Ensure your wardrobe has enough items."}), 404

    return jsonify({"day_plan": new_outfit})
