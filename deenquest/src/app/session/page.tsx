"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import {
  completeSession,
  updateQuranProgress,
  incrementCurrentDay,
  getDailySessionCount,
} from "@/lib/firestore";
import { getLesson } from "@/lib/lessons-data";
import { getStreakStatus } from "@/lib/streakUtils";
import { getAyahsForMood, searchAyahs } from "@/lib/quran";
import {
  CheckCircle2, Loader2, Volume2, X, Flame, Moon,
  Play, Pause, BookOpen, Lightbulb, Zap,
} from "lucide-react";
import toast from "react-hot-toast";

const SESSION_IN_PROGRESS_KEY = "deenquest_session_in_progress";
const SESSION_STATE_KEY = "deenquest_session_state";

type Phase = "loading" | "session" | "streak" | "complete";
type JourneyStep = "mood" | "ayah" | "reading";

interface AyahData {
  surahNumber: number;
  ayahNumber: number;
  arabic: string;
  transliteration: string;
  translation: string;
  audioUrl: string;
}

interface MoodAyah {
  verseKey: string;
  arabic: string;
  translation: string;
  surahName: string;
}

const MOODS = [
  { key: "stressed",     label: "Stressed",     image: "/mood/stressed.png" },
  { key: "sad",          label: "Sad",          image: "/mood/sad.png" },
  { key: "grateful",    label: "Grateful",     image: "/mood/grateful.png" },
  { key: "lost",        label: "Lost",         image: "/mood/lost.png" },
  { key: "indecisive",  label: "Indecisive",   image: "/mood/indecisive.png" },
  { key: "overthinking",label: "Overthinking", image: "/mood/overthinking.png" },
  { key: "justHere",    label: "Just Here",    image: "/mood/justHere.png" },
];


function pad3(n: number) { return String(n).padStart(3, "0"); }
function stripHtml(html: string) {
  return html.replace(/<sup[^>]*>.*?<\/sup>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function levelToKey(level: string | null | undefined): "beginner" | "intermediate" | "fluent" {
  if (level === "newbie") return "beginner";
  if (level === "fluent") return "fluent";
  return "intermediate";
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" /></div>}>
      <SessionPageInner />
    </Suspense>
  );
}

function SessionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ayahOnly = searchParams.get("ayahOnly") === "true";
  const { user, profile, refreshProfile } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [journeyStep, setJourneyStep] = useState<JourneyStep>("mood");
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [mcqAnswer, setMcqAnswer] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [newStreak, setNewStreak] = useState(0);
  const [xpGained] = useState(20);
  const [isFirstSession, setIsFirstSession] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [moodAyah, setMoodAyah] = useState<MoodAyah | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [fetchingAyah, setFetchingAyah] = useState(false);
  const [loadingRead, setLoadingRead] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitialized = useRef(false);

  const isLearn = profile?.goal === "learn";
  const timePerDay = profile?.timePerDay ?? 5;
  const ayahCount = timePerDay === 10 ? 15 : timePerDay === 5 ? 8 : 5;
  const lesson = isLearn
    ? getLesson(levelToKey(profile?.level), profile?.currentDay ?? 1)
    : null;

  useEffect(() => {
    if (!profile || !user || hasInitialized.current) return;
    hasInitialized.current = true;
    // Guard: redirect if daily session cap reached
    getDailySessionCount(user.uid).then((count) => {
      if (count >= 3) {
        router.replace("/");
        return;
      }
      const alreadyInProgress = sessionStorage.getItem(SESSION_IN_PROGRESS_KEY) === "true";
      if (alreadyInProgress) {
        const saved = sessionStorage.getItem(SESSION_STATE_KEY);
        if (saved) {
          try {
            const { step, moodAyah: savedMoodAyah, selectedMood: savedMood, ayahs: savedAyahs } = JSON.parse(saved);
            if (step) setJourneyStep(step);
            if (savedMoodAyah) setMoodAyah(savedMoodAyah);
            if (savedMood) setSelectedMood(savedMood);
            if (savedAyahs?.length) setAyahs(savedAyahs);
          } catch {}
        }
      } else {
        sessionStorage.setItem(SESSION_IN_PROGRESS_KEY, "true");
      }
      setPhase("session");
    });
  }, [profile, user, router, ayahOnly]);

  useEffect(() => {
    if (phase !== "session") return;
    sessionStorage.setItem(
      SESSION_STATE_KEY,
      JSON.stringify({ step: journeyStep, moodAyah, selectedMood, ayahs })
    );
  }, [phase, journeyStep, moodAyah, selectedMood, ayahs]);

  async function loadAyahs(startSurah: number, startAyah: number, count: number) {
    setLoadingRead(true);
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
      setAyahs(slice.map((v: any) => {
        const [s, a] = (v.verse_key as string).split(":").map(Number);
        return {
          surahNumber: s,
          ayahNumber: a,
          arabic: v.text_uthmani as string,
          transliteration: stripHtml(v.translations?.find((t: any) => t.resource_id === 57)?.text ?? ""),
          translation: stripHtml(v.translations?.find((t: any) => t.resource_id === 20)?.text ?? ""),
          audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${pad3(s)}${pad3(a)}.mp3`,
        };
      }));
    } catch {
      toast.error("Failed to load ayahs");
    } finally {
      setLoadingRead(false);
    }
  }

  async function fetchMoodAyah(mood: string, customText?: string) {
    setFetchingAyah(true);
    try {
      const results = customText
        ? await searchAyahs(customText)
        : await getAyahsForMood(mood);
      if (results.length > 0) {
        const r = results[0];
        setMoodAyah({
          verseKey: r.verseKey,
          arabic: r.text,
          translation: r.translation,
          surahName: r.surah.englishName,
        });
      }
    } catch {
      // continue without mood ayah
    } finally {
      setFetchingAyah(false);
    }
  }

  async function handleMoodSelect(mood: string) {
    setSelectedMood(mood);
    await fetchMoodAyah(mood);
    setJourneyStep("ayah");
  }

  async function handleCustomMoodText(text: string) {
    setSelectedMood("justHere");
    await fetchMoodAyah("justHere", text);
    setJourneyStep("ayah");
  }

  async function handleSkipMood() {
    await fetchMoodAyah("hopeful");
    setJourneyStep("ayah");
  }

  function handleGoToReading() {
    const start = profile?.quranProgress ?? { surahNumber: 1, ayahNumber: 1 };
    loadAyahs(start.surahNumber, start.ayahNumber, ayahCount);
    setJourneyStep("reading");
  }

  function playLearnAudio(url: string) {
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
      setIsFirstSession(result.sessionsToday === 1);
      setSessionsToday(result.sessionsToday);
      sessionStorage.removeItem(SESSION_IN_PROGRESS_KEY);
      sessionStorage.removeItem(SESSION_STATE_KEY);
      refreshProfile().catch(() => undefined);
      setCompleting(false);
      setPhase(result.sessionsToday === 1 ? "streak" : "complete");
    } catch {
      toast.error("Failed to save session");
      setCompleting(false);
    }
  }

  function handleExit() {
    router.push("/");
  }

  // ── Progress for journey steps ──
  const STEP_ORDER: JourneyStep[] = ["mood", "ayah", "reading"];
  const stepIdx = STEP_ORDER.indexOf(journeyStep);
  const progressPct = (stepIdx / STEP_ORDER.length) * 100;

  // ── Loading ──
  if (!profile || phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  // ── Streak screen (first session of day) ──
  if (phase === "streak") {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun..6=Sat
    const monFirst = (dow + 6) % 7; // 0=Mon..6=Sun
    const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
    const lastDate = profile.lastSessionDate ? new Date(profile.lastSessionDate) : today;
    const streakStart = new Date(lastDate);
    streakStart.setDate(lastDate.getDate() - Math.max(newStreak - 1, 0));

    const weekDays = DAY_LABELS.map((label, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - monFirst + i);
      d.setHours(0, 0, 0, 0);
      const start = new Date(streakStart); start.setHours(0, 0, 0, 0);
      const end = new Date(lastDate); end.setHours(0, 0, 0, 0);
      return { label, completed: d >= start && d <= end };
    });

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xs glass-card rounded-3xl p-8 text-center space-y-7">
          {/* Flame */}
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-2xl" />
            <div className="relative flex items-center justify-center w-full h-full">
              <Flame size={84} className="text-orange-400" fill="#fb923c" />
            </div>
            <div
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
            >
              {newStreak}
            </div>
          </div>

          {/* Week row */}
          <div className="flex justify-between gap-1">
            {weekDays.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-white/45 font-bold">{day.label}</span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  day.completed
                    ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/30"
                    : "bg-white/8 border-white/15"
                }`}>
                  {day.completed && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-extrabold text-white">{newStreak} day streak!</h2>
            <p className="text-sm text-white/55 mt-1.5 leading-relaxed">
              {newStreak >= 7
                ? "MashaAllah! A full week of dedication! 🌟"
                : newStreak >= 3
                ? "You're on fire! Keep the flame lit every day!"
                : "Every day counts. Keep building the habit!"}
            </p>
          </div>

          {/* Continue */}
          <button
            onClick={() => setPhase("complete")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}
          >
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

  // ── Complete screen ──
  if (phase === "complete") {
    const MAX_SESSIONS = 3;
    const isMaxed = sessionsToday >= MAX_SESSIONS;
    const MESSAGES = [
      "May Allah accept it from you.",
      "Every ayah brings you closer.",
      "The angels witnessed your effort.",
      "Consistency is the key to progress.",
      "One session closer to a lifelong habit.",
    ];
    const MAX_OUT_MESSAGES = [
      "You've done amazing today! 🌙",
      "That's your 3 sessions — well done! 🌟",
      "Rest now. Come back tomorrow stronger. 🕌",
    ];
    const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const maxOutMessage = MAX_OUT_MESSAGES[Math.floor(Math.random() * MAX_OUT_MESSAGES.length)];
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
            <h1 className="text-2xl font-extrabold text-white">
              {isMaxed ? maxOutMessage : "Session Complete! 🎉"}
            </h1>
            <p className="text-white/55 mt-1 text-sm">{message}</p>
          </div>

          {/* Session dots */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: MAX_SESSIONS }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < sessionsToday
                    ? "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-4">
            <div className="glass-card rounded-2xl px-5 py-4 text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Zap size={14} className="text-purple-400" fill="currentColor" />
                <span className="text-xs text-white/50">XP Earned</span>
              </div>
              <p className="text-xl font-extrabold text-white">+{xpGained}</p>
            </div>
            <div className="glass-card rounded-2xl px-5 py-4 text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Flame size={14} className="text-orange-400" fill="currentColor" />
                <span className="text-xs text-white/50">Day Streak</span>
              </div>
              <p className="text-xl font-extrabold text-white">{newStreak}</p>
            </div>
            <div className="glass-card rounded-2xl px-5 py-4 text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Zap size={14} className="text-purple-400" fill="currentColor" />
                <span className="text-xs text-white/50">XP Earned</span>
              </div>
              <p className="text-xl font-extrabold text-white">{xpGained}</p>
            </div>
          </div>

          {isMaxed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/8 border border-white/15">
                <Moon size={15} className="text-purple-400" />
                <span className="text-sm text-white/70">3/3 sessions done. See you tomorrow!</span>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
              >
                Back to Home
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => router.push("/session")}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
              >
                Keep Going
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white/60 hover:text-white/90 transition-colors"
              >
                I'm done for today
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Learn mode: simple lesson view ──
  if (isLearn) {
    return (
      <div className="min-h-screen flex flex-col">
        <audio ref={audioRef} />
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button onClick={handleExit} className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white">
            <X size={18} />
          </button>
          <p className="text-sm font-semibold text-white/70">Day {profile.currentDay ?? 1} Lesson</p>
          <div className="w-9" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
            {lesson ? (
              <>
                <LearnSession
                  lesson={lesson}
                  mcqAnswer={mcqAnswer}
                  onMcqAnswer={setMcqAnswer}
                  onPlayAudio={playLearnAudio}
                />
                <div className="mt-6 pb-6">
                  <button
                    onClick={handleComplete}
                    disabled={completing || mcqAnswer === null}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
                  >
                    {completing
                      ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Saving...</span>
                      : "Complete Lesson"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-white/40 text-sm py-12">No lesson available.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Complete-Quran mode: full journey ──
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Duolingo-style progress bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <button
          onClick={handleExit}
          className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white shrink-0 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {journeyStep === "mood" ? (
          <button
            onClick={handleSkipMood}
            disabled={fetchingAyah}
            className="text-xs font-bold text-white/50 hover:text-white/80 px-3 py-1.5 rounded-full bg-white/8 shrink-0 disabled:opacity-40 transition-colors"
          >
            Skip
          </button>
        ) : (
          <div className="w-16 shrink-0" />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">

        {/* Fetching ayah overlay */}
        {fetchingAyah && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <Loader2 size={32} className="text-accent animate-spin mx-auto" />
              <p className="text-sm text-white/40">Finding your ayah…</p>
            </div>
          </div>
        )}

        {!fetchingAyah && journeyStep === "mood" && (
          <MoodStep onSelect={handleMoodSelect} onCustomText={handleCustomMoodText} />
        )}

        {!fetchingAyah && journeyStep === "ayah" && (
          <AyahStep
            ayah={moodAyah}
            mood={selectedMood}
            ayahOnly={ayahOnly}
            onContinue={ayahOnly ? () => router.push("/") : handleGoToReading}
          />
        )}

        {journeyStep === "reading" && (
          loadingRead ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="text-accent animate-spin" />
            </div>
          ) : (
            <ReadSession
              ayahs={ayahs}
              completing={completing}
              onComplete={handleComplete}
            />
          )
        )}
      </div>
    </div>
  );
}

// ─── Mood Step ────────────────────────────────────────────────────────────────

function MoodStep({
  onSelect,
  onCustomText,
}: {
  onSelect: (mood: string) => void;
  onCustomText: (text: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [situation, setSituation] = useState("");

  function handleMoodClick(key: string) {
    setSelected(key);
    onSelect(key);
  }

  function handleFind() {
    if (!situation.trim()) return;
    onCustomText(situation.trim());
  }

  return (
    <div className="p-0 md:p-6 max-w-lg mx-auto w-full space-y-5 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">How are you feeling?</h2>
          <p className="text-white/50 text-sm mt-1">We&apos;ll find an ayah just for you</p>
        </div>
        <Image
          src="/waving_onboarding-removebg-preview.png"
          alt=""
          width={80}
          height={90}
          className="object-contain shrink-0"
        />
      </div>

      {/* Mood grid — 4 columns with images */}
      <div className="grid grid-cols-4 gap-2">
        {MOODS.map(({ key, label, image }) => (
          <button
            key={key}
            onClick={() => handleMoodClick(key)}
            className={`flex flex-col items-center gap-1.5 pb-1.5 rounded-xl border transition-all overflow-hidden ${
              selected === key
                ? "border-accent/60 bg-accent/15 shadow-lg shadow-accent/20"
                : "border-white/12 glass hover:border-accent/35 hover:bg-accent/5"
            }`}
          >
            <div className="w-full aspect-square rounded-t-lg overflow-hidden bg-white/8">
              <Image src={image} alt={label} width={80} height={80} className="object-contain w-full h-full" />
            </div>
            <span className="text-[10px] font-semibold text-white/80 leading-tight text-center px-1">{label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/35 text-xs">or describe your situation</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Text input */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="e.g. I feel empty and lost…"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFind()}
          className="w-full px-4 py-3 rounded-2xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all"
        />
        <button
          onClick={handleFind}
          disabled={!situation.trim()}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-35 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
        >
          Find Ayah
        </button>
      </div>
    </div>
  );
}

// ─── Ayah Step ────────────────────────────────────────────────────────────────

function AyahStep({
  ayah,
  mood,
  ayahOnly,
  onContinue,
}: {
  ayah: MoodAyah | null;
  mood: string | null;
  ayahOnly?: boolean;
  onContinue: () => void;
}) {
  const moodLabel = MOODS.find((m) => m.key === mood)?.label ?? "";

  return (
    <div className="p-5 md:p-6 max-w-lg mx-auto w-full space-y-5 pt-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/25 mb-2">
            <BookOpen size={11} className="text-accent" />
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Today&apos;s Ayah</span>
          </div>
          <p className="text-sm text-white/55">
            {moodLabel
              ? `For when you're feeling ${moodLabel.toLowerCase()}`
              : "Allah's guidance for you today"}
          </p>
        </div>
        <Image
          src="/reading-removebg-preview.png"
          alt=""
          width={72}
          height={72}
          className="object-contain shrink-0"
        />
      </div>

      {ayah ? (
        <>
          {/* Arabic card */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-accent" />
            <div className="p-5">
              <p className="text-right text-2xl leading-loose text-white font-arabic" dir="rtl">
                {ayah.arabic}
              </p>
            </div>
          </div>

          {/* Translation */}
          <div className="rounded-2xl border border-accent/30 p-4" style={{ background: "rgba(20,10,40,0.75)" }}>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Translation</p>
            <p className="text-sm text-white leading-relaxed italic">&quot;{ayah.translation}&quot;</p>
          </div>

          {/* Reference */}
          {ayah.verseKey && (
            <p className="text-xs text-white/30 text-right">
              {ayah.surahName} · {ayah.verseKey}
            </p>
          )}
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-white/40 text-sm">No ayah found — continue with today&apos;s reading</p>
        </div>
      )}

      {/* Reflection */}
      <div className="rounded-2xl border border-yellow-400/25 p-4" style={{ background: "rgba(20,10,40,0.75)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={13} className="text-yellow-400" />
          <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Reflection</p>
        </div>
        <p className="text-sm text-white leading-relaxed">
          Take a moment to sit with this ayah. Let it settle in your heart before you begin reading.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
        style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
      >
        {ayahOnly ? "Back to Home" : "Continue"}
      </button>
    </div>
  );
}

// ─── Read Session ─────────────────────────────────────────────────────────────

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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
    setCurrentTime(0);
    setDuration(0);
    audio.play().catch(() => setIsPlaying(false));
    setTimeout(() => {
      ayahRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [ayahs]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
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

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
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

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return;
    const t = Number(e.target.value);
    audioRef.current.currentTime = t;
    setCurrentTime(t);
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
  const nowPlaying = playingIndex !== null ? ayahs[playingIndex] : null;

  return (
    <div className="flex flex-col">
      <audio ref={audioRef} />

      {/* ── Sticky player bar ── */}
      <div className="sticky top-3 z-10 mx-4 px-4 py-3 flex items-center gap-3 glass-card rounded-2xl border border-white/15 shadow-lg"
        style={{ backdropFilter: "blur(16px)" }}>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/70 truncate">
            {nowPlaying
              ? `Surah ${nowPlaying.surahNumber} · Ayah ${nowPlaying.ayahNumber}`
              : `Surah ${ayahs[0]?.surahNumber} · Ayah ${ayahs[0]?.ayahNumber}–${ayahs[ayahs.length - 1]?.ayahNumber}`}
          </p>
          <p className="text-[10px] text-white/35 mt-0.5">{readCount}/{ayahs.length} read</p>
        </div>
        <button
          onClick={handleGlobalPlayPause}
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            playingIndex !== null && isPlaying
              ? "bg-accent border-accent shadow-lg shadow-accent/30"
              : "bg-accent/15 border-accent/40 hover:bg-accent/25"
          }`}
        >
          {playingIndex !== null && isPlaying
            ? <Pause size={16} className="text-white" fill="white" />
            : <Play size={16} className="text-accent" fill="currentColor" />}
        </button>
      </div>

      {/* ── Ayah list ── */}
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
                  {isRead
                    ? <CheckCircle2 size={16} className="text-accent" />
                    : ayah.ayahNumber}
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

              {/* Mark as read */}
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
            className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40 ${!allRead ? "opacity-70" : ""}`}
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

  if (!lesson) return null;

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

      {/* Final recall — shown after answering */}
      {answered && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔁</span>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Final Recall</p>
          </div>
          <p className="text-right text-2xl leading-loose text-white font-arabic" dir="rtl">
            {learnContent.arabic}
          </p>
          {learnContent.transliteration && (
            <p className="text-xs text-white/40 italic text-center">{learnContent.transliteration}</p>
          )}
          <p className="text-xs font-semibold text-accent">
            Say it aloud one more time before completing.
          </p>
        </div>
      )}
    </div>
  );
}
