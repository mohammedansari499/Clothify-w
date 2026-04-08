import os
from datetime import datetime
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from pymongo import MongoClient

env_path = Path("backend") / ".env"
load_dotenv(dotenv_path=env_path)

mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    raise RuntimeError("MONGO_URI not found in backend/.env")

client = MongoClient(mongo_uri)
db = client["wardrobeai"]
users_collection = db["users"]
clothes_collection = db["clothes"]
collections_collection = db["collections"]

email = "test_collections@example.com"
password = "password123"

user = users_collection.find_one({"email": email})
if not user:
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    res = users_collection.insert_one({"email": email, "password": password_hash})
    user_id = str(res.inserted_id)
    print(f"Created user: {email}")
else:
    user_id = str(user["_id"])
    print(f"User already exists: {email}")

clothes_collection.delete_many({"user_id": user_id})
collections_collection.delete_many({"user_id": user_id})

items = [
    {
        "user_id": user_id,
        "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=200",
        "type": "tshirt",
        "style": "casual",
        "colors": [[245, 245, 245], [210, 210, 210]],
        "primary_color": [245, 245, 245],
        "color_name": "White",
        "occasion_tags": ["casual", "everyday"],
        "wear_count": 0,
        "last_worn": None,
        "in_laundry": False,
        "created_at": datetime.utcnow(),
    },
    {
        "user_id": user_id,
        "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=200",
        "type": "jeans",
        "style": "casual",
        "colors": [[50, 90, 150], [30, 60, 100]],
        "primary_color": [50, 90, 150],
        "color_name": "Blue",
        "occasion_tags": ["casual", "everyday"],
        "wear_count": 0,
        "last_worn": None,
        "in_laundry": False,
        "created_at": datetime.utcnow(),
    },
    {
        "user_id": user_id,
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200",
        "type": "sneakers",
        "style": "casual",
        "colors": [[30, 30, 30], [245, 245, 245]],
        "primary_color": [30, 30, 30],
        "color_name": "Black",
        "occasion_tags": ["casual", "sports"],
        "wear_count": 0,
        "last_worn": None,
        "in_laundry": False,
        "created_at": datetime.utcnow(),
    },
]

clothes_collection.insert_many(items)
print("Inserted test clothes and reset collections.")
