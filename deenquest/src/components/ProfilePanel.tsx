"use client";

import { useState, useEffect } from "react";
import {
  X, Edit2, Check, Wifi, WifiOff, Bookmark, Flame, Zap, ClipboardCheck, Medal,
  GraduationCap, TrendingUp, Trophy, BadgeCheck, Shield, Crown, Star, LogOut,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { updateUserName, getBookmarks, getTasksCompletedCount, updateUserPlan } from "@/lib/firestore";
import type { Bookmark as BookmarkType, TimePerDay } from "@/lib/types";
import { getQFAccessToken, isQFConnected, initiateQFOAuth, clearQFSession } from "@/lib/qf-user-auth";
import toast from "react-hot-toast";

function getLevel(xp: number) {
  if (xp < 100) return { level: 1, title: "Seeker", next: 100 };
  if (xp < 300) return { level: 2, title: "Student", next: 300 };
  if (xp < 600) return { level: 3, title: "Reader", next: 600 };
  if (xp < 1000) return { level: 4, title: "Reciter", next: 1000 };
  if (xp < 1500) return { level: 5, title: "Hafidh", next: 1500 };
  return { level: 6, title: "Scholar", next: Infinity };
}

const BADGES = [
  { id: "first_lesson", label: "First Lesson", icon: GraduationCap, color: "#7C3AED", xpRequired: 10 },
  { id: "streak_3",    label: "3-Day Streak",  icon: TrendingUp,    color: "#FF6B35", streakRequired: 3 },
  { id: "xp_100",      label: "100 XP",         icon: Trophy,        color: "#F59E0B", xpRequired: 100 },
  { id: "tasks_5",     label: "5 Tasks Done",   icon: BadgeCheck,    color: "#059669", tasksRequired: 5 },
  { id: "streak_7",    label: "Week Warrior",   icon: Shield,        color: "#DC2626", streakRequired: 7 },
  { id: "xp_500",      label: "500 XP",         icon: Crown,         color: "#6D28D9", xpRequired: 500 },
] as const;

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

interface QFBookmark { key: number; verseNumber: number }

export default function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { user, profile, refreshProfile, signOut } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [localBookmarks, setLocalBookmarks] = useState<BookmarkType[]>([]);
  const [qfBookmarks, setQFBookmarks] = useState<QFBookmark[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [expandedBm, setExpandedBm] = useState<string | null>(null);
  const [qfConnected, setQFConnected] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setNameInput(profile?.name || "");
    const connected = isQFConnected();
    setQFConnected(connected);
    setLoadingBookmarks(true);

    getTasksCompletedCount(user.uid).then(setTasksCompleted).catch(() => {});

    const loads: Promise<void>[] = [
      getBookmarks(user.uid).then(setLocalBookmarks).catch(() => {}),
    ];

    if (connected) {
      const token = getQFAccessToken();
      if (token) {
        loads.push(
          fetch("/api/qf/bookmark", { headers: { "x-qf-token": token } })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data?.data) {
                setQFBookmarks(data.data.filter((b: QFBookmark) => b.verseNumber != null));
              }
            })
            .catch(() => {})
        );
      }
    }

    Promise.all(loads).finally(() => setLoadingBookmarks(false));
  }, [open, user, profile?.name]);

  async function saveName() {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateUserName(user.uid, nameInput.trim());
      await refreshProfile();
      setEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    }
    setSavingName(false);
  }

  function handleConnect() {
    initiateQFOAuth().catch(() => {});
    onClose();
  }

  function handleDisconnect() {
    clearQFSession();
    setQFConnected(false);
    setQFBookmarks([]);
    toast.success("Disconnected from Quran.com");
  }

  async function handleSignOut() {
    try { await signOut(); } catch { /* ignore */ }
  }

  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const { level, title, next } = getLevel(xp);
  const progress = next === Infinity ? 1 : xp / next;

  const earnedBadges = BADGES.filter((b) => {
    if ("xpRequired"    in b && b.xpRequired    && xp             >= b.xpRequired)    return true;
    if ("streakRequired" in b && b.streakRequired && streak         >= b.streakRequired) return true;
    if ("tasksRequired"  in b && b.tasksRequired  && tasksCompleted >= b.tasksRequired)  return true;
    return false;
  });

  const totalBookmarks = localBookmarks.length + qfBookmarks.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative md:ml-64 w-80 h-full glass-dark overflow-y-auto flex flex-col animate-fade-in border-r border-white/10">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2 className="font-semibold text-white">Profile</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">

          {/* Avatar + Name + Level */}
          <div className="glass rounded-2xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-secondary to-secondary-dark flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-secondary/25 shrink-0">
              {profile?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="flex-1 min-w-0 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <button onClick={saveName} disabled={savingName} className="text-secondary hover:text-white transition-colors shrink-0">
                    <Check size={15} />
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-white/40 hover:text-white transition-colors shrink-0">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-white truncate">{profile?.name}</p>
                  <button onClick={() => setEditingName(true)} className="text-white/30 hover:text-secondary transition-colors shrink-0">
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 bg-secondary/30 text-secondary text-[11px] font-bold px-2 py-0.5 rounded-full">
                  <Star size={9} fill="currentColor" /> Lv {level}
                </span>
                <span className="text-xs text-white/50">{title}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
              </div>
              <p className="text-[10px] text-white/35 mt-1">{xp.toLocaleString()} / {next === Infinity ? "∞" : next.toLocaleString()} XP</p>
            </div>
          </div>

          {/* 4-stat row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <Flame size={16} className="text-orange-400" fill="currentColor" />, value: streak,          label: "Streak",  accent: "text-orange-400", bg: "bg-orange-400/10" },
              { icon: <Zap   size={16} className="text-secondary"  fill="currentColor" />, value: xp,             label: "XP",      accent: "text-secondary",  bg: "bg-secondary/10"  },
              { icon: <ClipboardCheck size={16} className="text-emerald-400" />,           value: tasksCompleted, label: "Tasks",   accent: "text-emerald-400", bg: "bg-emerald-400/10" },
              { icon: <Medal size={16} className="text-indigo-400" />,                     value: earnedBadges.length, label: "Badges", accent: "text-indigo-400", bg: "bg-indigo-400/10" },
            ].map(({ icon, value, label, bg }) => (
              <div key={label} className="glass rounded-xl py-3 flex flex-col items-center gap-1.5 relative overflow-hidden">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
                <span className="text-white font-bold text-base leading-none">{value}</span>
                <span className="text-white/35 text-[9px] font-semibold uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>

          {/* Quran.com */}
          <div className="glass rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {qfConnected
                ? <Wifi size={14} className="text-secondary" />
                : <WifiOff size={14} className="text-white/30" />}
              <span className="text-sm text-white/70">Quran.com</span>
              {qfConnected && <span className="text-xs text-secondary/70">Connected</span>}
            </div>
            {qfConnected ? (
              <button onClick={handleDisconnect} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Disconnect
              </button>
            ) : (
              <button onClick={handleConnect} className="text-xs px-3 py-1 bg-secondary text-white rounded-lg hover:brightness-110 transition-all">
                Connect
              </button>
            )}
          </div>

          {/* Badges */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3 px-0.5">Your Badges</p>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.map((b) => {
                const earned = earnedBadges.some((e) => e.id === b.id);
                const Icon = b.icon;
                return (
                  <div key={b.id} className={`glass rounded-xl py-3 px-2 flex flex-col items-center gap-2 transition-opacity ${earned ? "opacity-100" : "opacity-40"}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: earned ? `${b.color}22` : "#ffffff10" }}>
                      <Icon size={20} color={earned ? b.color : "#9D99CC"} />
                    </div>
                    <span className="text-[10px] text-white/70 font-semibold text-center leading-tight">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bookmarks */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-0.5">
              <Bookmark size={14} className="text-secondary" />
              <p className="text-xs text-white/40 uppercase tracking-wider">Bookmarks</p>
              {totalBookmarks > 0 && (
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full ml-auto">
                  {totalBookmarks}
                </span>
              )}
            </div>
            {loadingBookmarks ? (
              <div className="flex justify-center py-4">
                <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : totalBookmarks === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">No bookmarks yet — tap the bookmark icon on any ayah</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {localBookmarks.map((b) => (
                  <div key={b.id} className="rounded-xl glass overflow-hidden">
                    <button
                      onClick={() => setExpandedBm(expandedBm === b.id ? null : b.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Bookmark size={11} className="text-secondary shrink-0" />
                        <span className="text-sm text-white/80 truncate">{b.surahName} · {b.verseKey}</span>
                      </div>
                      <span className="text-xs text-white/25 shrink-0 ml-2">{expandedBm === b.id ? "▲" : "▼"}</span>
                    </button>
                    {expandedBm === b.id && (
                      <div className="px-3 pb-3 space-y-2 border-t border-white/8">
                        <p className="text-right text-lg leading-loose text-white font-arabic pt-2" dir="rtl">{b.arabic}</p>
                        <p className="text-xs text-white/55 italic leading-relaxed">"{b.translation}"</p>
                      </div>
                    )}
                  </div>
                ))}
                {qfConnected && qfBookmarks.map((b) => (
                  <a
                    key={`qf-${b.key}-${b.verseNumber}`}
                    href={`https://quran.com/${b.key}/${b.verseNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl glass hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-secondary bg-secondary/15 px-1.5 py-0.5 rounded">QF</span>
                      <span className="text-sm text-white/70">Surah {b.key} : {b.verseNumber}</span>
                    </div>
                    <span className="text-xs text-white/25 group-hover:text-secondary transition-colors">↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors text-sm"
          >
            <LogOut size={15} />
            Sign Out
          </button>

        </div>
      </div>
    </div>
  );
}
