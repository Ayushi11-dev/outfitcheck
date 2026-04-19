const BACKEND = "http://localhost:5000/api";

export async function generateOutfits(wardrobe, occasion) {
  const res = await fetch(`${BACKEND}/outfits/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wardrobe, occasion }),
  });
  const data = await res.json();
  return data.outfits;
}

export async function completeOutfit(anchorItems, wardrobe, neededCategories) {
  const res = await fetch(`${BACKEND}/outfits/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anchorItems, wardrobe, neededCategories }),
  });
  return res.json();
}

export async function checkFit(base64Image) {
  const res = await fetch(`${BACKEND}/fitcheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64: base64Image }),
  });
  return res.json();
}