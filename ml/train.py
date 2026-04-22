import os, json, pickle, random
import numpy as np
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from tqdm import tqdm
from torch.utils.data import Dataset, DataLoader

# ── Paths ──────────────────────────────────────────────────────────
DATA_DIR         = "/Users/ayushisingh/outfitcheck/polyvore_data"
NONDISJOINT_DIR  = os.path.join(DATA_DIR, "nondisjoint")
IMAGES_DIR       = os.path.join(DATA_DIR, "images")
EMBED_CACHE      = os.path.join(DATA_DIR, "item_embeddings.pkl")
MODEL_SAVE       = "/Users/ayushisingh/outfitcheck/ml/outfit_model_best.pt"

# ── Device ─────────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Device:", device)

# ── ResNet50 Embedder ──────────────────────────────────────────────
resnet = models.resnet50(weights="IMAGENET1K_V1")
resnet = torch.nn.Sequential(*list(resnet.children())[:-1])
resnet = resnet.to(device).eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ── Step 1: Load compatibility labels ─────────────────────────────
def load_compat_txt(filename):
    outfits = []
    path = os.path.join(NONDISJOINT_DIR, filename)
    with open(path) as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 2: continue
            label  = int(parts[0])
            set_id = str(parts[1]).split("_")[0]
            outfits.append({"label": label, "set_id": set_id})
    return outfits

print("Loading compatibility labels...")
train_compat = load_compat_txt("compatibility_train.txt")
val_compat   = load_compat_txt("compatibility_valid.txt")
test_compat  = load_compat_txt("compatibility_test.txt")
print(f"Train: {len(train_compat)} | Val: {len(val_compat)} | Test: {len(test_compat)}")
print("Sample:", train_compat[0])

# ── Step 2: Load outfit JSONs → set_id → [item_ids] ───────────────
def load_outfit_json(filename):
    path = os.path.join(NONDISJOINT_DIR, filename)
    with open(path) as f:
        return json.load(f)

print("\nLoading outfit JSONs...")
train_json = load_outfit_json("train.json")
val_json   = load_outfit_json("valid.json")
test_json  = load_outfit_json("test.json")

outfit_items = {}
for split_data in [train_json, val_json, test_json]:
    for outfit in split_data:
        set_id = str(outfit["set_id"])
        items  = [str(item["item_id"]) for item in outfit["items"]]
        outfit_items[set_id] = items

print(f"Outfit map size: {len(outfit_items)}")
print("Sample:", list(outfit_items.items())[0])

# ── Step 3: Collect needed item_ids ───────────────────────────────
needed_ids = set()
for row in train_compat + val_compat + test_compat:
    for iid in outfit_items.get(row["set_id"], []):
        needed_ids.add(iid)
print(f"\nUnique items needed: {len(needed_ids)}")

# ── Step 4: Embed images (cached) ─────────────────────────────────
if os.path.exists(EMBED_CACHE):
    print("Loading cached embeddings...")
    with open(EMBED_CACHE, "rb") as f:
        item_embeddings = pickle.load(f)
    print(f"Loaded {len(item_embeddings)} embeddings from cache")
else:
    print("Embedding images (first run only ~1hr on CPU)...")
    img_list = []
    for iid in needed_ids:
        path = os.path.join(IMAGES_DIR, f"{iid}.jpg")
        if os.path.exists(path):
            img_list.append((iid, path))
    print(f"Found {len(img_list)} images on disk")

    item_embeddings = {}
    BATCH_SIZE = 32

    for i in tqdm(range(0, len(img_list), BATCH_SIZE), desc="Embedding"):
        batch = img_list[i:i+BATCH_SIZE]
        try:
            imgs = [transform(Image.open(p).convert("RGB")) for _, p in batch]
            tensors = torch.stack(imgs).to(device)
            with torch.no_grad():
                embs = resnet(tensors).squeeze(-1).squeeze(-1).cpu().numpy()
            for j, (iid, _) in enumerate(batch):
                item_embeddings[iid] = embs[j]
        except:
            continue

    with open(EMBED_CACHE, "wb") as f:
        pickle.dump(item_embeddings, f)
    print(f"✅ Embedded {len(item_embeddings)} items — cached")

# ── Step 5: Build outfit training data ────────────────────────────
def build_data(compat_rows):
    data = []
    for row in compat_rows:
        item_ids = outfit_items.get(row["set_id"], [])
        embeds   = [item_embeddings[iid] for iid in item_ids if iid in item_embeddings]
        if len(embeds) >= 2:
            data.append({"embeddings": embeds, "label": row["label"]})
    return data

print("\nBuilding datasets...")
train_data = build_data(train_compat)
val_data   = build_data(val_compat)
test_data  = build_data(test_compat)
print(f"Train: {len(train_data)} | Val: {len(val_data)} | Test: {len(test_data)}")

# ── Step 6: Dataset + DataLoader ──────────────────────────────────
class OutfitDataset(Dataset):
    def __init__(self, data, max_items=8):
        self.data      = data
        self.max_items = max_items
    def __len__(self): return len(self.data)
    def __getitem__(self, idx):
        row    = self.data[idx]
        embeds = row["embeddings"][:self.max_items]
        while len(embeds) < self.max_items:
            embeds.append(np.zeros(2048))
        x = torch.tensor(np.stack(embeds), dtype=torch.float32)
        y = torch.tensor(float(row["label"]), dtype=torch.float32)
        return x, y

train_loader = DataLoader(OutfitDataset(train_data), batch_size=64, shuffle=True,  num_workers=0)
val_loader   = DataLoader(OutfitDataset(val_data),   batch_size=64, shuffle=False, num_workers=0)
test_loader  = DataLoader(OutfitDataset(test_data),  batch_size=64, shuffle=False, num_workers=0)
print(f"Train batches: {len(train_loader)} | Val batches: {len(val_loader)}")

# ── Step 7: Model (Transformer — Option B) ────────────────────────
class OutfitCompatibilityModel(nn.Module):
    def __init__(self, embed_dim=2048, hidden=512, nhead=4):
        super().__init__()
        # Project 2048 → 512
        self.item_proj = nn.Sequential(
            nn.Linear(embed_dim, hidden),
            nn.LayerNorm(hidden),
            nn.ReLU(),
            nn.Dropout(0.3)
        )
        # Learnable CLS token (like BERT)
        self.cls_token = nn.Parameter(torch.randn(1, 1, hidden))

        # Transformer: items attend to each other
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden,
            nhead=nhead,
            dim_feedforward=1024,
            dropout=0.1,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)

        # Classify from CLS token output
        self.classifier = nn.Sequential(
            nn.Linear(hidden, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1)
        )

    def forward(self, x):
        # x: (batch, num_items, 2048)
        x   = self.item_proj(x)                            # (batch, num_items, 512)
        cls = self.cls_token.expand(x.size(0), -1, -1)    # (batch, 1, 512)
        x   = torch.cat([cls, x], dim=1)                   # (batch, 1+num_items, 512)
        x   = self.transformer(x)                          # (batch, 1+num_items, 512)
        return self.classifier(x[:, 0, :]).squeeze(-1)     # CLS token → score

# ── Step 8: Train ──────────────────────────────────────────────────
model     = OutfitCompatibilityModel().to(device)
optimizer = torch.optim.AdamW(model.parameters(), lr=5e-4, weight_decay=1e-4)
criterion = nn.BCEWithLogitsLoss()
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=15)

best_val_acc = 0.0
EPOCHS = 20
print("\nStarting training (Transformer model)...")

for epoch in range(EPOCHS):
    model.train()
    train_loss, correct, total = 0, 0, 0
    for x, y in tqdm(train_loader, desc=f"Epoch {epoch+1:02d}/{EPOCHS}", leave=False):
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        out  = model(x)
        loss = criterion(out, y)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # stability
        optimizer.step()
        train_loss += loss.item()
        with torch.no_grad():
            correct += ((torch.sigmoid(out) > 0.5).float() == y).sum().item()
            total   += y.size(0)

    model.eval()
    vc, vt = 0, 0
    with torch.no_grad():
        for x, y in val_loader:
            x, y = x.to(device), y.to(device)
            vc += ((torch.sigmoid(model(x)) > 0.5).float() == y).sum().item()
            vt += y.size(0)

    scheduler.step()
    val_acc = vc / vt
    print(f"Epoch {epoch+1:02d}/{EPOCHS} | Loss: {train_loss/len(train_loader):.4f} | Train: {correct/total:.3f} | Val: {val_acc:.3f}")
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), MODEL_SAVE)
        print(f"  ✅ Saved best model (val={val_acc:.3f})")

# ── Step 9: Final test accuracy ────────────────────────────────────
model.load_state_dict(torch.load(MODEL_SAVE, map_location=device))
model.eval()
tc, tt = 0, 0
with torch.no_grad():
    for x, y in test_loader:
        x, y = x.to(device), y.to(device)
        tc += ((torch.sigmoid(model(x)) > 0.5).float() == y).sum().item()
        tt += y.size(0)
print(f"\n🎯 Test Accuracy: {tc/tt:.4f}")
print(f"Model saved at: {MODEL_SAVE}")