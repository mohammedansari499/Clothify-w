import requests
import json
import os

BASE_URL = "http://127.0.0.1:5000/api"
IMAGE_PATH = r"C:\Users\Wahaj Ansari\.gemini\antigravity\brain\c2f7e5e7-9eea-45c4-aa8f-cedfae8345c1\red_jacket_png_1774327332050.png"

def test_upload():
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "test_e2e_user@example.com",
        "password": "password123"
    })
    token = resp.json().get("token")
    if not token:
        print("Login failed:", resp.text)
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Uploading image...")
    with open(IMAGE_PATH, "rb") as f:
        upload_resp = requests.post(
            f"{BASE_URL}/upload/",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": f}
        )
    
    print("Upload Response:", upload_resp.status_code, upload_resp.text)
    image_url = upload_resp.json().get("image_url")
    
    print("Classifying image:", image_url)
    classify_resp = requests.post(
        f"{BASE_URL}/classify",
        headers=headers,
        json={"image_url": image_url}
    )
    
    print("Classify Response:", classify_resp.status_code, classify_resp.text)

if __name__ == "__main__":
    test_upload()
