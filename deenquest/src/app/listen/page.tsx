"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSurahList } from "@/lib/quran";
import {
  saveListeningProgress,
  getListeningProgress,
  type ListeningProgress,
} from "@/lib/firestore";
import { getQFAccessToken, isQFConnected, initiateQFOAuth } from "@/lib/qf-user-auth";
import {
  Play, Pause, ChevronLeft, CheckCircle,
  Shuffle, BookOpen, Headphones, ScrollText, Loader2, CloudUpload,
} from "lucide-react";
import PageContainer from "../../components/PageContainer";
import toast from "react-hot-toast";

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  translated_name: { name: string };
}

interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  char_type_name: string;
}

interface Verse {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  words: Word[];
  translations: { text: string }[];
}

interface AudioFile {
  verse_key: string;
  url: string;
  segments?: number[][];
}

interface TafsirEntry {
  verse_key: string;
  text: string;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

async function qfProxy(path: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ path, ...extra });
  const res = await fetch(`/api/quran?${params}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export default function ListenPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const versesRef = useRef<Verse[]>([]);
  const audioFilesRef = useRef<Record<string, AudioFile>>({});

  // Surah list state
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<ListeningProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChapters, setLoadingChapters] = useState(true);

  // Reading view state
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [tafsirMap, setTafsirMap] = useState<Record<string, string>>({});
  // Set of verse keys whose tafsir panel is open
  const [openTafsirKeys, setOpenTafsirKeys] = useState<Set<string>>(new Set());
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [loadingTafsirKey, setLoadingTafsirKey] = useState<string | null>(null);

  // Playback state
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState(-1);
  const [loadingAudioKey, setLoadingAudioKey] = useState<string | null>(null);
  const [sessionSynced, setSessionSynced] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Goals state — QF is single source of truth, no localStorage/Firestore
  const [qfConnected, setQFConnected] = useState(false);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalType, setGoalType] = useState<"QURAN_TIME" | "QURAN_PAGES">("QURAN_TIME");
  const [goalAmount, setGoalAmount] = useState("10");
  const [savingGoal, setSavingGoal] = useState(false);
  const [todayProgress, setTodayProgress] = useState<{
    hasGoal: boolean;
    goalId: string | null;
    progress: number;
    versesRead: number;
    secondsRead: number;
    dailyTargetSeconds: number;
    dailyTargetPages: number;
  } | null>(null);
  const [deletingGoal, setDeletingGoal] = useState(false);
  const verseStartRef = useRef<{ key: string; startedAt: number } | null>(null);

  useEffect(() => {
    if (playingKey && verseRefs.current[playingKey]) {
      verseRefs.current[playingKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [playingKey]);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    setQFConnected(isQFConnected());
  }, []);

  function applyGoalData(d: Record<string, unknown>) {
    const data = d?.data as Record<string, unknown> | undefined;
    if (!data) return;
    const hasGoal = !!data.hasGoal;
    const goalId = (data.id ?? data.goalId ?? null) as string | null;
    setTodayProgress({
      hasGoal,
      goalId,
      progress: Number(data.progress ?? 0),
      versesRead: Number(data.versesRead ?? 0),
      secondsRead: Number(data.secondsRead ?? 0),
      dailyTargetSeconds: Number(data.dailyTargetSeconds ?? 0),
      dailyTargetPages: Number(data.dailyTargetPages ?? 0),
    });
    if (hasGoal) {
      const secs = Number(data.dailyTargetSeconds ?? 0);
      const pages = Number(data.dailyTargetPages ?? 0);
      if (secs > 0) { setGoalType("QURAN_TIME"); setGoalAmount(String(Math.round(secs / 60))); }
      else if (pages > 0) { setGoalType("QURAN_PAGES"); setGoalAmount(String(Math.round(pages))); }
    }
  }

  function fetchGoalProgress() {
    const token = getQFAccessToken();
    if (!token) return;
    fetch(`/api/qf/goals?type=QURAN_TIME`, { headers: { "x-qf-token": token } })
      .then((r) => r.json())
      .then(applyGoalData)
      .catch(() => {});
  }

  // Fetch goal from QF on connect — QF is single source of truth
  useEffect(() => {
    if (!qfConnected) return;
    fetchGoalProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qfConnected]);

  async function saveGoal() {
    const amount = parseInt(goalAmount, 10);
    if (!amount || amount < 1) return;
    setSavingGoal(true);
    const qfAmount = goalType === "QURAN_TIME" ? amount * 60 : amount;
    const qfToken = getQFAccessToken();
    if (!qfToken) { await initiateQFOAuth(); setSavingGoal(false); return; }
    try {
      await fetch("/api/qf/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-qf-token": qfToken },
        body: JSON.stringify({ type: goalType, amount: qfAmount }),
      });
      toast.success(`Goal set: ${amount} ${goalType === "QURAN_TIME" ? "min/day" : "pages/day"}`);
      fetchGoalProgress();
    } catch {
      toast.error("Failed to save goal");
    }
    setShowGoalInput(false);
    setSavingGoal(false);
  }

  async function deleteGoal() {
    const goalId = todayProgress?.goalId;
    const qfToken = getQFAccessToken();
    if (!qfToken) { await initiateQFOAuth(); return; }
    if (!goalId) { toast.error("Goal ID not found — refresh and try again"); return; }
    setDeletingGoal(true);
    try {
      await fetch(`/api/qf/goals?goalId=${encodeURIComponent(goalId)}`, {
        method: "DELETE",
        headers: { "x-qf-token": qfToken },
      });
      toast.success("Goal deleted");
      setTodayProgress(null);
      setGoalAmount("10");
      setGoalType("QURAN_TIME");
    } catch {
      toast.error("Failed to delete goal");
    }
    setDeletingGoal(false);
  }

  function reportActivity(verseKey: string, seconds: number, chapterId: number, verseNumber: number) {
    const qfToken = getQFAccessToken();
    if (!qfToken || seconds < 1) return;
    const range = `${chapterId}:${verseNumber}-${chapterId}:${verseNumber}`;
    fetch("/api/qf/streak", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-qf-token": qfToken },
      body: JSON.stringify({
        ranges: [range],
        seconds: Math.round(seconds),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    }).then(() => fetchGoalProgress()).catch(() => {});
  }

  useEffect(() => {
    async function init() {
      try {
        const [chaptersData, progressData] = await Promise.all([
          getSurahList(),
          user ? getListeningProgress(user.uid) : Promise.resolve([]),
        ]);
        setChapters(chaptersData);
        setProgress(progressData);
      } catch {
        toast.error("Failed to load chapters");
      }
      setLoadingChapters(false);
    }
    if (!loading) init();
  }, [loading, user]);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.ontimeupdate = null;
      audio.onended = null;
    }
    setPlayingKey(null);
    setIsPlaying(false);
    setCurrentWordIdx(-1);
  }, []);

  const openChapter = useCallback(async (chapter: Chapter) => {
    stopAudio();
    setSelectedChapter(chapter);
    setVerses([]);
    audioFilesRef.current = {};
    setTafsirMap({});
    setOpenTafsirKeys(new Set());
    setLoadingVerses(true);

    try {
      const verseData = await qfProxy(`verses/by_chapter/${chapter.id}`, {
        words: "true",
        word_fields: "text_uthmani,char_type_name",
        translations: "131",
        per_page: "300",
      });
      const loadedVerses = verseData.verses ?? [];
      setVerses(loadedVerses);
      versesRef.current = loadedVerses;

      // Audio — non-fatal if it fails
      try {
        const audioData = await qfProxy(`recitations/7/by_chapter/${chapter.id}`, { per_page: "300" });
        const BASE = "https://verses.quran.com/";
        const aMap: Record<string, AudioFile> = {};
        for (const af of audioData.audio_files ?? []) {
          aMap[af.verse_key] = {
            ...af,
            url: af.url?.startsWith("http") ? af.url : `${BASE}${af.url}`,
          };
        }
        audioFilesRef.current = aMap;
      } catch {
        toast.error("Audio unavailable for this surah");
      }
    } catch {
      toast.error("Failed to load surah");
    }
    setLoadingVerses(false);
  }, [stopAudio]);

  async function playVerse(verse: Verse) {
    const vk = verse.verse_key;

    if (playingKey === vk && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    stopAudio();
    setLoadingAudioKey(vk);

    const af = audioFilesRef.current[vk];
    if (!af?.url) {
      toast.error("Audio not available for this verse");
      setLoadingAudioKey(null);
      return;
    }

    const audio = new Audio(af.url);
    audioRef.current = audio;
    const segments: number[][] = af.segments ?? [];

    audio.ontimeupdate = () => {
      const ms = audio.currentTime * 1000;
      let idx = -1;
      for (let i = 0; i < segments.length; i++) {
        const [, start, end] = segments[i];
        if (ms >= start && ms < end) { idx = segments[i][0] - 1; break; }
      }
      setCurrentWordIdx(idx);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentWordIdx(-1);
      // Report activity for the verse that just finished
      if (verseStartRef.current?.key === vk && selectedChapter) {
        const seconds = (Date.now() - verseStartRef.current.startedAt) / 1000;
        reportActivity(vk, seconds, selectedChapter.id, verse.verse_number);
        verseStartRef.current = null;
      }
      const currentVerses = versesRef.current;
      const idx = currentVerses.findIndex((v) => v.verse_key === vk);
      if (idx >= 0 && idx < currentVerses.length - 1) {
        playVerse(currentVerses[idx + 1]);
      }
    };

    try {
      await audio.play();
      // Record when this verse started playing
      verseStartRef.current = { key: vk, startedAt: Date.now() };
      setPlayingKey(vk);
      setIsPlaying(true);

      if (user && selectedChapter) {
        saveListeningProgress(
          user.uid, selectedChapter.id, selectedChapter.name_simple,
          verse.verse_number, selectedChapter.verses_count
        ).then(() => {
          setProgress((prev) => {
            const e: ListeningProgress = {
              chapterId: selectedChapter.id,
              chapterName: selectedChapter.name_simple,
              lastVerse: verse.verse_number,
              totalVerses: selectedChapter.verses_count,
              updatedAt: new Date().toISOString(),
            };
            const i = prev.findIndex((p) => p.chapterId === selectedChapter.id);
            if (i >= 0) { const u = [...prev]; u[i] = e; return u; }
            return [...prev, e];
          });
        });

        const qfToken = getQFAccessToken();
        if (typeof qfToken === "string" && qfToken.length > 0) {
          fetch("/api/qf/reading-session", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-qf-token": qfToken },
            body: JSON.stringify({ chapterNumber: selectedChapter.id, verseNumber: verse.verse_number }),
          }).then((r) => {
            if (r.ok) {
              setSessionSynced(true);
              if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
              syncTimerRef.current = setTimeout(() => setSessionSynced(false), 2500);
            }
          }).catch(() => {});
        }
      }
    } catch {
      toast.error("Failed to play audio");
    }
    setLoadingAudioKey(null);
  }

  // Fetch tafsir for the whole surah once, then toggle per-verse
  async function handleVerseTafsir(vk: string) {
    // Toggle closed if already open
    if (openTafsirKeys.has(vk)) {
      setOpenTafsirKeys((prev) => { const s = new Set(prev); s.delete(vk); return s; });
      return;
    }

    // If tafsir already fetched, just open this verse
    if (Object.keys(tafsirMap).length > 0) {
      setOpenTafsirKeys((prev) => new Set(prev).add(vk));
      return;
    }

    // First time — fetch all tafsir for this surah
    if (!selectedChapter) return;
    setLoadingTafsirKey(vk);
    try {
      const data = await qfProxy(`tafsirs/169/by_chapter/${selectedChapter.id}`);
      const map: Record<string, string> = {};
      for (const t of (data.tafsirs ?? []) as TafsirEntry[]) {
        map[t.verse_key] = stripHtml(t.text ?? "");
      }
      setTafsirMap(map);
      // Open the clicked verse (or nearest available key)
      const key = map[vk] ? vk : Object.keys(map)[0];
      if (key) setOpenTafsirKeys(new Set([vk]));
    } catch {
      toast.error("Failed to load tafsir");
    }
    setLoadingTafsirKey(null);
  }

  function randomChapter() {
    if (!chapters.length) return;
    openChapter(chapters[Math.floor(Math.random() * chapters.length)]);
  }

  const filtered = chapters.filter(
    (ch) =>
      ch.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.translated_name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(ch.id).includes(searchQuery)
  );

  const getProgress = (id: number) => progress.find((p) => p.chapterId === id);
  const totalListened = progress.reduce((s, p) => s + p.lastVerse, 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-secondary" size={32} />
    </div>
  );

  // ── Reading view ──
  if (selectedChapter) {
    const isAnythingPlaying = !!playingKey && isPlaying;
    const isAnythingLoading = !!loadingAudioKey;

    function handleGlobalListen() {
      if (!verses.length) return;
      if (playingKey && audioRef.current) {
        if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
        else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
        return;
      }
      playVerse(verses[0]);
    }

    return (
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-20 glass-dark border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { stopAudio(); setSelectedChapter(null); }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-all shrink-0"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">{selectedChapter.name_simple}</h2>
                <span className="text-xs text-white/40 hidden sm:inline">{selectedChapter.translated_name.name}</span>
                <span className="text-xs bg-white/10 text-white/35 px-2 py-0.5 rounded-full hidden sm:inline">
                  {selectedChapter.verses_count} verses
                </span>
              </div>
              <p className="text-sm font-arabic text-accent/70">{selectedChapter.name_arabic}</p>
            </div>
            {/* Quran.com sync indicator */}
            {qfConnected && (
              <span className={`flex items-center gap-1 text-xs shrink-0 transition-colors duration-300 ${sessionSynced ? "text-secondary animate-pulse" : "text-white/30"}`}>
                <CloudUpload size={13} />
                {sessionSynced ? "Synced" : "Quran.com"}
              </span>
            )}
            {/* Global Listen / Pause button only */}
            <button
              onClick={handleGlobalListen}
              disabled={isAnythingLoading || loadingVerses}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                isAnythingPlaying
                  ? "bg-secondary text-white"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {isAnythingLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : isAnythingPlaying ? (
                <Pause size={13} />
              ) : (
                <Play size={13} />
              )}
              {isAnythingPlaying ? "Pause" : "Listen"}
            </button>
          </div>
        </div>

        {/* Verses */}
        <div className="flex-1 px-4 py-6 space-y-4 max-w-3xl mx-auto w-full pb-24">
          {loadingVerses ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-secondary" size={28} />
            </div>
          ) : (
            <>
              {selectedChapter.id !== 9 && (
                <p className="text-center text-xl font-arabic text-accent/70 py-4 border-b border-white/10">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>
              )}

              {verses.map((verse) => {
                const vk = verse.verse_key;
                const isActive = playingKey === vk;
                const isThisPlaying = isActive && isPlaying;
                const isThisLoading = loadingAudioKey === vk;
                const isThisTafsirLoading = loadingTafsirKey === vk;
                const isTafsirOpen = openTafsirKeys.has(vk);
                const tafsirText = tafsirMap[vk];
                const translation = stripHtml(verse.translations?.[0]?.text ?? "");
                const wordsOnly = verse.words?.filter((w) => w.char_type_name === "word") ?? [];

                return (
                  <div
                    key={verse.id}
                    ref={(el) => { verseRefs.current[vk] = el; }}
                    className={`glass-card rounded-2xl p-5 space-y-4 transition-all duration-300 ${
                      isActive ? "ring-2 ring-secondary/50 shadow-lg shadow-secondary/10" : ""
                    }`}
                  >
                    {/* Top row: verse key + action buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 transition-colors ${
                        isActive ? "bg-secondary/25 text-secondary" : "text-secondary bg-accent/15"
                      }`}>
                        {vk}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Tafsir toggle button */}
                        <button
                          onClick={() => handleVerseTafsir(vk)}
                          disabled={isThisTafsirLoading}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            isTafsirOpen
                              ? "bg-accent/20 text-accent"
                              : "bg-white/8 text-white/40 hover:bg-white/15 hover:text-white/70"
                          }`}
                        >
                          {isThisTafsirLoading
                            ? <Loader2 size={11} className="animate-spin" />
                            : <ScrollText size={11} />
                          }
                          Tafsir
                        </button>
                        {/* Play / Pause button */}
                        <button
                          onClick={() => playVerse(verse)}
                          disabled={isThisLoading}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            isThisPlaying
                              ? "bg-secondary/20 text-secondary"
                              : "bg-white/8 text-white/40 hover:bg-white/15 hover:text-white/70"
                          }`}
                        >
                          {isThisLoading ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : isThisPlaying ? (
                            <Pause size={11} />
                          ) : (
                            <Play size={11} />
                          )}
                          {isThisPlaying ? "Pause" : "Play"}
                        </button>
                      </div>
                    </div>

                    {/* Arabic — word by word with highlight */}
                    <div className="flex flex-wrap gap-x-2 gap-y-2 justify-end" dir="rtl">
                      {wordsOnly.length > 0 ? wordsOnly.map((word, widx) => (
                        <span
                          key={word.id}
                          className={`text-2xl leading-loose font-arabic transition-all duration-150 ${
                            isActive && currentWordIdx === widx
                              ? "text-accent bg-accent/20 rounded-lg px-1.5 scale-110"
                              : "text-primary"
                          }`}
                        >
                          {word.text_uthmani}
                        </span>
                      )) : (
                        <p className="text-2xl leading-loose font-arabic text-primary w-full text-right" translate="no">
                          {verse.text_uthmani}
                        </p>
                      )}
                    </div>

                    {/* Translation */}
                    {translation && (
                      <p className="text-sm text-white/60 leading-relaxed italic border-t border-white/10 pt-3">
                        &ldquo;{translation}&rdquo;
                      </p>
                    )}

                    {/* Tafsir panel — inline per verse */}
                    {isTafsirOpen && (
                      tafsirText ? (
                        <div className="bg-accent/8 border border-accent/20 rounded-xl p-4 mt-1">
                          <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
                            <ScrollText size={11} /> Ibn Kathir Tafsir
                          </p>
                          <p className="text-xs text-white/65 leading-relaxed">{tafsirText}</p>
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 flex items-center gap-2">
                          <ScrollText size={12} className="text-white/30 shrink-0" />
                          <p className="text-xs text-white/35 italic">No tafsir available for this verse.</p>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Surah list view ──
  return (
    <PageContainer
      size="default"
      className="space-y-6"
      tooltipTitle="Quran"
      tooltipDescription={[
        "Select any surah to read with translation and tafsir.",
        "Press Listen on any verse to hear it with word highlighting.",
        "Track your listening progress across all surahs.",
      ]}
    >
      <div className="relative overflow-hidden rounded-2xl h-44">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/masjid-aerial.png')" }} />
        <div className="overlay" />
        <div className="relative z-10 h-full flex items-end justify-between px-6 pb-5">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white tracking-wide flex items-center gap-2">
              <Headphones size={24} className="text-white/80" />
              Quran Recitation
            </h1>
            <p className="text-white/80 mt-2">Listen, reflect, and track your progress</p>
          </div>
          <button onClick={randomChapter} className="glass-btn flex items-center gap-2 text-sm">
            <Shuffle size={16} /> Random
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {progress.length > 0 && (
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3 flex-1 min-w-40">
            <BookOpen size={20} className="text-secondary" />
            <div>
              <p className="text-sm font-medium text-primary">{totalListened} verses listened</p>
              <p className="text-xs text-secondary">{progress.length} surahs started</p>
            </div>
          </div>
        )}
        {qfConnected && (
          <div className="glass-card rounded-2xl p-4 flex-1 min-w-52">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-primary/50 flex items-center gap-1.5">
                <CheckCircle size={13} className="text-secondary" /> Daily Goal
              </p>
              {todayProgress?.hasGoal && (
                <button
                  onClick={deleteGoal}
                  disabled={deletingGoal}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  {deletingGoal ? "..." : "Delete"}
                </button>
              )}
            </div>

            {todayProgress?.hasGoal ? (
              <>
                <p className="text-sm font-semibold text-primary mb-2">
                  {todayProgress.dailyTargetSeconds > 0
                    ? `${Math.round(todayProgress.dailyTargetSeconds / 60)} min/day`
                    : `${Math.round(todayProgress.dailyTargetPages)} pages/day`}
                </p>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((todayProgress.progress ?? 0) * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-primary/40">
                  {Math.round((todayProgress.progress ?? 0) * 100)}% done · {todayProgress.versesRead} verses · {Math.round((todayProgress.secondsRead ?? 0) / 60)}min
                </p>
              </>
            ) : showGoalInput ? (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {(["QURAN_TIME", "QURAN_PAGES"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setGoalType(t)}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${goalType === t ? "bg-secondary text-white" : "bg-white/10 text-primary/50 hover:bg-white/20"}`}
                    >
                      {t === "QURAN_TIME" ? "⏱ Time" : "📄 Pages"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={goalType === "QURAN_TIME" ? 120 : 20}
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    className="w-14 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-xs text-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-primary/40">{goalType === "QURAN_TIME" ? "min/day" : "pages/day"}</span>
                  <button
                    onClick={saveGoal}
                    disabled={savingGoal}
                    className="ml-auto px-3 py-1 rounded-lg bg-secondary text-white text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {savingGoal ? "..." : "Save"}
                  </button>
                  <button onClick={() => setShowGoalInput(false)} className="text-xs text-primary/40 hover:text-primary/70">✕</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowGoalInput(true)}
                className="text-xs text-secondary hover:brightness-110 transition-colors"
              >
                + Set a daily goal
              </button>
            )}
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Search surah by name or number..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 bg-white/25 border border-white/30 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 backdrop-blur-sm placeholder:text-primary/35"
      />

      {loadingChapters ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-primary/40">
              <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No surahs match &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map((ch) => {
            const prog = getProgress(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => openChapter(ch)}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all bg-[rgba(20,20,40,0.62)] border border-white/24 hover:border-accent/30 hover:bg-[rgba(20,20,40,0.72)] backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-white/30 flex items-center justify-center text-sm font-bold text-primary/60 shrink-0">
                  {ch.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{ch.name_simple}</p>
                  <p className="text-xs text-primary/50 truncate">
                    {ch.translated_name.name} · {ch.verses_count} verses
                  </p>
                </div>
                {prog && (
                  prog.lastVerse >= prog.totalVerses
                    ? <CheckCircle size={16} className="text-secondary shrink-0" />
                    : <span className="text-xs text-secondary font-medium shrink-0">{prog.lastVerse}/{prog.totalVerses}</span>
                )}
              </button>
            );
          })}
          </div>
        </>
      )}
    </PageContainer>
  );
}
