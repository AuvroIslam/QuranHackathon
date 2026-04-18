"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  Home,
  CheckSquare,
  MessageCircle,
  Users,
  Moon,
  Trophy,
  LogOut,
  Menu,
  X,
  Headphones,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/levels", label: "Levels", icon: Trophy },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/listen", label: "Listen", icon: Headphones },
  { href: "/dawah", label: "Dawah", icon: Moon },
  { href: "/community", label: "Community", icon: Users },
  { href: "/chatbot", label: "Ask AI", icon: MessageCircle },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 glass-dark flex-col z-40 rounded-r-2xl">
        <div className="p-6 border-b border-white/10">
          <h1 className="brand-title font-heading text-[2rem] font-bold tracking-normal">DeenQuest AI</h1>
          <p className="text-sm text-white/85 mt-2">Your Journey Back to the Quran</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-white/15 text-white shadow-lg shadow-black/25"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-secondary to-secondary-dark flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-secondary/25">
              {profile?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.name}</p>
              <p className="text-xs text-accent">{profile?.xp} XP</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full px-2"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 glass-dark flex items-center justify-between px-4 z-40">
        <h1 className="brand-title font-heading text-2xl font-bold tracking-normal">DeenQuest AI</h1>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-300">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-64 glass-dark p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-accent">Menu</span>
              <button onClick={() => setMenuOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    pathname === href
                      ? "bg-accent/15 text-accent"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 px-4"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-dark rounded-t-2xl flex items-center justify-around z-40">
        {NAV_ITEMS.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                active ? "text-accent" : "text-slate-400"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
