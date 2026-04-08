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

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    existing_user = db.users_collection.find_one({"email": email})
    if existing_user:
        return jsonify({"error": "User already exists"}), 400

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    db.users_collection.insert_one({"email": email, "password": password_hash})
    return jsonify({"message": "User registered successfully"}), 201


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
        if not email:
            return jsonify({"error": "No email provided by Google"}), 400

        user = db.users_collection.find_one({"email": email})
        if not user:
            db_res = db.users_collection.insert_one({"email": email, "auth_provider": "google"})
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


@auth.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    try:
        object_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid user token"}), 401

    user = db.users_collection.find_one({"_id": object_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"email": user["email"]})
