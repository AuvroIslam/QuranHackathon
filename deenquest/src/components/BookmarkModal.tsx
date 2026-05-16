"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronDown, Folder, FolderPlus, Check } from "lucide-react";
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

const DEFAULT_ID = "__default__";
const NEW_ID = "__new__";

export default function BookmarkModal({ verseKey, surahName, arabic, translation, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<QFCollection[]>([]);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_ID);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const allOptions = [
    { id: DEFAULT_ID, label: "Default", icon: "folder" },
    ...collections.map((c) => ({ id: c.id, label: c.name, icon: "folder" })),
    { id: NEW_ID, label: "New collection…", icon: "new" },
  ];

  const selectedOption = allOptions.find((o) => o.id === selectedId) ?? allOptions[0];
  const isNew = selectedId === NEW_ID;

  function selectOption(id: string) {
    setSelectedId(id);
    setDropdownOpen(false);
    if (id !== NEW_ID) setNewName("");
  }

  async function handleSave() {
    if (!user) return;
    if (isNew && !newName.trim()) return;
    setSaving(true);
    try {
      let collectionName: string | undefined;
      let qfCollectionId: string | undefined;

      if (isNew && newName.trim()) {
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
      } else if (selectedId !== DEFAULT_ID) {
        const col = collections.find((c) => c.id === selectedId);
        collectionName = col?.name;
        qfCollectionId = selectedId;
      }

      await toggleBookmark(user.uid, { verseKey, surahName, arabic, translation, collectionName });

      if (qfConnected) {
        const token = getQFAccessToken();
        if (token) {
          const [chStr, vStr] = verseKey.split(":");
          const chapterNumber = parseInt(chStr, 10);
          const verseNumber = parseInt(vStr, 10);

          if (qfCollectionId) {
            fetch("/api/qf/collections", {
              method: "POST",
              headers: { "x-qf-token": token, "Content-Type": "application/json" },
              body: JSON.stringify({ collectionId: qfCollectionId, chapterNumber, verseNumber }),
            }).catch(() => {});
          } else {
            fetch("/api/qf/bookmark", {
              method: "POST",
              headers: { "x-qf-token": token, "Content-Type": "application/json" },
              body: JSON.stringify({ chapterNumber, verseNumber }),
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

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-dark rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white">Save Bookmark</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-white/40 mb-5">{surahName} · {verseKey}</p>

        {/* Collection label */}
        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Add to collection</p>

        {/* Dropdown selector */}
        <div className="relative mb-3" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-secondary bg-secondary/10 text-white text-sm font-medium transition-all hover:bg-secondary/15"
          >
            <div className="flex items-center gap-2.5">
              {selectedOption.icon === "new"
                ? <FolderPlus size={15} className="text-secondary shrink-0" />
                : <Folder size={15} className="text-secondary shrink-0" />}
              <span className="truncate">{selectedOption.label}</span>
            </div>
            <ChevronDown
              size={15}
              className={`text-white/40 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown list */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 glass-dark border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
              {allOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => selectOption(opt.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/8 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {opt.icon === "new"
                      ? <FolderPlus size={14} className="text-white/40 shrink-0" />
                      : <Folder size={14} className="text-white/40 shrink-0" />}
                    <span className="text-sm text-white/70 truncate">{opt.label}</span>
                  </div>
                  {opt.id === selectedId && <Check size={13} className="text-secondary shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New collection name input */}
        {isNew && (
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !saving && newName.trim() && handleSave()}
            placeholder="Collection name"
            maxLength={64}
            className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-secondary/40 mb-3"
          />
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || (isNew && !newName.trim())}
          className="w-full py-3 rounded-xl bg-secondary text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 mt-1"
        >
          {saving ? "Saving…" : "Save Bookmark"}
        </button>
      </div>
    </div>
  );
}
