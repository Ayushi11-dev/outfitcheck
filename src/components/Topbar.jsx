import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const titles = {
  "/":          { title: "Home",      sub: "Welcome back" },
  "/wardrobe":  { title: "Wardrobe",  sub: "Your clothing collection" },
  "/outfits":   { title: "Outfits",   sub: "AI-generated combinations" },
  "/looks":     { title: "Looks",     sub: "Full styled looks" },
  "/fitcheck":  { title: "Fit Check", sub: "Rate your outfit instantly" },
  "/community": { title: "Community", sub: "Connect with other users" },
  "/profile":   { title: "Profile",   sub: "Your style identity" },
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { title, sub } = titles[pathname] || titles["/"];

  return (
    <header className="bg-white border-b border-[#ece9e4] px-6 py-4 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-semibold text-[#28251d]">{title}</h1>
        <p className="text-xs text-[#7a7974]">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search clothes, looks..."
            className="text-sm bg-[#f7f6f2] border border-[#dcd9d5] rounded-xl px-4 py-2 w-56 focus:outline-none focus:border-[#01696f] transition-colors placeholder:text-[#bab9b4]"
          />
        </div>
        <img
          src={user?.photoURL}
          alt="user"
          className="w-8 h-8 rounded-full border border-[#dcd9d5] object-cover"
        />
      </div>
    </header>
  );
}