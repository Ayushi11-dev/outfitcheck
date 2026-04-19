import numpy as np
from embeddings import cosine_similarity

def complete_outfit_fitb(
    anchor_embs: list,
    wardrobe_embs: list,
    needed_categories: list
) -> dict:
    """
    Fill-in-the-Blank (FITB) Algorithm.

    Given:
      - anchor_embs: items the user already selected (with embeddings)
      - wardrobe_embs: all other wardrobe items (with embeddings)
      - needed_categories: what's missing ["Bottoms", "Shoes"]

    Returns the best matching item per missing category
    based on cosine similarity with anchor items.
    """

    completed = {}

    for category in needed_categories:

        # Get all wardrobe items in this category
        candidates = [
            w for w in wardrobe_embs
            if w["item"]["category"] == category
        ]

        if not candidates:
            print(f"No candidates found for category: {category}")
            continue

        best_item = None
        best_score = -1.0

        for candidate in candidates:
            candidate_emb = np.array(candidate["embedding"])

            # Score against every anchor item, take average
            pair_scores = []
            for anchor in anchor_embs:
                anchor_emb = np.array(anchor["embedding"])
                sim = cosine_similarity(anchor_emb, candidate_emb)
                pair_scores.append(sim)

            avg_score = float(np.mean(pair_scores))

            if avg_score > best_score:
                best_score = avg_score
                best_item = candidate["item"]

        if best_item:
            completed[category] = {
                "item": best_item,
                "compatibilityScore": round(best_score, 4)
            }

    # Build final outfit = anchors + filled items
    all_pieces = (
        [a["item"] for a in anchor_embs] +
        [v["item"] for v in completed.values()]
    )

    # Overall score = average of all filled compatibility scores
    if completed:
        overall_score = round(
            float(np.mean([v["compatibilityScore"] for v in completed.values()])),
            4
        )
    else:
        overall_score = 0.5

    return {
        "completedOutfit": all_pieces,
        "filledIn": completed,
        "totalPieces": len(all_pieces),
        "overallScore": overall_score,
        "rating": (
            "🔥 Fire"  if overall_score > 0.85 else
            "✨ Great" if overall_score > 0.75 else
            "👍 Good"
        ),
        "source": "embedding-cosine-fitb"
    }