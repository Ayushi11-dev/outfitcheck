import os, pickle
import numpy as np
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import io

# ── Config ───────────────────────────────────────────────
DATA_DIR    = "/Users/ayushisingh/outfitcheck/polyvore_data"
MODEL_PATH  = "/Users/ayushisingh/outfitcheck/ml/outfit_model_best.pt"
device      = torch.device("cpu")

app = Flask(__name__)
CORS(app)

# ── Load ResNet embedder ──────────────────────────────────
resnet = models.resnet50(weights="IMAGENET1K_V1")
resnet = torch.nn.Sequential(*list(resnet.children())[:-1])
resnet = resnet.to(device).eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ── Model (matches outfit_model_best.pt — Transformer) ───
class OutfitCompatibilityModel(nn.Module):
    def __init__(self, embed_dim=2048, hidden=512, nhead=4):
        super().__init__()
        self.item_proj = nn.Sequential(
            nn.Linear(embed_dim, hidden),
            nn.LayerNorm(hidden),
            nn.ReLU(),
            nn.Dropout(0.3)
        )
        self.cls_token = nn.Parameter(torch.randn(1, 1, hidden))
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden, nhead=nhead,
            dim_feedforward=1024, dropout=0.1, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)
        self.classifier = nn.Sequential(
            nn.Linear(hidden, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1)
        )
    def forward(self, x):
        x   = self.item_proj(x)
        cls = self.cls_token.expand(x.size(0), -1, -1)
        x   = torch.cat([cls, x], dim=1)
        x   = self.transformer(x)
        return self.classifier(x[:, 0, :]).squeeze(-1)

model = OutfitCompatibilityModel().to(device)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()
print("✅ Model loaded. API ready.")

# ── Helper: embed a PIL image ─────────────────────────────
def embed_image(pil_img):
    tensor = transform(pil_img.convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        return resnet(tensor).squeeze().cpu().numpy()

# ── Route: Score uploaded outfit images ──────────────────
@app.route("/score", methods=["POST"])
def score_outfit():
    files = request.files.getlist("images")
    if len(files) < 2:
        return jsonify({"error": "Send at least 2 outfit images"}), 400

    embeddings = []
    for f in files[:8]:
        img = Image.open(io.BytesIO(f.read()))
        embeddings.append(embed_image(img))

    while len(embeddings) < 8:
        embeddings.append(np.zeros(2048))

    x = torch.tensor(np.stack(embeddings), dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        logit = model(x).item()
        score = torch.sigmoid(torch.tensor(logit)).item()

    return jsonify({
        "score": round(score * 100, 1),
        "label": "Great match!" if score > 0.55 else "Neutral" if score > 0.45 else "Might clash",
        "raw": round(logit, 4)
    })

# ── Route: Health check ───────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5001, debug=False)