"""Test classification and colour extraction, save results to file."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.ai.classifier import classify_image
from app.ai.color_extractor import extract_colors

test_images = [
    "uploads/blue_t_shirt.jpg",
    "uploads/black_jeans.jpg",
    "uploads/red_jacket.jpg",
    "uploads/white_shirt.webp",
    "uploads/dark_blue_shirt.webp",
    "uploads/yellow_shirt.webp",
    "uploads/grey_turtleneck.jpg",
    "uploads/dark_blue_jeans.jpg",
    "uploads/black_pant.webp",
    "uploads/t_shirt.webp",
]

lines = []
lines.append("IMAGE | TYPE | CONF | COLOR | RGB")
lines.append("------|------|------|-------|----")

for path in test_images:
    if not os.path.exists(path):
        lines.append(f"SKIP: {path}")
        continue

    fname = os.path.basename(path)
    cls = classify_image(path)
    col = extract_colors(path)
    lines.append(f"{fname} | {cls['type']} | {cls['confidence']:.0%} | {col['color_name']} | {col['primary_color']}")

with open("test_results_new.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Results written to test_results_new.txt")
