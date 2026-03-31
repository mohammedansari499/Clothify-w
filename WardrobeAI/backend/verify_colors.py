import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.classifier_service import _get_color_name

assert _get_color_name((240, 190, 150)) == "Peach"
assert _get_color_name((245, 222, 179)) == "Beige"
assert _get_color_name((170, 50, 80)) == "Burgundy"
assert _get_color_name((128, 0, 32)) == "Maroon"
print("COLOR TESTS PASSED")
