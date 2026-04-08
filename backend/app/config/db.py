from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))

db = client["wardrobeai"]

users_collection = db["users"]
clothes_collection = db["clothes"]

outfit_plans_collection = db["outfit_plans"]
collections_collection = db["collections"]
