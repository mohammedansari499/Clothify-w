import tensorflow.lite as tflite
import numpy as np

labels = [
    "shirt",
    "tshirt",
    "pants",
    "jeans",
    "shorts",
    "jacket",
    "sweater",
    "dress",
    "shoes"
]

interpreter = tflite.Interpreter(
    model_path="models/clothing_classifier.tflite")
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
