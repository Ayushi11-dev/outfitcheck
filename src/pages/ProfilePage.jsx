import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const styleVibes = ["Minimalist", "Boho", "Streetwear", "Formal", "Cottagecore", "Y2K", "Old Money", "Sporty"];
const bodyTypes = ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"];
const occasions = ["Daily Casual", "Work/Office", "Evening Out", "Gym", "Festivals", "Travel"];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [selectedVibes, setSelectedVibes] = useState(["Minimalist"]);
  const [bodyType, setBodyType] = useState("Hourglass");
  const [selectedOccasions, setSelectedOccasions] = useState(["Daily Casual"]);
  const [saved, setSaved] = useState(false);

  const toggleVibe = (v) => setSelectedVibes(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleOccasion = (o) => setSelectedOccasions(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-[#ece9e4] p-6 flex items-center gap-5">
        <img src={user?.photoURL} alt="profile" className="w-16 h-16 rounded-full border-2 border-[#01696f] object-cover" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[#28251d]">{user?.displayName}</h2>
          <p className="text-sm text-[#7a7974]">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-[#e8f4f4] text-[#01696f] px-2 py-0.5 rounded-full">Style Profile Active</span>
        </div>
        <button onClick={logout} className="text-xs text-[#7a7974] border border-[#dcd9d5] px-3 py-2 rounded-xl hover:bg-[#f7f6f2] transition-all">
          Sign out
        </button>
      </div>

      {/* Style Vibe */}
      <div className="bg-white rounded-2xl border border-[#ece9e4] p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-[#28251d]">Your Style Vibe</p>
          <p className="text-xs text-[#7a7974]">Select all that match your aesthetic</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {styleVibes.map(v => (
            <button key={v} onClick={() => toggleVibe(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${selectedVibes.includes(v) ? "bg-[#01696f] text-white" : "bg-[#f3f0ec] text-[#7a7974] hover:bg-[#e8f4f4]"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Body Type */}
      <div className="bg-white rounded-2xl border border-[#ece9e4] p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-[#28251d]">Body Type</p>
          <p className="text-xs text-[#7a7974]">Helps AI suggest the most flattering outfits</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {bodyTypes.map(b => (
            <button key={b} onClick={() => setBodyType(b)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${bodyType === b ? "bg-[#01696f] text-white" : "bg-[#f3f0ec] text-[#7a7974] hover:bg-[#e8f4f4]"}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Occasions */}
      <div className="bg-white rounded-2xl border border-[#ece9e4] p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-[#28251d]">Occasions I Dress For</p>
          <p className="text-xs text-[#7a7974]">AI will prioritize these when generating outfits</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {occasions.map(o => (
            <button key={o} onClick={() => toggleOccasion(o)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${selectedOccasions.includes(o) ? "bg-[#01696f] text-white" : "bg-[#f3f0ec] text-[#7a7974] hover:bg-[#e8f4f4]"}`}>
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button onClick={save}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-all
          ${saved ? "bg-[#e8f4f4] text-[#01696f]" : "bg-[#01696f] text-white hover:bg-[#0c4e54]"}`}>
        {saved ? "✅ Preferences Saved!" : "Save Preferences"}
      </button>
    </div>
  );
}