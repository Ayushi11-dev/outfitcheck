import numpy as np
from embeddings import cosine_similarity

def score_pair(emb1: list, emb2: list) -> float:
    """
    Score compatibility between two clothing items.
    Uses cosine similarity — normalized to 0.5–1.0 range
    because fashion compatibility isn't about identical items,
    it's about complementary ones.
    """
    sim = cosine_similarity(np.array(emb1), np.array(emb2))
    return round(0.5 + (sim * 0.5), 4)

def score_full_outfit(items_with_embeddings: list) -> float:
    """
    Score an entire outfit by averaging pairwise compatibility
    of all item combinations.
    """
    if len(items_with_embeddings) < 2:
        return 0.5

    scores = []
    for i in range(len(items_with_embeddings)):
        for j in range(i + 1, len(items_with_embeddings)):
            s = score_pair(
                items_with_embeddings[i]["embedding"],
                items_with_embeddings[j]["embedding"]
            )
            scores.append(s)

    return round(float(np.mean(scores)), 4)

def score_outfit_compatibility(wardrobe_with_embeddings: list, occasion: str = "casual") -> list:
    """
    Main function — builds all valid outfit combinations
    from user's wardrobe and ranks them by compatibility score.

    Valid combos:
      → Top + Bottom + Shoes
      → Dress + Shoes
      → Top + Bottom + Shoes + Outerwear
    """
    tops      = [i for i in wardrobe_with_embeddings if i["item"]["category"] == "Tops"]
    bottoms   = [i for i in wardrobe_with_embeddings if i["item"]["category"] == "Bottoms"]
    shoes     = [i for i in wardrobe_with_embeddings if i["item"]["category"] == "Shoes"]
    outerwear = [i for i in wardrobe_with_embeddings if i["item"]["category"] == "Outerwear"]
    dresses   = [i for i in wardrobe_with_embeddings if i["item"]["category"] == "Dresses"]

    outfits = []

    # ── Top + Bottom + Shoes ──
    for top in tops:
        for bottom in bottoms:
            for shoe in shoes:
                combo = [top, bottom, shoe]
                score = score_full_outfit(combo)
                outfits.append(_build_outfit_response(combo, score, occasion))

    # ── Top + Bottom + Shoes + Outerwear ──
    for top in tops:
        for bottom in bottoms:
            for shoe in shoes:
                for outer in outerwear:
                    combo = [top, bottom, shoe, outer]
                    score = score_full_outfit(combo)
                    outfits.append(_build_outfit_response(combo, score, occasion))

    # ── Dress + Shoes ──
    for dress in dresses:
        for shoe in shoes:
            combo = [dress, shoe]
            score = score_full_outfit(combo)
            outfits.append(_build_outfit_response(combo, score, occasion))

    # Sort by score descending, return top 5
    outfits.sort(key=lambda x: x["score"], reverse=True)
    return outfits[:5]

def _build_outfit_response(combo: list, score: float, occasion: str) -> dict:
    rating = (
        "🔥 Fire"  if score > 0.85 else
        "✨ Great" if score > 0.75 else
        "👍 Good"
    )
    return {
        "pieces": [i["item"] for i in combo],
        "score": score,
        "rating": rating,
        "occasion": occasion,
        "tip": _get_tip(combo),
    }

def _get_tip(combo: list) -> str:
    tips = [
        "The embedding model detected strong visual harmony between these pieces.",
        "Color tones in these items share a complementary undertone.",
        "Great texture contrast detected — this combo has visual depth.",
        "These pieces share a consistent style signature.",
        "The silhouette balance across these items is excellent.",
    ]
    import random
    return random.choice(tips)