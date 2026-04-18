"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "../../components/PageContainer";
import { getSurahList, getAyahAudio } from "@/lib/quran";
import {
  saveListeningProgress,
  getListeningProgress,
  getChapterProgress,
  type ListeningProgress,
} from "@/lib/firestore";
import { getQFAccessToken } from "@/lib/qf-user-auth";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  BookOpen,
  Headphones,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  translated_name: { name: string };
}

interface VerseData {
  text: string;
  translation: string;
}

export default function ListenPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<ListeningProgress[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

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

  const loadVerse = useCallback(
    async (chapter: Chapter, verseNum: number) => {
      setLoadingVerse(true);
      setVerseData(null);
      const verseKey = `${chapter.id}:${verseNum}`;
      try {
        // Fetch verse text + translation + audio in parallel
        const [audioUrl, verseRes, translationRes] = await Promise.all([
          getAyahAudio(verseKey),
          fetch(
            `/api/quran?path=verses/by_key/${verseKey}&fields=text_uthmani`
          ).then((r) => r.json()),
          fetch(
            `/api/quran?path=quran/translations/20&verse_key=${verseKey}`
          ).then((r) => r.json()),
        ]);

        const text = verseRes?.verse?.text_uthmani || "";
        let translation = "";
        const translations = translationRes?.translations;
        if (Array.isArray(translations) && translations.length > 0) {
          translation = translations[0].text
            .replace(/<sup[^>]*>.*?<\/sup>/g, "")
            .replace(/<[^>]+>/g, "")
            .trim();
        }

        setVerseData({ text, translation });
        setCurrentVerse(verseNum);

        // Set up audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          if (autoPlay) {
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }

        // Save progress to Firebase
        if (user) {
          await saveListeningProgress(
            user.uid,
            chapter.id,
            chapter.name_simple,
            verseNum,
            chapter.verses_count
          );

          // Sync reading session to Quran Foundation User API (non-blocking)
          const qfToken = getQFAccessToken();
          const chNum = Number(chapter.id);
          const vsNum = Number(verseNum);
          if (
            typeof qfToken === "string" && qfToken.length > 0 &&
            Number.isInteger(chNum) && chNum >= 1 && chNum <= 114 &&
            Number.isInteger(vsNum) && vsNum >= 1
          ) {
            fetch("/api/qf/reading-session", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-qf-token": qfToken },
              body: JSON.stringify({ chapterNumber: chNum, verseNumber: vsNum }),
            }).catch((err) => console.warn("[QF] reading session sync failed:", err));
          }
          setProgress((prev) => {
            const existing = prev.findIndex((p) => p.chapterId === chapter.id);
            const entry: ListeningProgress = {
              chapterId: chapter.id,
              chapterName: chapter.name_simple,
              lastVerse: verseNum,
              totalVerses: chapter.verses_count,
              updatedAt: new Date().toISOString(),
            };
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = entry;
              return updated;
            }
            return [...prev, entry];
          });
        }
      } catch {
        toast.error("Failed to load verse");
      }
      setLoadingVerse(false);
    },
    [autoPlay, user]
  );

  function selectChapter(chapter: Chapter, startVerse?: number) {
    setSelectedChapter(chapter);
    const verse = startVerse || 1;
    loadVerse(chapter, verse);
  }

  async function selectChapterWithResume(chapter: Chapter) {
    if (user) {
      const saved = await getChapterProgress(user.uid, chapter.id);
      if (saved && saved.lastVerse < chapter.verses_count) {
        selectChapter(chapter, saved.lastVerse);
        toast.success(`Resuming from verse ${saved.lastVerse}`);
        return;
      }
    }
    selectChapter(chapter);
  }

  function randomChapter() {
    if (chapters.length === 0) return;
    const ch = chapters[Math.floor(Math.random() * chapters.length)];
    const randomVerse = Math.floor(Math.random() * ch.verses_count) + 1;
    setSelectedChapter(ch);
    loadVerse(ch, randomVerse);
    toast.success(`Random: ${ch.name_simple} - Verse ${randomVerse}`);
  }

  function nextVerse() {
    if (!selectedChapter) return;
    if (currentVerse < selectedChapter.verses_count) {
      loadVerse(selectedChapter, currentVerse + 1);
    } else {
      toast("End of surah", { icon: "📖" });
      setIsPlaying(false);
    }
  }

  function prevVerse() {
    if (!selectedChapter || currentVerse <= 1) return;
    loadVerse(selectedChapter, currentVerse - 1);
  }

  function togglePlayPause() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  // Auto-advance on audio end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onEnded() {
      setIsPlaying(false);
      if (autoPlay) nextVerse();
    }
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  });

  const filteredChapters = chapters.filter(
    (ch) =>
      ch.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.translated_name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(ch.id).includes(searchQuery)
  );

  const getProgressForChapter = (chapterId: number) =>
    progress.find((p) => p.chapterId === chapterId);

  const totalVersesListened = progress.reduce((sum, p) => sum + p.lastVerse, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageContainer
      size="default"
      className="space-y-6 listen-page-cards"
      tooltipTitle="Quran Recitation"
      tooltipDescription={[
        "Listen to recitation verse by verse and reflect as you go.",
        "Search and select any surah, then resume where you left off.",
        "Track listening progress across chapters.",
      ]}
    >
      <audio ref={audioRef} />

      {/* Hero Banner */}
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
          <button
            onClick={randomChapter}
            className="glass-btn flex items-center gap-2 text-sm"
          >
          <Shuffle size={16} />
          Random
        </button>
        </div>
      </div>

      {/* Stats Bar */}
      {progress.length > 0 && (
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-secondary" />
            <div>
              <p className="text-sm font-medium text-primary">
                {totalVersesListened} verses listened
              </p>
              <p className="text-xs text-secondary">
                {progress.length} surahs started
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Now Playing */}
      {selectedChapter && (
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <p className="text-xs text-secondary font-medium uppercase tracking-wide">
              Now Playing
            </p>
            <h2 className="text-xl font-bold text-primary mt-1">
              {selectedChapter.name_simple}{" "}
              <span className="text-primary/35 font-normal text-base">
                ({selectedChapter.translated_name.name})
              </span>
            </h2>
            <p className="text-sm text-primary/50 mt-1">
              Verse {currentVerse} of {selectedChapter.verses_count}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-1.5 backdrop-blur-sm">
            <div
              className="bg-linear-to-r from-secondary to-secondary-dark h-1.5 rounded-full transition-all duration-500 shadow-sm shadow-secondary/30"
              style={{
                width: `${(currentVerse / selectedChapter.verses_count) * 100}%`,
              }}
            />
          </div>

          {/* Verse Display */}
          {loadingVerse ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : verseData ? (
            <div className="space-y-4">
              <p
                className="text-2xl text-primary text-center leading-loose font-arabic"
                dir="rtl"
                translate="no"
              >
                {verseData.text}
              </p>
              {verseData.translation && (
                <p className="text-sm text-primary/60 text-center leading-relaxed italic">
                  &ldquo;{verseData.translation}&rdquo;
                </p>
              )}
            </div>
          ) : null}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevVerse}
              disabled={currentVerse <= 1}
              className="p-3 rounded-full text-primary/60 hover:bg-white/30 transition-colors disabled:opacity-30"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-4 rounded-full bg-linear-to-r from-secondary to-secondary-dark text-white hover:brightness-110 transition-all shadow-lg shadow-secondary/25"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={nextVerse}
              disabled={currentVerse >= selectedChapter.verses_count}
              className="p-3 rounded-full text-primary/60 hover:bg-white/30 transition-colors disabled:opacity-30"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Auto-play toggle */}
          <div className="flex items-center justify-center gap-2">
            <label className="text-xs text-primary/50 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="rounded border-white/30 text-secondary focus:ring-accent"
              />
              Auto-play next verse
            </label>
          </div>
        </div>
      )}

      {/* Surah List */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search surah by name or number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-white/25 border border-white/30 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 backdrop-blur-sm placeholder:text-primary/35"
        />

        {loadingChapters ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredChapters.map((ch) => {
              const prog = getProgressForChapter(ch.id);
              const isActive = selectedChapter?.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => selectChapterWithResume(ch)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? "glass-card border border-accent/30 shadow-secondary/10"
                      : "bg-[rgba(20,20,40,0.62)] border border-white/24 hover:border-accent/30 hover:bg-[rgba(20,20,40,0.72)] backdrop-blur-sm"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isActive
                        ? "bg-linear-to-r from-secondary to-secondary-dark text-white shadow-md shadow-secondary/20"
                        : "bg-white/30 text-primary/60"
                    }`}
                  >
                    {ch.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {ch.name_simple}
                    </p>
                    <p className="text-xs text-primary/50 truncate">
                      {ch.translated_name.name} &middot; {ch.verses_count} verses
                    </p>
                  </div>
                  {prog && (
                    <div className="flex items-center gap-1">
                      {prog.lastVerse >= prog.totalVerses ? (
                        <CheckCircle size={16} className="text-secondary" />
                      ) : (
                        <span className="text-xs text-secondary font-medium">
                          {prog.lastVerse}/{prog.totalVerses}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
