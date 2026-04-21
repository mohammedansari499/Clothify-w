# How the Clothify AI Model Works

Clothify uses a combination of **Deep Learning (ResNet-101)** and a **Rule-Based Mapping System** to classify clothing items and generate intelligent outfit recommendations.

## 1. Image Classification (ResNet-101)
We use a pre-trained **ResNet-101** model (via `torchvision`) trained on ImageNet-1K.
- **Preprocessing**: Images are resized, center-cropped, and normalized according to ImageNet standards.
- **Inference**: The model returns probabilities for 1,000 different object categories.
- **Mapping**: Since ImageNet categories are granular (e.g., "trilby", "mortarboard", "jersey"), we use a custom `PRED_MAPPING` in `classifier.py` to translate these into useful clothing types like `tshirt`, `shirt`, `jeans`, `dress`, etc.

## 2. Classification Logic & Keywords
To handle the "in-between" categories, we use keyword matching on the ImageNet labels:
- **Tops**: `tshirt`, `shirt`, `formal_shirt`, `hoodie`, `sweater`, `jacket`, `blazer`, `coat`, `kurta`, `sherwani`.
- **Bottoms**: `jeans`, `formal_pants`, `cargo_pants`, `track_pants`, `shorts`, `skirt`, `pyjama`.
- **Footwear**: `sneakers`, `shoes`, `loafers`, `sandals`, `slippers`.
- **Accessories**: `watch`, `belt`, `cap`, `socks`, `tie`, `scarf`.

## 3. Outfit Generation Engine
The `outfit_service.py` runs a multi-step logic to curate the best combos:
1. **Filtering**: Items are filtered by weather (temp/rain) if current weather data is available.
2. **Compatibility Ranking**:
   - Uses a **Color Harmony Matrix** (Complementary, Analogous, Tetradic).
   - Rules like "No Two Bright Colors Together" and "Lighter Top / Darker Bottom" are applied.
3. **Weekly Planner**:
   - A 7-day schedule is generated.
   - Each day has a **Style Target** (Casual, Semi-formal, Formal, Traditional).
   - Users can **Customize Occasions** (e.g., Monday = Office, Friday = Party) to override default styles.

## 4. Design & Performance
- **Minimalistic UI**: The planner uses glassmorphism and smooth transitions to provide a premium experience.
- **Efficiency**: All model inference happens on the backend, ensuring a lightweight mobile/web experience.
