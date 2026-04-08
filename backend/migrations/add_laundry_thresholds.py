import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["wardrobeai"]
collection = db["clothes"]

def migrate():
    """
    Adds wear_count, last_worn, and laundry_threshold to existing items.
    """
    thresholds = {
        "top": 3,
        "bottom": 5,
        "outerwear": 10,
        "shoe": 20,
        "accessory": 30
    }

    items = collection.find()
    count = 0

    for item in items:
        updates = {}
        
        # Add wear_count if missing
        if "wear_count" not in item:
            updates["wear_count"] = 0
            
        # Add last_worn if missing
        if "last_worn" not in item:
            updates["last_worn"] = None
            
        # Add laundry_threshold if missing
        if "laundry_threshold" not in item:
            category = "accessory"
            clothing_type = item.get("type", "").lower()
            for cat, thresh in thresholds.items():
                if cat in clothing_type:
                    category = cat
                    break
            updates["laundry_threshold"] = thresholds.get(category, 5)

        if updates:
            collection.update_one({"_id": item["_id"]}, {"$set": updates})
            count += 1

    print(f"Migration completed. Updated {count} items.")

if __name__ == "__main__":
    migrate()
