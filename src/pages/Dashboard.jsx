import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const stats = [
  { label: "Clothing Items", value: "0", icon: "👗" },
  { label: "Outfits Created", value: "0", icon: "✨" },
  { label: "Looks Saved",     value: "0", icon: "🪞" },
  { label: "Fit Checks",      value: "0", icon: "📸" },
];

const quickActions = [
  { label: "Upload Clothes",   to: "/wardrobe",  icon: "➕", color: "bg-[#e8f4f4] text-[#01696f]" },
  { label: "Generate Outfit",  to: "/outfits",   icon: "✨", color: "bg-[#fef6e8] text-[#c47f00]" },
  { label: "Try Fit Check",    to: "/fitcheck",  icon: "📸", color: "bg-[#f0eaff] text-[#7a39bb]" },
  { label: "Build a Look",     to: "/looks",     icon: "🪞", color: "bg-[#fdeef4] text-[#a12c7b]" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.displayName?.split(" ")[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Welcome */}
      <div className="bg-white rounded-2xl px-6 py-6 border border-[#ece9e4] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#28251d]">Hey, {firstName} 👋</h2>
          <p className="text-sm text-[#7a7974] mt-1">What are we wearing today?</p>
        </div>
        <img
          src={user?.photoURL}
          alt="avatar"
          className="w-14 h-14 rounded-full border-2 border-[#01696f] object-cover"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl px-5 py-4 border border-[#ece9e4] flex flex-col gap-1">
            <span className="text-2xl">{icon}</span>
            <p className="text-2xl font-semibold text-[#28251d]">{value}</p>
            <p className="text-xs text-[#7a7974]">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-[#28251d] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ label, to, icon, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`${color} rounded-2xl px-4 py-4 flex flex-col items-start gap-2 font-medium text-sm hover:opacity-80 transition-all text-left`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty recent looks */}
      <div>
        <h3 className="text-sm font-semibold text-[#28251d] mb-3">Recent Looks</h3>
        <div className="bg-white rounded-2xl border border-[#ece9e4] border-dashed flex flex-col items-center justify-center py-14 gap-2">
          <span className="text-3xl">🪞</span>
          <p className="text-sm font-medium text-[#28251d]">No looks yet</p>
          <p className="text-xs text-[#7a7974]">Start by uploading clothes to your wardrobe</p>
          <button
            onClick={() => navigate("/wardrobe")}
            className="mt-3 px-4 py-2 bg-[#01696f] text-white text-xs rounded-xl hover:bg-[#0c4e54] transition-all"
          >
            Go to Wardrobe
          </button>
        </div>
      </div>

    </div>
  );
}