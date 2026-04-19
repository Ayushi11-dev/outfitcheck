const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const outfitRoutes = require("./routes/outfits");
const fitcheckRoutes = require("./routes/fitcheck");
const wardrobeRoutes = require("./routes/wardrobe");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/outfits", outfitRoutes);
app.use("/api/fitcheck", fitcheckRoutes);
app.use("/api/wardrobe", wardrobeRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running ✅", port: PORT });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});