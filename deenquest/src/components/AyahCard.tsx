"use client";

import { useRef, useState } from "react";
import { BookmarkPlus, BookmarkCheck, Loader2, Volume2, PauseCircle } from "lucide-react";
import { getAyahAudio } from "@/lib/quran";

interface AyahCardProps {
  text: string;
  translation: string;
  surahName: string;
  ayahNumber: number;
  numberInSurah: number;
  verseKey?: string;
  explanation?: string;
  explanationLoading?: boolean;
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
  explanationLoading = false,
  bookmarked,
  onBookmark,
  showAudio = true,
}: AyahCardProps) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function toggleAudio() {
    // Pause if currently playing
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    // Resume if paused mid-verse
    if (!playing && audioRef.current && !audioRef.current.ended) {
      await audioRef.current.play();
      setPlaying(true);
      return;
    }

    // Fresh load
    setLoading(true);
    try {
      const key = verseKey || `${numberInSurah}`;
      const url = await getAyahAudio(key);
      if (!url) { setLoading(false); return; }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="glass-card rounded-2xl p-6 space-y-4" aria-label={`Verse ${numberInSurah} from ${surahName}`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-secondary bg-accent/15 px-3 py-1 rounded-full">
          {surahName} : {numberInSurah}
        </span>
        <div className="flex items-center gap-2">
          {showAudio && (
            <button
              onClick={toggleAudio}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-accent/10 text-secondary transition-all duration-300 disabled:opacity-50"
              aria-label={playing ? "Pause audio" : "Play audio"}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" aria-label="Loading audio" />
              ) : playing ? (
                <PauseCircle size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
          )}
          {onBookmark && (
            <button
              onClick={onBookmark}
              className="p-2 rounded-lg hover:bg-accent/10 text-secondary transition-all duration-300"
              aria-label={bookmarked ? "Bookmarked" : "Bookmark verse"}
            >
              {bookmarked ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
            </button>
          )}
        </div>
      </div>

      <p className="text-right text-xl leading-loose font-arabic text-primary" dir="rtl" translate="no">
        {text}
      </p>

      <p className="text-primary/60 text-sm leading-relaxed italic">
        &ldquo;{translation}&rdquo;
      </p>

      {explanationLoading ? (
        <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
          <div className="flex items-center gap-2 text-secondary mb-1">
            <Loader2 size={14} className="animate-spin" />
            <p className="text-xs font-medium">AI Explanation</p>
          </div>
          <p className="text-sm text-primary/75 leading-relaxed">Generating a personalized explanation...</p>
        </div>
      ) : explanation ? (
        <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
          <p className="text-xs font-medium text-secondary mb-1">AI Explanation</p>
          <p className="text-sm text-primary/75 leading-relaxed">{explanation}</p>
        </div>
      ) : null}
    </article>
  );
}
