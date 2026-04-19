import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/",          icon: "🏠", label: "Home" },
  { to: "/wardrobe",  icon: "👗", label: "Wardrobe" },
  { to: "/outfits",   icon: "✨", label: "Outfits" },
  { to: "/looks",     icon: "🪞", label: "Looks" },
  { to: "/fitcheck",  icon: "📸", label: "Fit Check" },
  { to: "/community", icon: "💬", label: "Community" },
  { to: "/profile",   icon: "👤", label: "Profile" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 h-full bg-white border-r border-[#ece9e4] flex flex-col py-6 px-4 shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-label="Wearit">
          <rect width="36" height="36" rx="10" fill="#01696f"/>
          <path d="M9 12 L13 24 L18 17 L23 24 L27 12" stroke="white" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="18" cy="9" r="2.5" fill="white"/>
        </svg>
        <span className="text-lg font-semibold text-[#28251d] tracking-tight">Wearit</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {nav.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive
                ? "bg-[#e8f4f4] text-[#01696f]"
                : "text-[#7a7974] hover:bg-[#f3f0ec] hover:text-[#28251d]"
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[#ece9e4] pt-4 mt-4">
        <div className="flex items-center gap-3 px-2">
          <img
            src={user?.photoURL}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover border border-[#dcd9d5]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#28251d] truncate">{user?.displayName}</p>
            <button
              onClick={logout}
              className="text-xs text-[#7a7974] hover:text-[#01696f] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}