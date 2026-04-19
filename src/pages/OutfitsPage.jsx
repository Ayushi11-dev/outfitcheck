import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getDocs, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const occasions = ["Casual", "Formal", "Evening", "Sport", "Work", "Travel"];
const BACKEND = "http://localhost:5000/api";

export default function OutfitsPage() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [occasion, setOccasion] = useState("Casual");
  const [outfits, setOutfits] = useState([]);
  const [wardrobe, setWardrobe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, "users", user.uid, "wardrobe"))
      .then(snap => {
        setWardrobe(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
  }, [user]);

  const generate = async () => {
    if (wardrobe.length < 2) {
      setError("Add at least 2 items to your wardrobe first!");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      // ✅ Call Node.js backend instead of Gemini
      const res = await fetch(`${BACKEND}/outfits/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wardrobe, occasion }),
      });

      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setOutfits(data.outfits);

      // Save to Firestore
      for (const outfit of data.outfits) {
        await addDoc(collection(db, "users", user.uid, "outfits"), {
          ...outfit,
          pieces: outfit.pieces.map(p => p.id || p.name),
          occasion,
          generatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setError("Generation failed. Make sure backend is running on port 5000.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const getItemImage = (piece) => piece?.imageURL || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#e8f4f4] to-[#f0fafa] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#cce4e4]">
        <div>
          <h2 className="text-lg font-semibold text-[#28251d]">AI Outfit Generator</h2>
          <p className="text-sm text-[#7a7974] mt-1">
            {loading ? "Loading wardrobe..." : `${wardrobe.length} items in wardrobe`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {occasions.map(o => (
            <button key={o} onClick={() => setOccasion(o)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${occasion === o ? "bg-[#01696f] text-white" : "bg-white border border-[#dcd9d5] text-[#7a7974]"}`}>
              {o}
            </button>
          ))}
        </div>
        <button onClick={generate} disabled={generating || loading}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#01696f] text-white text-sm rounded-xl hover:bg-[#0c4e54] transition-all disabled:opacity-60">
          {generating
            ? <><span className="animate-spin inline-block">⟳</span> Generating...</>
            : "✨ Generate"}
        </button>
      </div>

      {error && (
        <div className="bg-[#fdeef4] border border-[#e0ced7] text-[#a12c7b] text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!generating && outfits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <span className="text-4xl">✨</span>
          <p className="text-sm font-medium text-[#28251d]">No outfits generated yet</p>
          <p className="text-xs text-[#7a7974]">Select an occasion and click Generate</p>
        </div>
      )}

      {/* Outfit Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {outfits.map((outfit, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#ece9e4] p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#28251d]">{outfit.occasion}</p>
                <p className="text-xs text-[#7a7974]">{outfit.pieces?.length} pieces</p>
              </div>
              <span className="text-xs bg-[#e8f4f4] text-[#01696f] px-3 py-1 rounded-full font-medium">
                {outfit.rating}
              </span>
            </div>

            {/* Pieces */}
            <div className="flex gap-2 mb-3">
              {outfit.pieces?.map((piece, j) => {
                const img = getItemImage(piece);
                return (
                  <div key={j} className="flex-1 flex flex-col gap-1">
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#f7f6f2] flex items-center justify-center">
                      {img
                        ? <img src={img} alt={piece.name} className="w-full h-full object-cover" loading="lazy" />
                        : <span className="text-2xl">👗</span>
                      }
                    </div>
                    <p className="text-xs text-center text-[#7a7974] truncate">{piece.name}</p>
                  </div>
                );
              })}
            </div>

            {outfit.tip && (
              <p className="text-xs text-[#7a7974] bg-[#f7f6f2] rounded-xl px-3 py-2 italic">
                💡 {outfit.tip}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}