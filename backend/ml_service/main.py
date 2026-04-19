from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import base64
import random
from PIL import Image
import io

app = FastAPI(title="Outfit ML Service")

# ── Models ──────────────────────────────────────────────
class WardrobeItem(BaseModel):
    id: str
    name: str
    imageURL: str
    category: str
    color: Optional[str] = ""

class GenerateRequest(BaseModel):
    wardrobe: List[WardrobeItem]
    occasion: Optional[str] = "casual"

class CompleteRequest(BaseModel):
    anchor_items: List[WardrobeItem]
    wardrobe: List[WardrobeItem]
    needed_categories: List[str]

class FitCheckRequest(BaseModel):
    image: str  # base64 string

# ── Health ───────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ML service running ✅"}

# ── Generate Outfit ──────────────────────────────────────
@app.post("/generate-outfit")
async def generate_outfit(req: GenerateRequest):
    try:
        from embeddings import get_embedding_from_url
        from compatibility import score_outfit_compatibility

        wardrobe_with_embeddings = []
        for item in req.wardrobe:
            emb = get_embedding_from_url(item.imageURL)
            wardrobe_with_embeddings.append({
                "item": item.dict(),
                "embedding": emb.tolist()
            })

        outfits = score_outfit_compatibility(wardrobe_with_embeddings, req.occasion)
        return {"outfits": outfits, "source": "ml-model"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Complete Outfit (FITB) ───────────────────────────────
@app.post("/complete-outfit")
async def complete_outfit(req: CompleteRequest):
    try:
        from embeddings import get_embedding_from_url
        from fitb import complete_outfit_fitb

        anchor_embs = []
        for item in req.anchor_items:
            emb = get_embedding_from_url(item.imageURL)
            anchor_embs.append({
                "item": item.dict(),
                "embedding": emb.tolist()
            })

        wardrobe_embs = []
        for item in req.wardrobe:
            emb = get_embedding_from_url(item.imageURL)
            wardrobe_embs.append({
                "item": item.dict(),
                "embedding": emb.tolist()
            })

        result = complete_outfit_fitb(anchor_embs, wardrobe_embs, req.needed_categories)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Fit Check ────────────────────────────────────────────
@app.post("/fitcheck")
async def fitcheck(req: FitCheckRequest):
    try:
        # Decode base64 image
        img_bytes = base64.b64decode(req.image)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # ── Placeholder scoring ──
        # Replace this block with your trained classifier later
        # e.g: score = your_model.predict(preprocess(img))
        responses = [
            {
                "rating": "🔥 Fire",
                "score": 94,
                "message": "Outstanding outfit! Excellent proportions and color balance.",
                "tips": ["Add a statement accessory", "This works across multiple occasions"]
            },
            {
                "rating": "✨ Great",
                "score": 81,
                "message": "Really solid look. A couple of small tweaks could make it perfect.",
                "tips": ["Try tucking in the top", "A belt could add more structure"]
            },
            {
                "rating": "👍 Good",
                "score": 67,
                "message": "Decent outfit. There's room to push the style further.",
                "tips": ["Swap shoes for something bolder", "Add a layer for more depth"]
            },
        ]
        return random.choice(responses)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))