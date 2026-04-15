"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const MOODS = [
  { key: "sad", label: "Sad", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { key: "anxious", label: "Anxious", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { key: "grateful", label: "Grateful", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { key: "hopeful", label: "Hopeful", color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
  { key: "angry", label: "Angry", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  { key: "lost", label: "Lost", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  { key: "happy", label: "Happy", color: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" },
  { key: "lonely", label: "Lonely", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
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
      <h3 className="text-sm font-medium text-gray-700 mb-3">How are you feeling today?</h3>
      <div className="flex flex-wrap gap-2">
        {MOODS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all disabled:opacity-50 ${
              selected === key ? "ring-2 ring-offset-1 ring-emerald-400 scale-105" : ""
            } ${color}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">Or describe your situation for a personalized ayah</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="e.g. I lost a loved one and feel empty..."
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              disabled={loading}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !situation.trim()}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            Find Ayah
          </button>
        </form>
      </div>
    </div>
  );
}
