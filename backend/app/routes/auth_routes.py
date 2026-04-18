import os

import bcrypt
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

import app.config.db as db

auth = Blueprint("auth", __name__)


def _payload():
    return request.get_json(silent=True) or {}


@auth.route("/register", methods=["POST"])
def register():
    data = _payload()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    
    # New fields
    name = data.get("name")
    display_name = data.get("displayName")
    username = data.get("username")
    phone = data.get("phone")
    occupation = data.get("occupation")
    location = data.get("location", {}) # {city, state, country}
    style_preference = data.get("stylePreference", [])

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    existing_user = db.users_collection.find_one({"email": email})
    if existing_user:
        return jsonify({"error": "User already exists"}), 400
        
    if username:
        existing_username = db.users_collection.find_one({"username": username})
        if existing_username:
            return jsonify({"error": "Username already taken"}), 400

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    
    # Normalize names
    if name and not display_name:
        display_name = name
    elif display_name and not name:
        name = display_name
    
    user_doc = {
        "email": email, 
        "password": password_hash,
        "name": name,
        "displayName": display_name,
        "username": username,
        "phone": phone,
        "occupation": occupation,
        "location": location,
        "stylePreference": style_preference
    }
    
    result = db.users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_access_token(identity=user_id)

    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user_id": user_id,
        "user": {
            "email": email,
            "name": name,
            "displayName": display_name,
            "username": username
        }
    }), 201

# ... (/login remains mostly the same, but let's update return payload if needed) ...

@auth.route("/login", methods=["POST"])
def login():
    data = _payload()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = db.users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    stored_password = user.get("password")
    if not stored_password:
        return jsonify({"error": "This account uses Google login"}), 401

    if isinstance(stored_password, str):
        stored_password = stored_password.encode("utf-8")

    if not bcrypt.checkpw(password.encode("utf-8"), stored_password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user["_id"]))
    return jsonify(
        {
            "message": "Login successful",
            "token": token,
            "user_id": str(user["_id"]),
            "user": {
                "email": user.get("email"),
                "name": user.get("name"),
                "displayName": user.get("displayName"),
                "username": user.get("username"),
            }
        }
    )


@auth.route("/google", methods=["POST"])
def google_autologin():
    data = _payload()
    token = data.get("token")
    if not token:
        return jsonify({"error": "Google token is required"}), 400

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            os.getenv("GOOGLE_CLIENT_ID"),
        )

        email = (idinfo.get("email") or "").strip().lower()
        name = idinfo.get("name")
        picture = idinfo.get("picture")

        if not email:
            return jsonify({"error": "No email provided by Google"}), 400

        user = db.users_collection.find_one({"email": email})
        if not user:
            user_doc = {
                "email": email, 
                "name": name,
                "displayName": name,
                "picture": picture,
                "auth_provider": "google"
            }
            db_res = db.users_collection.insert_one(user_doc)
            user_id = str(db_res.inserted_id)
        else:
            user_id = str(user["_id"])

        access_token = create_access_token(identity=user_id)
        return jsonify(
            {
                "message": "Google login successful",
                "token": access_token,
                "user_id": user_id,
            }
        ), 200
    except ValueError:
        return jsonify({"error": "Invalid Google token"}), 401


@auth.route("/profile", methods=["GET", "PUT"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    try:
        object_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid user token"}), 401

    if request.method == "GET":
        user = db.users_collection.find_one({"_id": object_id})
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Return comprehensive profile
        return jsonify({
            "email": user.get("email"),
            "name": user.get("name"),
            "displayName": user.get("displayName"),
            "username": user.get("username"),
            "bio": user.get("bio", ""),
            "phone": user.get("phone"),
            "occupation": user.get("occupation"),
            "location": user.get("location", {}),
            "stylePreference": user.get("stylePreference", []),
            "picture": user.get("picture")
        })

    if request.method == "PUT":
        data = _payload()
        updatable_fields = [
            "name", "displayName", "username", "bio", "phone", 
            "occupation", "location", "stylePreference"
        ]
        
        update_doc = {}
        for field in updatable_fields:
            if field in data:
                update_doc[field] = data[field]
        
        if "username" in update_doc:
            existing = db.users_collection.find_one({
                "username": update_doc["username"],
                "_id": {"$ne": object_id}
            })
            if existing:
                return jsonify({"error": "Username already taken"}), 400

        if not update_doc:
            return jsonify({"message": "No changes provided"}), 200

        db.users_collection.update_one({"_id": object_id}, {"$set": update_doc})
        updated_user = db.users_collection.find_one({"_id": object_id})
        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "email": updated_user.get("email"),
                "name": updated_user.get("name"),
                "displayName": updated_user.get("displayName"),
                "username": updated_user.get("username"),
                "bio": updated_user.get("bio", ""),
                "phone": updated_user.get("phone"),
                "occupation": updated_user.get("occupation"),
                "location": updated_user.get("location", {}),
                "stylePreference": updated_user.get("stylePreference", []),
                "picture": updated_user.get("picture")
            }
        })
