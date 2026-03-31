import sys
import os
import cv2
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.classifier_service import _visual_classify, extract_colors, _get_color_name

uploads_dir = "uploads"
files = [f for f in os.listdir(uploads_dir) if os.path.isfile(os.path.join(uploads_dir, f))]
files.sort(key=lambda x: os.path.getmtime(os.path.join(uploads_dir, x)), reverse=True)

with open("debug_results.txt", "w") as out:
    for f in files[:4]:  # Check top 4 newest files
        path = os.path.join(uploads_dir, f)
        out.write(f"\n--- Debugging: {f} ---\n")
        
        try:
            colors = extract_colors(path)
            color_name = _get_color_name(colors[0])
            out.write(f"Color: {color_name} (RGB: {colors[0]})\n")
        except Exception as e:
            out.write(f"Color error: {e}\n")

        img = cv2.imread(path)
        if img is None: continue
        h_orig, w_orig = img.shape[:2]
        aspect_ratio = h_orig / max(w_orig, 1)
        
        img_resized = cv2.resize(img, (224, 224))
        gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.mean(edges > 0)
        
        h_channel, s_channel, v_channel = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
        avg_sat = np.mean(s_channel)
        skin_ratio = np.mean(((h_channel >= 0) & (h_channel <= 25) & (s_channel >= 40) & (s_channel <= 180) & (v_channel >= 80)))
        blue_ratio = np.mean(((h_channel >= 90) & (h_channel <= 130) & (s_channel >= 30)))
        
        upper_half = gray[:112, :]
        lower_half = gray[112:, :]
        upper_edges = np.mean(cv2.Canny(upper_half, 50, 150) > 0)
        lower_edges = np.mean(cv2.Canny(lower_half, 50, 150) > 0)
        
        center = gray[30:194, 30:194]
        _, binary = cv2.threshold(center, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        cov = np.mean(binary > 0)
        
        out.write(f"Aspect ratio: {aspect_ratio:.2f}\n")
        out.write(f"Garment coverage: {cov:.2f}\n")
        out.write(f"Blue ratio: {blue_ratio:.2f}, Skin ratio: {skin_ratio:.2f}\n")
        out.write(f"Upper edges: {upper_edges:.3f}, Lower edges: {lower_edges:.3f}\n")
        out.write(f"Avg sat: {avg_sat:.1f}\n")
        
        res = _visual_classify(path)
        out.write(f"Result: {res}\n")
