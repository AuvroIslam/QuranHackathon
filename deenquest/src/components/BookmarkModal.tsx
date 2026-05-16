"use client";

import { useEffect, useState } from "react";
import { X, Folder, FolderPlus } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { toggleBookmark } from "@/lib/firestore";
import { getQFAccessToken, isQFConnected } from "@/lib/qf-user-auth";

interface QFCollection { id: string; name: string }

interface Props {
  verseKey: string;
  surahName: string;
  arabic: string;
  translation: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function BookmarkModal({ verseKey, surahName, arabic, translation, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<QFCollection[]>([]);
  const [selectedId, setSelectedId] = useState<string>("default");
  const [mode, setMode] = useState<"pick" | "new">("pick");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const qfConnected = isQFConnected();

  useEffect(() => {
    if (!qfConnected) return;
    const token = getQFAccessToken();
    if (!token) return;
    fetch("/api/qf/collections", { headers: { "x-qf-token": token } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.data)) {
          setCollections(data.data.filter((c: QFCollection) => c.id && c.name));
        }
      })
      .catch(() => {});
  }, [qfConnected]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      let collectionName: string | undefined;
      let qfCollectionId: string | undefined;

      if (mode === "new" && newName.trim()) {
        collectionName = newName.trim();
        if (qfConnected) {
          const token = getQFAccessToken();
          if (token) {
            const res = await fetch("/api/qf/collections", {
              method: "POST",
              headers: { "x-qf-token": token, "Content-Type": "application/json" },
              body: JSON.stringify({ name: collectionName }),
            })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null);
            if (res?.data?.id) qfCollectionId = String(res.data.id);
          }
        }
      } else if (mode === "pick" && selectedId !== "default") {
        const col = collections.find((c) => c.id === selectedId);
        collectionName = col?.name;
        qfCollectionId = selectedId;
      }

      await toggleBookmark(user.uid, { verseKey, surahName, arabic, translation, collectionName });

      if (qfConnected) {
        const token = getQFAccessToken();
        if (token) {
          const [chStr, vStr] = verseKey.split(":");
          const bmRes = await fetch("/api/qf/bookmark", {
            method: "POST",
            headers: { "x-qf-token": token, "Content-Type": "application/json" },
            body: JSON.stringify({
              chapterNumber: parseInt(chStr, 10),
              verseNumber: parseInt(vStr, 10),
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);

          const bmId = bmRes?.data?.id ?? bmRes?.id;
          if (qfCollectionId && bmId) {
            fetch("/api/qf/collections", {
              method: "POST",
              headers: { "x-qf-token": token, "Content-Type": "application/json" },
              body: JSON.stringify({ bookmarkId: String(bmId), collectionId: qfCollectionId }),
            }).catch(() => {});
          }
        }
      }

      onSaved();
      onClose();
    } catch {
      // keep modal open on error
    } finally {
      setSaving(false);
    }
  }

  function Option({
    id,
    icon,
    label,
  }: {
    id: string;
    icon: React.ReactNode;
    label: string;
  }) {
    const active = mode === "pick" && selectedId === id;
    return (
      <button
        onClick={() => {
          setMode("pick");
          setSelectedId(id);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
          active
            ? "border-secondary bg-secondary/10 text-white"
            : "border-white/10 text-white/60 hover:bg-white/5"
        }`}
      >
        <span className={active ? "text-secondary" : "text-white/40"}>{icon}</span>
        <span className="text-sm font-medium truncate">{label}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-dark rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white">Save Bookmark</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-white/40 mb-4">
          {surahName} · {verseKey}
        </p>

        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Add to collection</p>
        <div className="space-y-2 mb-4">
          <Option id="default" icon={<Folder size={15} />} label="Default" />
          {collections.map((col) => (
            <Option key={col.id} id={col.id} icon={<Folder size={15} />} label={col.name} />
          ))}

          <button
            onClick={() => setMode("new")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
              mode === "new"
                ? "border-secondary bg-secondary/10 text-white"
                : "border-white/10 text-white/60 hover:bg-white/5"
            }`}
          >
            <span className={mode === "new" ? "text-secondary" : "text-white/40"}>
              <FolderPlus size={15} />
            </span>
            <span className="text-sm font-medium">New collection…</span>
          </button>

          {mode === "new" && (
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !saving && newName.trim() && handleSave()}
              placeholder="Collection name"
              maxLength={64}
              className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || (mode === "new" && !newName.trim())}
          className="w-full py-3 rounded-xl bg-secondary text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Bookmark"}
        </button>
      </div>
    </div>
  );
}
