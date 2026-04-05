from datetime import datetime
from app.config.db import users_collection


def create_user(email, password_hash):
    """
    Creates a user document structure
    """
    return {
        "email": email,
        "password": password_hash,
        "created_at": datetime.utcnow(),
        "subscription": "free",
        "calendar_connected": False
    }


def insert_user(user_data):
    """
    Inserts user into MongoDB
    """
    return users_collection.insert_one(user_data)


def find_user_by_email(email):
    """
    Finds a user by email
    """
    return users_collection.find_one({"email": email})


def find_user_by_id(user_id):
    """
    Finds user by MongoDB _id
    """
    from bson import ObjectId
    return users_collection.find_one({"_id": ObjectId(user_id)})
