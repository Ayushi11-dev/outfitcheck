import numpy as np
import requests
from PIL import Image
import io

# Lazy load model so it only loads when first needed
_model = None

def get_model():
    global _model
    if _model is None:
        print("Loading ResNet50 model... (first time only)")
        from tensorflow.keras.applications import ResNet50
        _model = ResNet50(weights="imagenet", include_top=False, pooling="avg")
        print("ResNet50 loaded ✅")
    return _model

def preprocess_image(img: Image.Image) -> np.ndarray:
    from tensorflow.keras.applications.resnet50 import preprocess_input
    from tensorflow.keras.preprocessing import image as keras_image

    img = img.resize((224, 224))
    x = keras_image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    return x

def get_embedding_from_url(image_url: str) -> np.ndarray:
    """
    Downloads image from Firebase Storage URL,
    runs it through ResNet50, returns 2048-dim embedding vector.
    """
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        img = Image.open(io.BytesIO(response.content)).convert("RGB")
        x = preprocess_image(img)
        model = get_model()
        embedding = model.predict(x, verbose=0)
        return embedding[0]  # shape: (2048,)
    except Exception as e:
        print(f"Embedding failed for {image_url}: {e}")
        # Return zero vector as fallback
        return np.zeros(2048)

def get_embedding_from_base64(base64_str: str) -> np.ndarray:
    """
    Takes a base64 image string (from fit check),
    returns 2048-dim embedding vector.
    """
    import base64
    try:
        img_bytes = base64.b64decode(base64_str)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        x = preprocess_image(img)
        model = get_model()
        embedding = model.predict(x, verbose=0)
        return embedding[0]
    except Exception as e:
        print(f"Embedding from base64 failed: {e}")
        return np.zeros(2048)

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Measures how similar two embedding vectors are.
    Returns value between -1 and 1 (higher = more similar).
    """
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))