"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const MOODS = [
  { key: "sad", label: "Sad", color: "bg-white/20 text-primary/70 border-white/25 hover:bg-white/35" },
  { key: "anxious", label: "Anxious", color: "bg-white/20 text-primary/70 border-white/25 hover:bg-white/35" },
  { key: "grateful", label: "Grateful", color: "bg-white/20 text-primary/70 border-white/25 hover:bg-white/35" },
  { key: "hopeful", label: "Hopeful", color: "bg-white/20 text-primary/70 border-white/25 hover:bg-white/35" },
  { key: "angry", label: "Angry", color: "bg-white/20 text-primary/70 border-white/25 hover:bg-white/35" },
  { key: "lost", label: "Lost", color: "bg-white/20 text-primary/70 border-white/25 hover:bg-white/35" },
  { key: "happy", label: "Happy", color: "bg-white/20 text-primary/70 border-white/25 hover:bg-white/35" },
  { key: "lonely", label: "Lonely", color: "bg-white/20 text-primary/70 border-white/25 hover:bg-white/35" },
];

interface MoodSelectorProps {
  onSelect: (mood: string) => void;
  onCustomSituation?: (text: string) => void;
  selected?: string;
  loading?: boolean;
}

export default function MoodSelector({ onSelect, onCustomSituation, selected, loading }: MoodSelectorProps) {
  const [situation, setSituation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!situation.trim() || !onCustomSituation) return;
    onCustomSituation(situation.trim());
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-primary/70 mb-3">How are you feeling today?</h3>
      <div className="flex flex-wrap gap-2">
        {MOODS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all disabled:opacity-50 backdrop-blur-sm ${
              selected === key ? "ring-2 ring-offset-1 ring-accent scale-105" : ""
            } ${color}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-xs text-primary/45 mb-2">Or describe your situation for a personalized ayah</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/35" />
            <input
              type="text"
              placeholder="e.g. I lost a loved one and feel empty..."
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              disabled={loading}
              className="w-full pl-9 pr-4 py-2.5 bg-white/25 border border-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 disabled:opacity-50 placeholder:text-primary/35 transition-all duration-300"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !situation.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-secondary/20"
          >
            Find Ayah
          </button>
        </form>
      </div>
    </div>
  );
}
