const express = require("express");
const router = express.Router();

// GET /api/wardrobe/categories
router.get("/categories", (req, res) => {
  res.json({
    categories: ["Tops", "Bottoms", "Shoes", "Outerwear", "Accessories", "Dresses"],
    colors: ["White", "Black", "Grey", "Beige", "Navy", "Blue", "Red", "Green", "Pink", "Brown", "Yellow", "Purple"],
    styles: ["Casual", "Formal", "Sporty", "Boho", "Streetwear", "Minimalist"],
  });
});

// POST /api/wardrobe/tag
// Auto-tag a clothing item based on name + color hints
router.post("/tag", (req, res) => {
  const { name, color } = req.body;
  const nameLower = name?.toLowerCase() || "";

  const categoryMap = {
    Tops:        ["shirt", "top", "tee", "blouse", "sweater", "hoodie", "crop", "tank", "polo"],
    Bottoms:     ["jeans", "pants", "trousers", "shorts", "skirt", "legging"],
    Shoes:       ["shoes", "sneakers", "boots", "heels", "sandals", "loafers", "flats"],
    Outerwear:   ["jacket", "coat", "blazer", "cardigan", "vest", "puffer"],
    Dresses:     ["dress", "gown", "jumpsuit", "romper"],
    Accessories: ["bag", "belt", "scarf", "hat", "cap", "watch", "jewel", "necklace"],
  };

  let detectedCategory = "Tops"; // default
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => nameLower.includes(k))) {
      detectedCategory = cat;
      break;
    }
  }

  const styleMap = {
    casual:   ["jeans", "tee", "sneakers", "hoodie"],
    formal:   ["blazer", "trousers", "heels", "dress shirt"],
    sporty:   ["legging", "shorts", "sneakers", "hoodie"],
    bohemian: ["flowy", "floral", "sandals", "scarf"],
  };

  let detectedStyle = "Casual";
  for (const [style, keywords] of Object.entries(styleMap)) {
    if (keywords.some(k => nameLower.includes(k))) {
      detectedStyle = style.charAt(0).toUpperCase() + style.slice(1);
      break;
    }
  }

  res.json({
    category: detectedCategory,
    style: detectedStyle,
    color: color || "Unknown",
    tags: [detectedCategory.toLowerCase(), detectedStyle.toLowerCase(), color?.toLowerCase()].filter(Boolean),
  });
});

module.exports = router;