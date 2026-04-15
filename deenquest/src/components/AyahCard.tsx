"use client";

import { useState } from "react";
import { BookmarkPlus, BookmarkCheck, Volume2 } from "lucide-react";
import { getAyahAudio } from "@/lib/quran";

interface AyahCardProps {
  text: string;
  translation: string;
  surahName: string;
  ayahNumber: number;
  numberInSurah: number;
  verseKey?: string;
  explanation?: string;
  bookmarked?: boolean;
  onBookmark?: () => void;
  showAudio?: boolean;
}

export default function AyahCard({
  text,
  translation,
  surahName,
  ayahNumber,
  numberInSurah,
  verseKey,
  explanation,
  bookmarked,
  onBookmark,
  showAudio = true,
}: AyahCardProps) {
  const [playing, setPlaying] = useState(false);

  async function playAudio() {
    if (playing) return;
    setPlaying(true);
    try {
      const key = verseKey || `${numberInSurah}`;
      const url = await getAyahAudio(key);
      if (!url) { setPlaying(false); return; }
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch {
      setPlaying(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          {surahName} : {numberInSurah}
        </span>
        <div className="flex items-center gap-2">
          {showAudio && (
            <button
              onClick={playAudio}
              disabled={playing}
              className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors disabled:opacity-50"
            >
              <Volume2 size={18} className={playing ? "animate-pulse" : ""} />
            </button>
          )}
          {onBookmark && (
            <button
              onClick={onBookmark}
              className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
            >
              {bookmarked ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
            </button>
          )}
        </div>
      </div>

      <p className="text-right text-xl leading-loose font-arabic text-gray-800" dir="rtl" translate="no">
        {text}
      </p>

      <p className="text-gray-600 text-sm leading-relaxed italic">
        &ldquo;{translation}&rdquo;
      </p>

      {explanation && (
        <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100">
          <p className="text-xs font-medium text-emerald-700 mb-1">AI Explanation</p>
          <p className="text-sm text-gray-700 leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}
