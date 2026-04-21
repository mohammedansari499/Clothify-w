import logging
import os

from pymongo import MongoClient
from pymongo.errors import ConfigurationError, ServerSelectionTimeoutError

logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI")

client = None
db = None

try:
    if not MONGO_URI:
        raise ValueError("MONGO_URI environment variable is not set")

    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )

    # Force an actual connection check at startup
    client.admin.command("ping")

    db = client["wardrobeai"]
    logger.info("[db] MongoDB connected successfully")

except (ConfigurationError, ServerSelectionTimeoutError, ValueError) as e:
    logger.critical("[db] MongoDB connection failed: %s", e)
    logger.critical("[db] Backend started without a live database connection")
except Exception as e:
    logger.critical("[db] Unexpected MongoDB initialization error: %s", e)
    logger.critical("[db] Backend started without a live database connection")

users_collection = db["users"] if db is not None else None
clothes_collection = db["clothes"] if db is not None else None
outfit_plans_collection = db["outfit_plans"] if db is not None else None
collections_collection = db["collections"] if db is not None else None
