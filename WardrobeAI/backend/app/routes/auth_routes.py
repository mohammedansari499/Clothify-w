from flask import Blueprint, request, jsonify
import app.config.db as db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from bson import ObjectId
import bcrypt
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

auth = Blueprint("auth", __name__)


@auth.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    existing_user = db.users_collection.find_one({"email": email})

    if existing_user:
        return jsonify({"error": "User already exists"}), 400

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    db.users_collection.insert_one({
        "email": email,
        "password": password_hash
    })

    return jsonify({"message": "User registered successfully"}), 201


@auth.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = db.users_collection.find_one({"email": email})

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode(), user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user["_id"]))

    return jsonify({
        "message": "Login successful",
        "token": token
    })


@auth.route("/google", methods=["POST"])
def google_autologin():
    data = request.get_json()
    token = data.get("token")
    if not token:
        return jsonify({"error": "Google token is required"}), 400

    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            os.getenv("GOOGLE_CLIENT_ID")
        )
        email = idinfo.get("email")
        if not email:
            return jsonify({"error": "No email provided by Google"}), 400

        user = db.users_collection.find_one({"email": email})
        
        if not user:
            db_res = db.users_collection.insert_one({"email": email, "auth_provider": "google"})
            user_id = str(db_res.inserted_id)
        else:
            user_id = str(user["_id"])

        access_token = create_access_token(identity=user_id)

        return jsonify({
            "message": "Google Login successful",
            "token": access_token
        }), 200

    except ValueError:
        return jsonify({"error": "Invalid Google Token"}), 401


@auth.route("/profile", methods=["GET"])
@jwt_required()
def profile():

    user_id = get_jwt_identity()

    user = db.users_collection.find_one({"_id": ObjectId(user_id)})

    return jsonify({
        "email": user["email"]
    })
