const express = require("express");
const axios = require("axios");
const router = express.Router();

const ML_SERVICE = process.env.ML_SERVICE_URL;

// Color compatibility rules
const COLOR_GROUPS = {
  neutrals: ["white", "black", "grey", "gray", "beige", "cream", "navy", "brown"],
  earth:    ["brown", "tan", "camel", "olive", "khaki", "rust", "terracotta"],
  pastels:  ["light pink", "light blue", "lavender", "mint", "peach", "lilac"],
  bold:     ["red", "yellow", "orange", "bright blue", "hot pink", "purple"],
};

const OCCASION_RULES = {
  casual:  { formality: ["casual", "streetwear", "relaxed"] },
  formal:  { formality: ["formal", "smart", "business"] },
  evening: { formality: ["evening", "formal", "chic"] },
  sport:   { formality: ["sporty", "athletic", "activewear"] },
};

// Check if two colors are compatible
function areColorsCompatible(color1, color2) {
  const c1 = color1?.toLowerCase();
  const c2 = color2?.toLowerCase();

  // Neutrals go with everything
  const isNeutral = (c) =>
    COLOR_GROUPS.neutrals.some(n => c?.includes(n));

  if (isNeutral(c1) || isNeutral(c2)) return true;

  // Same color group = compatible
  for (const group of Object.values(COLOR_GROUPS)) {
    const c1InGroup = group.some(g => c1?.includes(g));
    const c2InGroup = group.some(g => c2?.includes(g));
    if (c1InGroup && c2InGroup) return true;
  }

  return false;
}

// Build valid outfit combos from wardrobe
function buildOutfitCombinations(wardrobe, occasion = "casual") {
  const tops      = wardrobe.filter(i => i.category === "Tops");
  const bottoms   = wardrobe.filter(i => i.category === "Bottoms");
  const shoes     = wardrobe.filter(i => i.category === "Shoes");
  const outerwear = wardrobe.filter(i => i.category === "Outerwear");
  const dresses   = wardrobe.filter(i => i.category === "Dresses");

  const outfits = [];

  // TOP + BOTTOM + SHOES combos
  for (const top of tops) {
    for (const bottom of bottoms) {
      if (!areColorsCompatible(top.color, bottom.color)) continue;
      for (const shoe of shoes) {
        if (!areColorsCompatible(bottom.color, shoe.color)) continue;

        const score = calculateScore(top, bottom, shoe);
        outfits.push({
          pieces: [top, bottom, shoe],
          categories: ["top", "bottom", "shoes"],
          score,
          occasion,
          tip: generateTip(top, bottom, shoe),
        });
      }
    }
  }

  // DRESS + SHOES combos
  for (const dress of dresses) {
    for (const shoe of shoes) {
      if (!areColorsCompatible(dress.color, shoe.color)) continue;
      const score = calculateScore(dress, shoe);
      outfits.push({
        pieces: [dress, shoe],
        categories: ["dress", "shoes"],
        score,
        occasion,
        tip: generateTip(dress, shoe),
      });
    }
  }

  // Sort by score, remove duplicates, return top 5
  return outfits
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(o => ({
      ...o,
      rating: o.score > 0.85 ? "🔥 Fire" : o.score > 0.7 ? "✨ Great" : "👍 Good",
      pieces: o.pieces.map(p => ({
        id: p.id,
        name: p.name,
        imageURL: p.imageURL,
        category: p.category,
        color: p.color,
      })),
    }));
}

// Simple score based on color harmony + variety
function calculateScore(...items) {
  let score = 0.6; // base score
  const colors = items.map(i => i?.color?.toLowerCase());
  const neutralCount = colors.filter(c =>
    COLOR_GROUPS.neutrals.some(n => c?.includes(n))
  ).length;

  // Reward neutral anchors
  if (neutralCount >= 1) score += 0.1;
  if (neutralCount >= 2) score += 0.1;

  // Reward color variety (not all same color)
  const uniqueColors = new Set(colors).size;
  if (uniqueColors === colors.length) score += 0.1;

  // Cap at 0.99
  return Math.min(score + Math.random() * 0.05, 0.99);
}

function generateTip(top, bottom, shoes) {
  const tips = [
    `The ${top?.color || "neutral"} ${top?.name || "top"} pairs beautifully with these pieces.`,
    `Roll up the sleeves slightly for a more relaxed, effortless look.`,
    `Add a minimalist watch or bracelet to elevate this combo.`,
    `Tuck in the top for a more polished silhouette.`,
    `This color combo works especially well in natural lighting.`,
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

// POST /api/outfits/generate
// Body: { wardrobe: [...items], occasion: "casual", history: [...outfitIds] }
router.post("/generate", async (req, res) => {
  try {
    const { wardrobe, occasion, history = [] } = req.body;

    if (!wardrobe || wardrobe.length < 2) {
      return res.status(400).json({ error: "Need at least 2 wardrobe items" });
    }

    // Try ML service first (if running)
    try {
      const mlRes = await axios.post(`${ML_SERVICE}/generate-outfit`, {
        wardrobe, occasion
      }, { timeout: 5000 });
      return res.json(mlRes.data);
    } catch {
      // ML service not running — fall back to rule-based logic
      console.log("ML service unavailable, using rule-based logic");
    }

    const outfits = buildOutfitCombinations(wardrobe, occasion);
    res.json({ outfits, source: "rule-based" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Outfit generation failed" });
  }
});

// POST /api/outfits/complete
// Body: { anchorItems: [...], wardrobe: [...], neededCategories: ["Bottoms","Shoes"] }
router.post("/complete", async (req, res) => {
  try {
    const { anchorItems, wardrobe, neededCategories } = req.body;

    if (!anchorItems || anchorItems.length === 0) {
      return res.status(400).json({ error: "Provide at least one anchor item" });
    }

    // Try ML service first
    try {
      const mlRes = await axios.post(`${ML_SERVICE}/complete-outfit`, {
        anchor_items: anchorItems,
        wardrobe,
        needed_categories: neededCategories,
      }, { timeout: 5000 });
      return res.json(mlRes.data);
    } catch {
      console.log("ML service unavailable, using rule-based FITB");
    }

    // Rule-based FITB
    const completed = {};
    for (const category of neededCategories) {
      const candidates = wardrobe.filter(i => i.category === category);
      let bestItem = null;
      let bestScore = -1;

      for (const candidate of candidates) {
        let score = 0;
        for (const anchor of anchorItems) {
          if (areColorsCompatible(anchor.color, candidate.color)) score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          bestItem = candidate;
        }
      }

      if (bestItem) completed[category] = bestItem;
    }

    const allPieces = [
      ...anchorItems,
      ...Object.values(completed),
    ];

    res.json({
      completedOutfit: allPieces,
      filledIn: completed,
      score: calculateScore(...allPieces),
      source: "rule-based-fitb",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "FITB completion failed" });
  }
});

module.exports = router;