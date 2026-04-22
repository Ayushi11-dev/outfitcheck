import os, pickle
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# ── Paths ──────────────────────────────────────────
DATA_DIR       = "/Users/ayushisingh/outfitcheck/polyvore_data"
NONDISJOINT    = os.path.join(DATA_DIR, "nondisjoint")
EMBED_CACHE    = os.path.join(DATA_DIR, "item_embeddings.pkl")
MODEL_PATH     = "/Users/ayushisingh/outfitcheck/ml/outfit_model_best.pt"

# ── Load embeddings + outfit maps ──────────────────
import json

def load_compat_txt(filename):
    outfits = []
    with open(os.path.join(NONDISJOINT, filename)) as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 2: continue
            outfits.append({"label": int(parts[0]), "set_id": str(parts[1]).split("_")[0]})
    return outfits

def load_outfit_json(filename):
    with open(os.path.join(NONDISJOINT, filename)) as f:
        return json.load(f)

test_compat = load_compat_txt("compatibility_test.txt")

outfit_items = {}
for split in ["train.json", "valid.json", "test.json"]:
    for outfit in load_outfit_json(split):
        outfit_items[str(outfit["set_id"])] = [str(i["item_id"]) for i in outfit["items"]]

with open(EMBED_CACHE, "rb") as f:
    item_embeddings = pickle.load(f)

# ── Build test data ────────────────────────────────
test_data = []
for row in test_compat:
    ids    = outfit_items.get(row["set_id"], [])
    embeds = [item_embeddings[i] for i in ids if i in item_embeddings]
    if len(embeds) >= 2:
        test_data.append({"embeddings": embeds, "label": row["label"]})
print(f"Test outfits: {len(test_data)}")

# ── Dataset ────────────────────────────────────────
class OutfitDataset(torch.utils.data.Dataset):
    def __init__(self, data, max_items=8):
        self.data = data
        self.max_items = max_items
    def __len__(self): return len(self.data)
    def __getitem__(self, idx):
        row    = self.data[idx]
        embeds = row["embeddings"][:self.max_items]
        while len(embeds) < self.max_items:
            embeds.append(np.zeros(2048))
        return (torch.tensor(np.stack(embeds), dtype=torch.float32),
                torch.tensor(float(row["label"]), dtype=torch.float32))

test_loader = DataLoader(OutfitDataset(test_data), batch_size=64, shuffle=False)

# ── Model ──────────────────────────────────────────
class OutfitCompatibilityModel(nn.Module):
    def __init__(self, embed_dim=2048, hidden=512):
        super().__init__()
        self.item_proj = nn.Sequential(
            nn.Linear(embed_dim, hidden), nn.LayerNorm(hidden), nn.ReLU(), nn.Dropout(0.3))
        self.classifier = nn.Sequential(
            nn.Linear(hidden, 256), nn.ReLU(), nn.Dropout(0.2), nn.Linear(256, 1))
    def forward(self, x):
        return self.classifier(self.item_proj(x).mean(dim=1)).squeeze(-1)

model = OutfitCompatibilityModel()
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

# ── Evaluate ───────────────────────────────────────
correct, total = 0, 0
with torch.no_grad():
    for x, y in test_loader:
        preds    = (torch.sigmoid(model(x)) > 0.5).float()
        correct += (preds == y).sum().item()
        total   += y.size(0)

print(f"\n🎯 Test Accuracy: {correct/total:.4f} ({correct/total*100:.2f}%)")