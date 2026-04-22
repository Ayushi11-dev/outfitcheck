import os, json

DATA_DIR = "/Users/ayushisingh/outfitcheck/.venv/polyvore_data"
NONDISJOINT = os.path.join(DATA_DIR, "nondisjoint")

# Check images folder - how are files named?
images_dir = os.path.join(DATA_DIR, "images")
sample_images = os.listdir(images_dir)[:10]
print("=== Sample image filenames ===")
for f in sample_images:
    print(f" ", f)

# Check if images folder has subfolders or direct files
first = os.path.join(images_dir, sample_images[0])
print("\nFirst image is a:", "FOLDER" if os.path.isdir(first) else "FILE")

# Check train.txt structure
train_txt = os.path.join(NONDISJOINT, "train.txt")
print("\n=== First 5 lines of nondisjoint/train.txt ===")
with open(train_txt) as f:
    for i, line in enumerate(f):
        print(" ", line.strip())
        if i >= 4: break

# Check metadata JSON - it's a dict not a list
meta_path = os.path.join(DATA_DIR, "polyvore_item_metadata.json")
with open(meta_path) as f:
    metadata = json.load(f)
print("\n=== polyvore_item_metadata.json ===")
print("Total items:", len(metadata))
first_key = list(metadata.keys())[0]
print("Sample key:", first_key)
print("Sample value:", metadata[first_key])