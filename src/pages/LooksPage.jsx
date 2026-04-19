import { useState } from "react";

const skinTones = ["#FDDBB4", "#F0C27F", "#D4956A", "#A0634A", "#6B3A2A", "#3D1F10"];
const hairColors = ["#1a1a1a", "#4a3728", "#8B6914", "#C4A35A", "#E8D5B0", "#FF6B6B", "#9B59B6"];
const outfitColors = ["#ffffff", "#1a1a1a", "#2196F3", "#E91E63", "#4CAF50", "#FF9800", "#9C27B0"];

export default function LooksPage() {
  const [skin, setSkin] = useState(skinTones[0]);
  const [hair, setHair] = useState(hairColors[0]);
  const [outfit, setOutfit] = useState(outfitColors[0]);
  const [savedLooks, setSavedLooks] = useState([]);

  const saveLook = () => {
    setSavedLooks(p => [...p, { id: Date.now(), skin, hair, outfit }]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold text-[#28251d]">Build Your Look</h2>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Avatar Preview */}
        <div className="bg-white rounded-2xl border border-[#ece9e4] p-6 flex flex-col items-center gap-6">
          <p className="text-sm font-medium text-[#28251d] self-start">Avatar Preview</p>
          <svg width="160" height="260" viewBox="0 0 160 260">
            {/* Body */}
            <ellipse cx="80" cy="200" rx="45" ry="55" fill={outfit} stroke="#e0ddd8" strokeWidth="1"/>
            {/* Arms */}
            <ellipse cx="30" cy="185" rx="14" ry="40" fill={skin} stroke="#e0ddd8" strokeWidth="1" transform="rotate(-10 30 185)"/>
            <ellipse cx="130" cy="185" rx="14" ry="40" fill={skin} stroke="#e0ddd8" strokeWidth="1" transform="rotate(10 130 185)"/>
            {/* Neck */}
            <rect x="70" y="110" width="20" height="20" rx="4" fill={skin}/>
            {/* Head */}
            <ellipse cx="80" cy="90" rx="36" ry="42" fill={skin}/>
            {/* Hair */}
            <ellipse cx="80" cy="58" rx="38" ry="22" fill={hair}/>
            <rect x="42" y="58" width="14" height="35" rx="7" fill={hair}/>
            <rect x="104" y="58" width="14" height="35" rx="7" fill={hair}/>
            {/* Eyes */}
            <ellipse cx="66" cy="88" rx="5" ry="6" fill="white"/>
            <ellipse cx="94" cy="88" rx="5" ry="6" fill="white"/>
            <ellipse cx="67" cy="89" rx="3" ry="4" fill="#3d2b1f"/>
            <ellipse cx="95" cy="89" rx="3" ry="4" fill="#3d2b1f"/>
            {/* Smile */}
            <path d="M68 105 Q80 115 92 105" stroke="#3d2b1f" strokeWidth="2" fill="none" strokeLinecap="round"/>
            {/* Legs */}
            <rect x="56" y="248" width="18" height="40" rx="9" fill={skin}/>
            <rect x="86" y="248" width="18" height="40" rx="9" fill={skin}/>
          </svg>

          <button
            onClick={saveLook}
            className="w-full py-2.5 bg-[#01696f] text-white text-sm rounded-xl hover:bg-[#0c4e54] transition-all"
          >
            💾 Save This Look
          </button>
        </div>

        {/* Customiser */}
        <div className="bg-white rounded-2xl border border-[#ece9e4] p-6 space-y-6">
          <p className="text-sm font-medium text-[#28251d]">Customise Avatar</p>

          <div>
            <p className="text-xs text-[#7a7974] mb-2">Skin Tone</p>
            <div className="flex gap-2 flex-wrap">
              {skinTones.map(s => (
                <button key={s} onClick={() => setSkin(s)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${skin === s ? "border-[#01696f] scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: s }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#7a7974] mb-2">Hair Color</p>
            <div className="flex gap-2 flex-wrap">
              {hairColors.map(h => (
                <button key={h} onClick={() => setHair(h)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${hair === h ? "border-[#01696f] scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: h }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#7a7974] mb-2">Outfit Color</p>
            <div className="flex gap-2 flex-wrap">
              {outfitColors.map(o => (
                <button key={o} onClick={() => setOutfit(o)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${outfit === o ? "border-[#01696f] scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: o }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Looks */}
      {savedLooks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#28251d] mb-3">Saved Looks</h3>
          <div className="flex gap-3 flex-wrap">
            {savedLooks.map(look => (
              <div key={look.id} className="bg-white rounded-xl border border-[#ece9e4] p-3 flex gap-2 items-center">
                <div className="w-5 h-5 rounded-full border border-[#dcd9d5]" style={{ backgroundColor: look.skin }}/>
                <div className="w-5 h-5 rounded-full border border-[#dcd9d5]" style={{ backgroundColor: look.hair }}/>
                <div className="w-5 h-5 rounded-full border border-[#dcd9d5]" style={{ backgroundColor: look.outfit }}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}