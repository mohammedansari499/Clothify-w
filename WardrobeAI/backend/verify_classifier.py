import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.classifier_service import analyze_clothing

image1 = r"C:\Users\Wahaj Ansari\.gemini\antigravity\brain\7e5ca29a-6671-477d-a065-34a2e2b15b70\orange_dress_test_1774333876780.png"
image2 = r"C:\Users\Wahaj Ansari\.gemini\antigravity\brain\7e5ca29a-6671-477d-a065-34a2e2b15b70\burgundy_dress_test_1774333893580.png"

res1 = analyze_clothing(image1)
print(f"res1: {res1['type']}, {res1['color_name']}")
assert res1['type'] == 'dress', f"Expected dress, got {res1['type']}"
assert res1['color_name'] in ['Peach', 'Orange', 'Beige', 'Red'], f"Expected warm color, got {res1['color_name']}"

res2 = analyze_clothing(image2)
print(f"res2: {res2['type']}, {res2['color_name']}")
assert res2['type'] == 'dress', f"Expected dress, got {res2['type']}"
assert res2['color_name'] in ['Burgundy', 'Red', 'Maroon', 'Black'], f"Got {res2['color_name']}"

print("CLASSIFIER TESTS PASSED")
