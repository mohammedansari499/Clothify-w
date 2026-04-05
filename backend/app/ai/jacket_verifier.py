import logging

logger = logging.getLogger(__name__)

class JacketVerifier:
    """
    A secondary zero-shot classifier specifically designed to distinguish
    between 'jacket', 't-shirt', and 'shirt' for ambiguous images.
    """
    _pipe = None

    @classmethod
    def load(cls):
        if cls._pipe is None:
            logger.info("[JacketVerifier] Loading zero-shot-image-classification model (CLIP)...")
            from transformers import pipeline
            # We use a small, efficient zero-shot model
            cls._pipe = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
            logger.info("[JacketVerifier] Model loaded successfully.")

    @classmethod
    def verify(cls, image_path: str) -> str:
        cls.load()
        from PIL import Image
        try:
            img = Image.open(image_path).convert("RGB")
        except Exception as e:
            logger.error(f"[JacketVerifier] Cannot open image: {e}")
            return "unknown"

        # The labels to distinguish between tops & outerwear
        candidate_labels = ["a photo of a jacket", "a photo of a t-shirt", "a photo of a shirt"]
        
        try:
            res = cls._pipe(img, candidate_labels=candidate_labels)
            # res is sorted by score by default
            best_label = res[0]['label']
            logger.info(f"[JacketVerifier] Result for {image_path}: {res}")
            
            if "jacket" in best_label:
                return "jacket"
            elif "t-shirt" in best_label:
                return "tshirt"
            elif "shirt" in best_label:
                return "shirt"
        except Exception as e:
            logger.error(f"[JacketVerifier] Inference failed: {e}")
            
        return "unknown"

def verify_jacket_or_shirt(image_path: str) -> str:
    return JacketVerifier.verify(image_path)
