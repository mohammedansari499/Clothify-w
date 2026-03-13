import cv2
import numpy as np
import random


def extract_colors(image_path):

    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    image = cv2.resize(image, (200, 200))

    pixels = image.reshape((-1, 3))

    pixels = np.float32(pixels)

    k = 3

    criteria = (
        cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER,
        10,
        1.0,
    )

    _, labels, centers = cv2.kmeans(
        pixels,
        k,
        None,
        criteria,
        10,
        cv2.KMEANS_RANDOM_CENTERS
    )

    colors = centers.astype(int)

    return colors.tolist()


def classify_clothing(image_path):

    labels = [
        "shirt",
        "pants",
        "jacket",
        "dress",
        "shoes"
    ]

    return random.choice(labels)


def analyze_clothing(image_path):

    colors = extract_colors(image_path)

    clothing_type = classify_clothing(image_path)

    return {
        "type": clothing_type,
        "colors": colors
    }
