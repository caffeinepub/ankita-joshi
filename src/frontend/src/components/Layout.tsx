import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Home,
  LogOut,
  Menu,
  Upload,
  User,
  Wallet,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useUserAuth } from "../hooks/useUserAuth";

interface Props {
  children: ReactNode;
}

type NavItem = {
  to: "/" | "/upload" | "/notifications" | "/wallet";
  icon: React.ElementType;
  label: string;
  badge?: number;
};

export default function Layout({ children }: Props) {
  const { logout, loggedInUser } = useUserAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/upload", icon: Upload, label: "Upload" },
    { to: "/notifications", icon: Bell, label: "Notifications", badge: 0 },
    { to: "/wallet", icon: Wallet, label: "Wallet" },
  ];

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const isProfileActive = location.pathname.startsWith("/profile");

  const goToProfile = () =>
    navigate({
      to: "/profile/$userId",
      params: { userId: loggedInUser?.id ?? "me" },
    });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 p-4 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <div>
            <h1 className="font-bold text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ANKITA JOSHI
            </h1>
            <p className="text-xs text-gray-500">Social Platform</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                isActive(to)
                  ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
              {badge != null && badge > 0 && (
                <span className="ml-auto bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          ))}
          {/* Profile nav item — uses param route */}
          <button
            type="button"
            onClick={goToProfile}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isProfileActive
                ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 border border-purple-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <User size={20} />
            <span className="font-medium">Profile</span>
          </button>
        </nav>
        <div className="border-t border-gray-800 pt-4 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
              {loggedInUser?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {loggedInUser?.name ?? "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                @{loggedInUser?.username ?? "..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <header className="md:hidden sticky top-0 z-20 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="font-bold text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ANKITA JOSHI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-gray-950/90 backdrop-blur pt-16"
            onClick={() => setMobileMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMobileMenuOpen(false);
            }}
            role="presentation"
          >
            <div className="bg-gray-900 border-b border-gray-800 p-4 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              ))}
              <button
                type="button"
                onClick={goToProfile}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <User size={20} />
                <span>Profile</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-gray-900/90 backdrop-blur border-t border-gray-800 flex items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl relative ${isActive(to) ? "text-purple-400" : "text-gray-500"}`}
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
            {badge != null && badge > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        ))}
        {/* Profile tab */}
        <button
          type="button"
          onClick={goToProfile}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl ${isProfileActive ? "text-purple-400" : "text-gray-500"}`}
        >
          <User size={22} />
          <span className="text-xs">Profile</span>
        </button>
      </nav>
    </div>
  );
}
