"use client";

import { useState, useEffect } from "react";
import { X, Edit2, Check, BookOpen, Target, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { updateUserName, saveSalahPrayers, getSalahPrayers } from "@/lib/firestore";
import { getQFAccessToken, isQFConnected, initiateQFOAuth, clearQFSession } from "@/lib/qf-user-auth";
import toast from "react-hot-toast";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { user, profile, refreshProfile } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [prayers, setPrayers] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<{ key: number; verseNumber: number }[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [qfConnected, setQFConnected] = useState(false);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setNameInput(profile?.name || "");
    const connected = isQFConnected();
    setQFConnected(connected);

    try {
      const stored = localStorage.getItem("deenquest_daily_goal");
      if (stored) setDailyGoal(parseInt(stored, 10));
    } catch {}

    getSalahPrayers(user.uid, today).then(setPrayers).catch(() => {});

    if (connected) {
      const token = getQFAccessToken();
      if (token) {
        setLoadingBookmarks(true);
        fetch("/api/qf/bookmark", { headers: { "x-qf-token": token } })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.data) setBookmarks(data.data.filter((b: { key: number; verseNumber?: number }) => b.verseNumber != null));
          })
          .catch(() => {})
          .finally(() => setLoadingBookmarks(false));
      }
    }
  }, [open, user, profile?.name, today]);

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

  function togglePrayer(prayer: string) {
    if (!user) return;
    const updated = { ...prayers, [prayer]: !prayers[prayer] };
    setPrayers(updated);
    saveSalahPrayers(user.uid, today, updated).catch(() => {});
  }

  function handleConnect() {
    initiateQFOAuth().catch(() => {});
    onClose();
  }

  function handleDisconnect() {
    clearQFSession();
    setQFConnected(false);
    setBookmarks([]);
    toast.success("Disconnected from Quran.com");
  }

  if (!open) return null;

  const prayedCount = PRAYERS.filter((p) => prayers[p]).length;

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

        <div className="p-5 space-y-5 flex-1 overflow-y-auto">

          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-secondary to-secondary-dark flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-secondary/25 shrink-0">
              {profile?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white truncate">{profile?.name}</p>
                  <button onClick={() => setEditingName(true)} className="text-white/30 hover:text-secondary transition-colors shrink-0">
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
              <p className="text-xs text-accent mt-0.5">{profile?.xp} XP · {profile?.streak} day streak</p>
            </div>
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

          {/* Today's Salah */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/40 uppercase tracking-wider">Today&apos;s Salah</p>
              <span className="text-xs text-secondary">{prayedCount}/5 prayed</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {PRAYERS.map((prayer) => (
                <button
                  key={prayer}
                  onClick={() => togglePrayer(prayer)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all ${
                    prayers[prayer]
                      ? "bg-secondary/20 border-secondary/40 text-secondary"
                      : "bg-white/5 border-white/10 text-white/30 hover:border-white/25 hover:text-white/50"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${prayers[prayer] ? "bg-secondary" : "bg-white/20"}`} />
                  <span className="text-[9px] font-medium leading-none">{prayer}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-secondary" />
              <p className="text-xs text-white/40 uppercase tracking-wider">Daily Verse Goal</p>
            </div>
            {dailyGoal ? (
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">{dailyGoal}</span>
                <span className="text-sm text-white/40 mb-1">verses / day</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white/30">
                <span className="text-sm">No goal set —</span>
                <span className="text-sm text-secondary/70">go to the Quran page to set one</span>
              </div>
            )}
          </div>

          {/* Bookmarks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-secondary" />
              <p className="text-xs text-white/40 uppercase tracking-wider">Bookmarks</p>
              {bookmarks.length > 0 && (
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full ml-auto">
                  {bookmarks.length}
                </span>
              )}
            </div>
            {!qfConnected ? (
              <p className="text-xs text-white/30 text-center py-4">Connect Quran.com to see bookmarks</p>
            ) : loadingBookmarks ? (
              <div className="flex justify-center py-4">
                <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookmarks.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">No bookmarks yet</p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {bookmarks.map((b) => (
                  <a
                    key={`${b.key}:${b.verseNumber}`}
                    href={`https://quran.com/${b.key}/${b.verseNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg glass hover:bg-white/10 transition-colors group"
                  >
                    <span className="text-sm text-white/70">Surah {b.key} : {b.verseNumber}</span>
                    <span className="text-xs text-white/25 group-hover:text-secondary transition-colors">→</span>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
