"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import {
  completeSession,
  updateQuranProgress,
  incrementCurrentDay,
} from "@/lib/firestore";
import { getLesson } from "@/lib/lessons-data";
import { getStreakStatus } from "@/lib/streakUtils";
import {
  CheckCircle2, Loader2, Volume2, X, Star, Flame,
  Play, Pause,
} from "lucide-react";
import toast from "react-hot-toast";

const SESSION_IN_PROGRESS_KEY = "deenquest_session_in_progress";

type Phase = "loading" | "session" | "complete";

interface AyahData {
  surahNumber: number;
  ayahNumber: number;
  arabic: string;
  transliteration: string;
  translation: string;
  audioUrl: string;
  read: boolean;
}

function pad3(n: number) { return String(n).padStart(3, "0"); }
function stripHtml(html: string) {
  return html.replace(/<sup[^>]*>.*?<\/sup>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function levelToKey(level: string | null | undefined): "beginner" | "intermediate" | "fluent" {
  if (level === "newbie") return "beginner";
  if (level === "fluent") return "fluent";
  return "intermediate";
}

export default function SessionPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [mcqAnswer, setMcqAnswer] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [newStreak, setNewStreak] = useState(0);
  const [xpGained] = useState(20);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isLearn = profile?.goal === "learn";
  const timePerDay = profile?.timePerDay ?? 5;
  const ayahCount = Math.max(3, timePerDay);

  const lesson = isLearn
    ? getLesson(levelToKey(profile?.level), profile?.currentDay ?? 1)
    : null;

  useEffect(() => {
    if (!profile) return;
    if (isLearn) {
      sessionStorage.setItem(SESSION_IN_PROGRESS_KEY, "true");
      setPhase("session");
      return;
    }
    const start = profile.quranProgress ?? { surahNumber: 1, ayahNumber: 1 };
    loadAyahs(start.surahNumber, start.ayahNumber, ayahCount);
  }, [profile]);

  async function loadAyahs(startSurah: number, startAyah: number, count: number) {
    setPhase("loading");
    try {
      const params = new URLSearchParams({
        path: `verses/by_chapter/${startSurah}`,
        fields: "text_uthmani",
        translations: "57,20",
        per_page: "300",
      });
      const res = await fetch(`/api/quran?${params}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const verses: any[] = data?.verses ?? [];
      const total = verses.length;
      const safeStart = Math.max(1, Math.min(startAyah, total));
      const slice = verses.slice(safeStart - 1, safeStart - 1 + count);

      const loaded: AyahData[] = slice.map((v: any) => {
        const [s, a] = (v.verse_key as string).split(":").map(Number);
        return {
          surahNumber: s,
          ayahNumber: a,
          arabic: v.text_uthmani as string,
          transliteration: stripHtml(v.translations?.find((t: any) => t.resource_id === 57)?.text ?? ""),
          translation: stripHtml(v.translations?.find((t: any) => t.resource_id === 20)?.text ?? ""),
          audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${pad3(s)}${pad3(a)}.mp3`,
          read: false,
        };
      });

      setAyahs(loaded);
      sessionStorage.setItem(SESSION_IN_PROGRESS_KEY, "true");
      setPhase("session");
    } catch {
      toast.error("Failed to load ayahs");
      setPhase("session");
    }
  }

  function playLearnAudio(url: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    }
  }

  async function handleComplete(readCount?: number) {
    if (!user || completing) return;
    setCompleting(true);
    try {
      const streakStatus = getStreakStatus(profile?.lastSessionDate, profile?.streak ?? 0);
      const isRecoveryComplete = streakStatus.status === "recovery";

      if (!isLearn && ayahs.length > 0) {
        const last = ayahs[ayahs.length - 1];
        await updateQuranProgress(user.uid, last.surahNumber, last.ayahNumber + 1);
      }
      if (isLearn) {
        await incrementCurrentDay(user.uid);
      }

      const result = await completeSession(user.uid, isRecoveryComplete);
      setNewStreak(result.newStreak);
      await refreshProfile();
      sessionStorage.removeItem(SESSION_IN_PROGRESS_KEY);
      setPhase("complete");
    } catch {
      toast.error("Failed to save session");
      setCompleting(false);
    }
  }

  function handleExit() {
    // keep in-progress flag set so home shows "Continue"
    router.push("/");
  }

  if (!profile || phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <Image
            src="/celebrating-removebg-preview.png"
            alt="Celebrating"
            width={160}
            height={180}
            className="mx-auto object-contain drop-shadow-lg"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-white">Session Complete!</h1>
            <p className="text-white/55 mt-1 text-sm">
              {isLearn
                ? `Day ${profile.currentDay ?? 1} lesson done. Keep it up!`
                : "Keep reading — every ayah counts."}
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <div className="glass-card rounded-2xl px-5 py-4 text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Star size={14} className="text-yellow-400" />
                <span className="text-xs text-white/50">XP Earned</span>
              </div>
              <p className="text-xl font-extrabold text-white">+{xpGained}</p>
            </div>
            <div className="glass-card rounded-2xl px-5 py-4 text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Flame size={14} className="text-orange-400" />
                <span className="text-xs text-white/50">Streak</span>
              </div>
              <p className="text-xl font-extrabold text-white">{newStreak} days</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all"
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hidden audio element for learn mode */}
      <audio ref={audioRef} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button onClick={handleExit} className="text-white/50 hover:text-white transition-colors">
          <X size={22} />
        </button>
        <p className="text-sm font-semibold text-white/70">
          {isLearn ? `Day ${profile.currentDay ?? 1} Lesson` : `Today's Reading`}
        </p>
        <div className="w-6" />
      </div>

      {/* Session content */}
      <div className="flex-1 overflow-y-auto">
        {isLearn && lesson ? (
          <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
            <LearnSession
              lesson={lesson}
              mcqAnswer={mcqAnswer}
              onMcqAnswer={setMcqAnswer}
              onPlayAudio={playLearnAudio}
            />
            <div className="mt-6">
              <button
                onClick={() => handleComplete()}
                disabled={completing || mcqAnswer === null}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
              >
                {completing
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Saving...</span>
                  : "Complete Lesson"}
              </button>
            </div>
          </div>
        ) : (
          <ReadSession
            ayahs={ayahs}
            completing={completing}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}

// ─── Read Session (Complete Quran goal) ──────────────────────────────────────

function ReadSession({
  ayahs,
  completing,
  onComplete,
}: {
  ayahs: AyahData[];
  completing: boolean;
  onComplete: () => void;
}) {
  const [readSet, setReadSet] = useState<Set<number>>(new Set());
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefs = useRef<(HTMLDivElement | null)[]>([]);

  const markRead = useCallback((index: number) => {
    setReadSet((prev) => new Set(prev).add(index));
  }, []);

  const startPlaying = useCallback((index: number) => {
    if (!audioRef.current || index < 0 || index >= ayahs.length) return;
    const audio = audioRef.current;
    audio.pause();
    audio.src = ayahs[index].audioUrl;
    setPlayingIndex(index);
    setIsPlaying(true);
    audio.play().catch(() => setIsPlaying(false));

    // scroll into view
    setTimeout(() => {
      ayahRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [ayahs]);

  // Auto-advance when audio ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      setPlayingIndex((idx) => {
        if (idx === null) return null;
        markRead(idx);
        const next = idx + 1;
        if (next < ayahs.length) {
          setTimeout(() => startPlaying(next), 300);
          return next;
        }
        setIsPlaying(false);
        return null;
      });
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [ayahs.length, markRead, startPlaying]);

  function handleGlobalPlayPause() {
    if (!audioRef.current) return;
    if (playingIndex !== null) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    const firstUnread = ayahs.findIndex((_, i) => !readSet.has(i));
    startPlaying(firstUnread >= 0 ? firstUnread : 0);
  }

  function handleAyahPlayPause(index: number) {
    if (!audioRef.current) return;
    if (playingIndex === index) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    startPlaying(index);
  }

  if (ayahs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-white/40 text-sm">Loading ayahs…</p>
      </div>
    );
  }

  const allRead = readSet.size === ayahs.length;
  const readCount = readSet.size;

  return (
    <div className="flex flex-col">
      <audio ref={audioRef} />

      {/* Sticky play bar */}
      <div className="sticky top-0 z-10 glass-dark border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/40 truncate">
            {ayahs[0]?.surahNumber ? `Surah ${ayahs[0].surahNumber}` : ""}
            {" · "}Ayah {ayahs[0]?.ayahNumber}–{ayahs[ayahs.length - 1]?.ayahNumber}
          </p>
          {/* Read progress bar */}
          <div className="flex gap-1 mt-1.5">
            {ayahs.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  readSet.has(i) ? "bg-accent" : playingIndex === i ? "bg-accent/50 animate-pulse" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleGlobalPlayPause}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            playingIndex !== null && isPlaying
              ? "bg-accent border-accent shadow-lg shadow-accent/30"
              : "bg-accent/15 border-accent/40 hover:bg-accent/25"
          }`}
        >
          {playingIndex !== null && isPlaying
            ? <Pause size={18} className="text-white" fill="white" />
            : <Play size={18} className="text-accent" fill="currentColor" />}
        </button>
      </div>

      {/* Ayah list */}
      <div className="p-4 md:p-6 max-w-2xl mx-auto w-full space-y-4">
        {ayahs.map((ayah, i) => {
          const isRead = readSet.has(i);
          const isActive = playingIndex === i;
          return (
            <div
              key={`${ayah.surahNumber}:${ayah.ayahNumber}`}
              ref={(el) => { ayahRefs.current[i] = el; }}
              className={`rounded-2xl border p-5 transition-all ${
                isRead
                  ? "bg-accent/15 border-accent/30"
                  : isActive
                  ? "glass-card border-accent/50 shadow-lg shadow-accent/10"
                  : "glass-card border-white/15"
              }`}
            >
              {/* Ayah header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isRead ? "bg-accent/25 text-accent" : "bg-white/10 text-white/50"
                }`}>
                  {isRead ? <CheckCircle2 size={16} className="text-accent" /> : ayah.ayahNumber}
                </div>
                <button
                  onClick={() => handleAyahPlayPause(i)}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                    isActive && isPlaying
                      ? "bg-accent border-accent text-white"
                      : "border-white/20 text-white/50 hover:border-accent/50 hover:text-accent"
                  }`}
                >
                  {isActive && isPlaying
                    ? <Pause size={14} fill="currentColor" />
                    : <Play size={14} fill="currentColor" />}
                </button>
              </div>

              {/* Arabic */}
              <p className="text-right text-2xl leading-loose text-white font-arabic mb-3" dir="rtl">
                {ayah.arabic}
              </p>

              {/* Transliteration */}
              {ayah.transliteration && (
                <p className="text-center text-xs text-white/40 italic mb-2">{ayah.transliteration}</p>
              )}

              {/* Translation */}
              <p className="text-sm text-white/65 leading-relaxed">{ayah.translation}</p>

              {/* Mark as read (manual) */}
              {!isRead && (
                <button
                  onClick={() => markRead(i)}
                  className="mt-3 text-xs font-semibold text-white/35 hover:text-accent transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 size={12} />
                  Mark as read
                </button>
              )}
            </div>
          );
        })}

        {/* Complete button */}
        <div className="pt-2 pb-6">
          <button
            onClick={onComplete}
            disabled={completing}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all ${
              !allRead ? "opacity-70" : ""
            } disabled:opacity-40`}
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
          >
            {completing
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Saving...</span>
              : allRead
              ? "Complete Session"
              : `Complete Session · ${readCount}/${ayahs.length} read`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Learn Session ────────────────────────────────────────────────────────────

function LearnSession({
  lesson,
  mcqAnswer,
  onMcqAnswer,
  onPlayAudio,
}: {
  lesson: ReturnType<typeof getLesson>;
  mcqAnswer: number | null;
  onMcqAnswer: (i: number) => void;
  onPlayAudio: (url: string) => void;
}) {
  const [audioPlaying, setAudioPlaying] = useState(false);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-white/40 text-sm">No lesson available for today.</p>
      </div>
    );
  }

  const { learnContent, mcq } = lesson;
  const answered = mcqAnswer !== null;
  const correct = mcqAnswer === mcq.correctIndex;

  function handlePlay() {
    onPlayAudio(learnContent.audioUrl);
    setAudioPlaying(true);
    setTimeout(() => setAudioPlaying(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">{lesson.focus}</p>
        <h2 className="text-xl font-extrabold text-white">{lesson.title}</h2>
        <p className="text-sm text-white/50 mt-1">{lesson.subtitle}</p>
      </div>

      {/* Ayah card */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-accent font-semibold">{learnContent.reference}</span>
          <button
            onClick={handlePlay}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
              audioPlaying ? "bg-accent border-accent" : "border-white/20 text-white/50 hover:border-accent/50 hover:text-accent"
            }`}
          >
            {audioPlaying
              ? <Volume2 size={14} className="text-white" />
              : <Play size={14} className="text-accent" fill="currentColor" />}
          </button>
        </div>
        <p className="text-right text-2xl leading-loose text-white font-arabic mb-2" dir="rtl">
          {learnContent.arabic}
        </p>
        <p className="text-sm text-white/55 italic mb-1 text-center">{learnContent.transliteration}</p>
        <p className="text-sm text-white/70">{learnContent.translation}</p>
      </div>

      {/* Explanation */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/75 leading-relaxed">{learnContent.explanation}</p>
      </div>

      {/* Action */}
      <div className="rounded-2xl border border-accent/20 bg-accent/8 p-4">
        <p className="text-xs font-bold text-accent mb-1 uppercase tracking-wide">Today&apos;s Action</p>
        <p className="text-sm text-white/70">{lesson.actionText}</p>
      </div>

      {/* MCQ */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">{mcq.question}</p>
        <div className="space-y-2">
          {mcq.options.map((opt, i) => {
            let cls = "glass border-white/15 hover:border-accent/40 cursor-pointer";
            if (answered) {
              if (i === mcq.correctIndex) cls = "bg-green-500/20 border-green-500/50 cursor-default";
              else if (i === mcqAnswer) cls = "bg-red-500/20 border-red-500/50 cursor-default";
              else cls = "glass border-white/10 opacity-40 cursor-default";
            }
            return (
              <button
                key={i}
                onClick={() => !answered && onMcqAnswer(i)}
                disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${cls}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={answered && i === mcq.correctIndex ? "text-green-300 font-semibold" : "text-white/80"}>
                    {opt}
                  </span>
                  {answered && i === mcq.correctIndex && (
                    <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {answered && (
          <p className={`text-sm font-semibold mt-1 ${correct ? "text-green-400" : "text-red-400"}`}>
            {correct ? "Correct! Well done." : `Not quite — the answer is: ${mcq.options[mcq.correctIndex]}`}
          </p>
        )}
      </div>
    </div>
  );
}
