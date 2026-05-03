"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import {
  completeSession,
  updateQuranProgress,
  incrementCurrentDay,
} from "@/lib/firestore";
import { getLesson } from "@/lib/lessons-data";
import { getAyahByKey } from "@/lib/quran";
import { getStreakStatus } from "@/lib/streakUtils";
import {
  ChevronRight, CheckCircle2, Loader2, Volume2, X, Star, Flame,
} from "lucide-react";
import toast from "react-hot-toast";

const AYAHS_PER_MINUTE = 1;

type Phase = "loading" | "session" | "complete";

interface AyahData {
  surahNumber: number;
  ayahNumber: number;
  arabic: string;
  translation: string;
  verseKey: string;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mcqAnswer, setMcqAnswer] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [newStreak, setNewStreak] = useState(0);
  const [xpGained] = useState(20);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isLearn = profile?.goal === "learn";
  const timePerDay = profile?.timePerDay ?? 5;
  const ayahCount = Math.max(3, timePerDay * AYAHS_PER_MINUTE);

  const lesson = isLearn
    ? getLesson(levelToKey(profile?.level), profile?.currentDay ?? 1)
    : null;

  useEffect(() => {
    if (!profile) return;
    if (isLearn) {
      setPhase("session");
      return;
    }

    const start = profile.quranProgress ?? { surahNumber: 1, ayahNumber: 1 };
    loadAyahs(start.surahNumber, start.ayahNumber, ayahCount);
  }, [profile]);

  async function loadAyahs(startSurah: number, startAyah: number, count: number) {
    setPhase("loading");
    const loaded: AyahData[] = [];
    let surah = startSurah;
    let ayah = startAyah;

    for (let i = 0; i < count; i++) {
      try {
        const data = await getAyahByKey(surah, ayah);
        loaded.push({
          surahNumber: surah,
          ayahNumber: ayah,
          arabic: data.text,
          translation: data.translation,
          verseKey: data.verseKey,
        });
        ayah++;
      } catch {
        break;
      }
    }

    setAyahs(loaded);
    setPhase("session");
  }

  function playAudio(url: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    }
  }

  async function handleComplete() {
    if (!user || completing) return;
    setCompleting(true);

    try {
      const streakStatus = getStreakStatus(profile?.lastSessionDate, profile?.streak ?? 0);
      const isRecoveryComplete =
        streakStatus.status === "recovery"
          ? true
          : false;

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
      setPhase("complete");
    } catch {
      toast.error("Failed to save session");
      setCompleting(false);
    }
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
      <audio ref={audioRef} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button onClick={() => router.push("/")} className="text-white/50 hover:text-white transition-colors">
          <X size={22} />
        </button>
        <p className="text-sm font-semibold text-white/70">
          {isLearn ? `Day ${profile.currentDay ?? 1} Lesson` : `Today's Reading`}
        </p>
        <div className="w-6" />
      </div>

      {/* Session content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full">
        {isLearn && lesson ? (
          <LearnSession
            lesson={lesson}
            mcqAnswer={mcqAnswer}
            onMcqAnswer={setMcqAnswer}
            onPlayAudio={playAudio}
          />
        ) : (
          <ReadSession
            ayahs={ayahs}
            currentIndex={currentIndex}
            onNext={() => setCurrentIndex((i) => Math.min(i + 1, ayahs.length - 1))}
            onPlayAudio={playAudio}
          />
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-white/10 max-w-2xl mx-auto w-full">
        {isLearn ? (
          <button
            onClick={handleComplete}
            disabled={completing || (lesson !== null && mcqAnswer === null)}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
          >
            {completing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Complete Lesson"
            )}
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completing || ayahs.length === 0}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
          >
            {completing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Complete Session"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ReadSession({
  ayahs,
  currentIndex,
  onNext,
  onPlayAudio,
}: {
  ayahs: AyahData[];
  currentIndex: number;
  onNext: () => void;
  onPlayAudio: (url: string) => void;
}) {
  if (ayahs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-white/40 text-sm">Loading ayahs…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex gap-1.5">
        {ayahs.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentIndex ? "bg-accent" : "bg-white/15"
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-white/40 text-center">
        {currentIndex + 1} / {ayahs.length}
      </p>

      <div className="space-y-4">
        {ayahs.map((ayah, i) => (
          <div
            key={ayah.verseKey}
            className={`glass-card rounded-2xl p-5 transition-all ${
              i > currentIndex ? "opacity-30" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-accent font-semibold">{ayah.verseKey}</span>
              <button
                onClick={() => {
                  const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${String(ayah.surahNumber).padStart(3, "0")}${String(ayah.ayahNumber).padStart(3, "0")}.mp3`;
                  onPlayAudio(audioUrl);
                }}
                className="text-white/40 hover:text-accent transition-colors"
              >
                <Volume2 size={16} />
              </button>
            </div>
            <p className="text-right text-2xl leading-loose text-white font-arabic mb-3">
              {ayah.arabic}
            </p>
            <p className="text-sm text-white/60 leading-relaxed">{ayah.translation}</p>

            {i === currentIndex && i < ayahs.length - 1 && (
              <button
                onClick={onNext}
                className="mt-4 flex items-center gap-1 text-xs font-semibold text-accent hover:text-white transition-colors"
              >
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
            onClick={() => onPlayAudio(learnContent.audioUrl)}
            className="text-white/40 hover:text-accent transition-colors"
          >
            <Volume2 size={16} />
          </button>
        </div>
        <p className="text-right text-2xl leading-loose text-white font-arabic mb-2">
          {learnContent.arabic}
        </p>
        <p className="text-sm text-white/55 italic mb-1">{learnContent.transliteration}</p>
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
            let bg = "glass border-white/15 hover:border-accent/40";
            if (answered) {
              if (i === mcq.correctIndex) bg = "bg-green-500/20 border-green-500/50";
              else if (i === mcqAnswer) bg = "bg-red-500/20 border-red-500/50";
              else bg = "glass border-white/10 opacity-50";
            }
            return (
              <button
                key={i}
                onClick={() => !answered && onMcqAnswer(i)}
                disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${bg}`}
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
            {correct ? "Correct! Well done." : `Not quite — the correct answer is: ${mcq.options[mcq.correctIndex]}`}
          </p>
        )}
      </div>
    </div>
  );
}
