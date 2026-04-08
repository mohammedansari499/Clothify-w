import os
import certifi
from pymongo import MongoClient
import sys

# use backend env for uri
uri = "mongodb+srv://mohammedansari4u_db_user:Warrendb@cluster0.ifrdulx.mongodb.net/WardrobeAI"
try:
    print("Connecting...")
    client = MongoClient(uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    client.admin.command('ping')
    print("Connection successful!")
    sys.exit(0)
except Exception as e:
    print("Connection failed:", e)
    sys.exit(1)
