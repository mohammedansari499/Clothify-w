
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)

# Check database names
print(f"Databases available: {client.list_database_names()}")

# Use the one from the app config or URI
db_name = "WardrobeAI" # From URI
db = client[db_name]

# Check collections
collections_to_check = ["collections", "clothes"]
for coll_name in collections_to_check:
    coll = db[coll_name]
    items = list(coll.find().limit(5))
    print(f"\nCollection '{coll_name}' has {coll.count_documents({})} documents.")
    for i, item in enumerate(items):
        print(f"  Item {i+1}: {item.get('name') or item.get('type') or 'No Name'}")
        if 'outfits' in item:
            for j, outfit in enumerate(item['outfits']):
                print(f"    - Outfit {j+1}: {list(outfit.get('items', {}).keys())}")
                for cat, it in outfit.get('items', {}).items():
                    if it:
                        print(f"      - {cat}: {it.get('name')} (Image: {it.get('image_url')})")
        if 'image_url' in item:
            print(f"    - Image URL: {item.get('image_url')}")
