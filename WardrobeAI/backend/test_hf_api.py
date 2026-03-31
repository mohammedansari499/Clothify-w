"""Test HuggingFace API without token"""
import requests
import cv2

# Resize image to reduce payload
img = cv2.imread('uploads/dark_blue_jeans.jpg')
img = cv2.resize(img, (224, 224))
ok, buf = cv2.imencode('.jpg', img)
data = buf.tobytes()
print("Image size:", len(data), "bytes")

resp = requests.post(
    "https://api-inference.huggingface.co/models/microsoft/resnet-50",
    headers={"Content-Type": "application/octet-stream"},
    data=data,
    timeout=15
)
print("Status:", resp.status_code)
result = resp.json()
if isinstance(result, list):
    for p in result[:5]:
        print("  %s: %.3f" % (p["label"], p["score"]))
else:
    print("Response:", result)
