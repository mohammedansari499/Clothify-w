"""See raw ImageNet predictions for problem images."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import torch
from torchvision import transforms, models
from PIL import Image

IMG_SIZE = 224
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
model.eval()

tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])

labels = models.MobileNet_V2_Weights.IMAGENET1K_V1.meta["categories"]

problem_images = [
    "uploads/white_shirt.webp",
    "uploads/yellow_shirt.webp",
    "uploads/black_pant.webp",
    "uploads/t_shirt.webp",
    "uploads/red_jacket.jpg",
]

lines = []
for path in problem_images:
    if not os.path.exists(path):
        continue
    img = Image.open(path).convert("RGB")
    tensor = tf(img).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1)[0]
    top10 = torch.argsort(probs, descending=True)[:10]
    lines.append(f"\n=== {os.path.basename(path)} ===")
    for idx in top10:
        lines.append(f"  {labels[idx.item()]:40s} {probs[idx].item():.2%}")

with open("debug_imagenet_labels.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("Written to debug_imagenet_labels.txt")
