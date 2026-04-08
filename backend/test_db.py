import os
import bcrypt
from pymongo import MongoClient

def test():
    try:
        from dotenv import load_dotenv
        load_dotenv()
        client = MongoClient(os.getenv("MONGO_URI"))
        db = client["wardrobeai"]
        users_collection = db["users"]
        email = "test99@test.com"
        
        existing_user = users_collection.find_one({"email": email})
        print("Existing:", existing_user)

        password = "password"
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        users_collection.insert_one({"email": email, "password": password_hash})
        print("Inserted!")
        
        user = users_collection.find_one({"email": email})
        print("Retrieved user password:", type(user.get("password")))

        stored_password = user.get("password")
        if isinstance(stored_password, str):
            stored_password = stored_password.encode("utf-8")
            
        is_valid = bcrypt.checkpw(password.encode("utf-8"), stored_password)
        print("Is Valid:", is_valid)
    except Exception as e:
        import traceback
        traceback.print_exc()

test()
