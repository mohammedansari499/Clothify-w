from pymongo import MongoClient
import os
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Use a timeout to prevent indefinite hangs if the DB is unreachable
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

db = client["wardrobeai"]

users_collection = db["users"]
clothes_collection = db["clothes"]
outfit_plans_collection = db["outfit_plans"]
collections_collection = db["collections"]

def check_db_connection():
    """Verify that the database is reachable."""
    try:
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
