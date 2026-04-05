# How the WardrobeAI Local Classification Engine Works

The backend of WardrobeAI uses a dedicated AI package located in `app/ai/` to locally predict the garment **Type**, its **Color(s)**, and its **Style/Occasion**.

## 1. Top-Level Workflow
When an image is saved in the `/uploads/` folder and sent to the classification route (`/api/classify`):
1. **Route Handler:** Dispatches the image path to `app.services.classifier_service.analyze_clothing()`.
2. **Orchestrator:** `analyze_clothing` delegates out the heavy lifting:
   - Queries `classify_image()` to get what the item is.
   - Queries `extract_colors()` to determine the exact color palette.
   - Computes `occasion_tags` using a combination of the item type (e.g., blazers are formal) and the color's psychological profile (e.g., dark, low saturation colors lean formal).
3. **Response:** Merges the data into an elegant JSON structure and saves the document to MongoDB.

## 2. Clothing Classification (`app/ai/classifier.py`)
This module uses a **MobileNetV2** deep learning model powered by PyTorch.
- **Model Check:** Before inferring, the module checks the `app/ai/weights/` folder. If you ever train a custom `.pt` model for WardrobeAI and put it there, the module will auto-load it. Otherwise, it defaults to the pre-trained ImageNet model.
- **ImageNet Zero-Shot Translation:** Since standard ImageNet wasn't trained primarily on isolated clothing pictures, an image of a white dress shirt might natively be predicted as "lab coat".
  We built a `LABEL_KEYWORDS_ORDERED` tuple list that intercepts top-scoring predictions and strictly remaps them (e.g., "lab coat" is caught and translated to "shirt"). This yields high accuracy out-of-the-box.

## 3. Color Extraction (`app/ai/color_extractor.py`)
This module is much smarter than simple pixel averaging.
1. **Focus:** It crops to the center 60% of the image.
2. **Perceptual Color Space:** BGR colors are notoriously bad to cluster mathematically. It converts pixels to the **CIELAB color space**, where distance metrics exactly match human vision (`Delta-E`).
3. **Background Isolation:** It removes incredibly dark/light pixels and desaturated pixels, filtering out non-clothing artifacts (walls, shadows, pure white backgrounds).
4. **KMeans++:** Computes `n_clusters=5` via machine learning to identify the dominant hues in the garment.
5. **Human Mapping:** Translates the largest cluster back to an RGB format, then converts it to HSV to accurately assign 1-of-25+ human-readable labels (e.g., "Navy", "Salmon", "Lime", "Charcoal").

## 4. Dependencies
- **PyTorch/TorchVision**: CPU-only builds used to minimize installation size.
- **Scikit-Learn**: Used strictly for KMeans clustering.
- **OpenCV**: Standard, fast image decoding and color-space math.
