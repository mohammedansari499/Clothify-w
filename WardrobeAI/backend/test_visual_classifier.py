"""Quick test of the visual classifier on existing uploads."""
import os
import sys
sys.path.insert(0, '.')

# Ensure dotenv is loaded
from dotenv import load_dotenv
load_dotenv()

from app.services.classifier_service import classify_clothing, _visual_classify, extract_colors, _get_color_name

uploads_dir = "uploads"
for f in os.listdir(uploads_dir):
    path = os.path.join(uploads_dir, f)
    if not os.path.isfile(path):
        continue
    
    result = classify_clothing(path)
    colors = extract_colors(path)
    color_name = _get_color_name(colors[0]) if colors else "Unknown"
    
    print("=" * 50)
    print("File:", f)
    print("Type:", result["type"])
    print("Label:", result["label"])
    print("Style:", result.get("style"))
    print("Confidence:", result["confidence"])
    print("Primary Color:", colors[0] if colors else "N/A", "->", color_name)
    
    # Also test pure visual
    vis = _visual_classify(path)
    if vis:
        print("Visual-only:", vis["type"], "(confidence:", vis["confidence"], ")")
    else:
        print("Visual-only: None")
    print()
