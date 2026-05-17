"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  Home,
  MessageCircle,
  Users,
  Moon,
  LogOut,
  Menu,
  X,
  Flame,
  BookOpen,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import ProfilePanel from "./ProfilePanel";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/listen", label: "Quran", icon: BookOpen },
  { href: "/dawah", label: "Dawah", icon: Moon },
  { href: "/community", label: "Community", icon: Users },
  { href: "/chatbot", label: "Ask AI", icon: MessageCircle },
  { href: "/download", label: "Get App", icon: Smartphone },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 glass-dark flex-col z-40 rounded-r-2xl">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <Image src="/deenQuestLogo.png" alt="DeenQuest" width={36} height={36} className="rounded-xl" />
          <h1 className="brand-title font-heading text-[1.6rem] font-bold tracking-normal">DeenQuest</h1>
        </div>
        <p className="text-sm text-white/70 mt-1">Your Journey Back to the Quran</p>
      </div>
      <div className="flex-1 p-6 flex flex-col gap-6">
        <p className="text-sm text-white/55 leading-relaxed">
          A gamified Quran companion that helps you rebuild a daily habit of reading, listening, and reflecting, one ayah at a time.
        </p>
        <div className="space-y-4">
          {[
            { icon: Flame, label: "Daily streaks & bonus deeds" },
            { icon: BookOpen, label: "Learn or complete the Quran" },
            { icon: MessageCircle, label: "AI Islamic guidance" },
            { icon: Users, label: "Community reflections" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-accent" />
              </div>
              <p className="text-sm text-white/60">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 glass-dark flex-col z-40 rounded-r-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <Image src="/deenQuestLogo.png" alt="DeenQuest" width={36} height={36} className="rounded-xl" />
            <h1 className="brand-title font-heading text-[1.6rem] font-bold tracking-normal">DeenQuest</h1>
          </div>
          <p className="text-sm text-white/85 mt-1">Your Journey Back to the Quran</p>
        </div>

        <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const isDownload = href === "/download";
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isDownload
                    ? active
                      ? "bg-accent/20 text-accent shadow-lg shadow-accent/15"
                      : "text-accent/80 hover:bg-accent/15 hover:text-accent"
                    : active
                    ? "bg-white/15 text-white shadow-lg shadow-black/25"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-3 mb-3 w-full hover:bg-white/5 rounded-xl p-1.5 -mx-1.5 transition-colors group"
            aria-label={`Open profile for ${profile?.name}`}
          >
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-secondary to-secondary-dark flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-secondary/25 shrink-0">
              {profile?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">{profile?.name}</p>
              <p className="text-xs text-accent">{profile?.xp} XP</p>
            </div>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full px-2"
            aria-label="Sign out of DeenQuest"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
        <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
      </aside>

      {/* Mobile top bar */}
      <header className="mobile-header md:hidden fixed top-0 left-0 right-0 h-14 glass-dark flex items-center justify-between px-4 z-40" style={{ background: "rgba(12, 14, 42, 0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          <Image src="/deenQuestLogo.png" alt="DeenQuest" width={28} height={28} className="rounded-lg" />
          <h1 className="brand-title font-heading text-2xl font-bold tracking-normal">DeenQuest</h1>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-slate-300"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            id="mobile-menu"
            className="absolute right-0 top-0 bottom-0 w-64 glass-dark p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-accent">Menu</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <nav className="space-y-1" aria-label="Mobile navigation">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isDownload = href === "/download";
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={pathname === href ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname === href
                        ? isDownload
                          ? "bg-accent/20 text-accent"
                          : "bg-accent/15 text-accent"
                        : isDownload
                        ? "text-accent/70 hover:bg-accent/10"
                        : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-dark rounded-t-2xl flex items-center justify-around z-40" aria-label="Bottom navigation">
        {NAV_ITEMS.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                active ? "text-accent" : "text-slate-400"
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
