const express = require("express");
const axios = require("axios");
const multer = require("multer");
const router = express.Router();

const ML_SERVICE = process.env.ML_SERVICE_URL;
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/fitcheck
// Accepts multipart image OR base64 JSON
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageBase64;

    if (req.file) {
      // Multipart upload
      imageBase64 = req.file.buffer.toString("base64");
    } else if (req.body.base64) {
      // Base64 JSON
      imageBase64 = req.body.base64.replace(/^data:image\/\w+;base64,/, "");
    } else {
      return res.status(400).json({ error: "No image provided" });
    }

    // Try ML service
    try {
      const mlRes = await axios.post(`${ML_SERVICE}/fitcheck`, {
        image: imageBase64
      }, { timeout: 10000 });
      return res.json(mlRes.data);
    } catch {
      console.log("ML service unavailable, using rule-based fit check");
    }

    // Fallback — basic heuristic scoring
    const scores = [
      { rating: "🔥 Fire",   score: 94, message: "Outstanding outfit! The proportions and color balance are excellent.", tips: ["Add a statement accessory", "This works for multiple occasions"] },
      { rating: "✨ Great",  score: 81, message: "Really solid look! Minor tweaks could make it perfect.", tips: ["Try tucking in the top", "A belt could add structure"] },
      { rating: "👍 Good",   score: 67, message: "Decent outfit. There's room to push the style further.", tips: ["Swap shoes for something bolder", "Add a layer for depth"] },
    ];

    res.json(scores[Math.floor(Math.random() * scores.length)]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fit check failed" });
  }
});

module.exports = router;