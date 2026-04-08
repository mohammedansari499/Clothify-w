from pymongo import MongoClient, ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["wardrobeai"]

def init_db():
    print("🚀 Initializing MongoDB Indexes...")
    
    # Users index (unique email)
    db.users.create_index([("email", ASCENDING)], unique=True)
    print("✅ Created index on users(email)")
    
    # Clothes index (user_id)
    db.clothes.create_index([("user_id", ASCENDING)])
    print("✅ Created index on clothes(user_id)")
    
    # Collections index (user_id)
    db.collections.create_index([("user_id", ASCENDING)])
    print("✅ Created index on collections(user_id)")
    
    # Outfit Plans index (user_id, date)
    db.outfit_plans.create_index([("user_id", ASCENDING), ("date", ASCENDING)])
    print("✅ Created index on outfit_plans(user_id, date)")
    
    print("🎉 Database initialization complete!")

if __name__ == "__main__":
    init_db()
