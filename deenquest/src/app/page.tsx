"use client";

"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MoodSelector from "@/components/MoodSelector";
import AyahCard from "@/components/AyahCard";
import XPBar from "@/components/XPBar";
import PageContainer from "../components/PageContainer";
import { getAyahsForMood, searchAyahs } from "@/lib/quran";
import { getTodaysTasks } from "@/lib/tasks-data";
import { getUserTasksForDate, completeTask } from "@/lib/firestore";
import { getLevelInfo } from "@/lib/types";
import { getQFAccessToken, isQFConnected, initiateQFOAuth, clearQFSession } from "@/lib/qf-user-auth";
import {
  CheckCircle2, ChevronDown, ChevronUp, Circle,
  Star, BookOpen, Flame, Trophy, Loader2, Link2, Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import LoginPage from "./login/page";

const AYAH_STORAGE_KEY = "deenquest_home_ayah";
const COMMUNITY_PREFILL_KEY = "deenquest_community_prefill";

export default function HomePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [mood, setMood] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return JSON.parse(sessionStorage.getItem(AYAH_STORAGE_KEY) || "{}").mood || ""; } catch { return ""; }
  });
  const [moodAyah, setMoodAyah] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(sessionStorage.getItem(AYAH_STORAGE_KEY) || "{}").ayah || null; } catch { return null; }
  });
  const [moodExplanation, setMoodExplanation] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return JSON.parse(sessionStorage.getItem(AYAH_STORAGE_KEY) || "{}").explanation || ""; } catch { return ""; }
  });
  const [loadingAyah, setLoadingAyah] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const explanationRequestId = useRef(0);
  const todayTasks = getTodaysTasks();
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [expandedHomeTaskId, setExpandedHomeTaskId] = useState<string | null>(null);

  // QF bookmark state
  const [qfConnected, setQFConnected] = useState(false);
  const [bookmarkedKey, setBookmarkedKey] = useState<string | null>(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [existingBookmarkKeys, setExistingBookmarkKeys] = useState<Set<string>>(new Set());
  const [bookmarksList, setBookmarksList] = useState<{ key: number; verseNumber: number }[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);


  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (moodAyah) {
      try {
        sessionStorage.setItem(AYAH_STORAGE_KEY, JSON.stringify({ mood, ayah: moodAyah, explanation: moodExplanation }));
      } catch {}
    }
  }, [mood, moodAyah, moodExplanation]);

  useEffect(() => {
    const connected = isQFConnected();
    setQFConnected(connected);
    if (connected) fetchExistingBookmarks();
  }, []);

  async function fetchExistingBookmarks() {
    const token = getQFAccessToken();
    if (!token) return;
    try {
      const res = await fetch("/api/qf/bookmark", {
        headers: { "x-qf-token": token },
      });
      if (!res.ok) return;
      const data = await res.json();
      const keys = new Set<string>(
        (data?.data ?? []).map((b: { key: number; verseNumber?: number }) =>
          b.verseNumber != null ? `${b.key}:${b.verseNumber}` : null
        ).filter(Boolean) as string[]
      );
      setExistingBookmarkKeys(keys);
      setBookmarksList(
        (data?.data ?? []).filter((b: { key: number; verseNumber?: number }) => b.verseNumber != null)
      );
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    if (user) {
      getUserTasksForDate(user.uid, today).then((tasks) => {
        setCompletedTaskIds(new Set(tasks.map((t) => t.taskId)));
        setLoadingTasks(false);
      });
    }
  }, [user, today]);

  async function generateExplanation(prompt: string) {
    const requestId = ++explanationRequestId.current;
    setLoadingExplanation(true);
    try {
      const response = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const data = await response.json();
      if (explanationRequestId.current !== requestId) return;
      setMoodExplanation(data.content || "");
    } catch {
      if (explanationRequestId.current !== requestId) return;
      setMoodExplanation("");
    } finally {
      if (explanationRequestId.current === requestId) setLoadingExplanation(false);
    }
  }

  async function handleMoodSelect(selectedMood: string) {
    explanationRequestId.current += 1;
    setMood(selectedMood);
    setLoadingAyah(true);
    setLoadingExplanation(false);
    setMoodExplanation("");
    setBookmarkedKey(null);
    try {
      const results = await getAyahsForMood(selectedMood);
      if (results.length === 0) { setLoadingAyah(false); return; }
      const ayahData = results[Math.floor(Math.random() * results.length)];
      setMoodAyah(ayahData);
      void generateExplanation(
        `I'm feeling ${selectedMood}. The Quran verse ${ayahData.surah.englishName} ${ayahData.numberInSurah} says: "${ayahData.translation}". Give me a brief, warm, personal explanation of how this verse relates to my feeling. Keep it under 100 words.`
      );
    } catch {
      toast.error("Failed to load ayah");
    }
    setLoadingAyah(false);
  }

  async function handleCustomSituation(text: string) {
    explanationRequestId.current += 1;
    setMood("");
    setLoadingAyah(true);
    setLoadingExplanation(false);
    setMoodExplanation("");
    setMoodAyah(null);
    setBookmarkedKey(null);
    try {
      const results = await searchAyahs(text);
      if (results.length === 0) {
        toast.error("No matching ayahs found");
        setLoadingAyah(false);
        return;
      }
      const ayahData = results[0];
      setMoodAyah(ayahData);
      void generateExplanation(
        `The user described their situation: "${text}". The Quran verse ${ayahData.surah.englishName} ${ayahData.numberInSurah} says: "${ayahData.translation}". Give a brief, warm, personal explanation of how this verse relates to their situation. Keep it under 100 words.`
      );
    } catch {
      toast.error("Failed to find ayah");
    }
    setLoadingAyah(false);
  }

  async function handleBookmark() {
    if (!moodAyah) return;

    if (!qfConnected) {
      try {
        await initiateQFOAuth();
      } catch {
        toast.error("Quran.com integration not configured yet");
      }
      return;
    }

    const token = getQFAccessToken();
    if (!token) {
      setQFConnected(false);
      toast.error("Session expired — please reconnect Quran.com");
      return;
    }

    const verseKey = moodAyah.verseKey || `${moodAyah.surah.number}:${moodAyah.numberInSurah}`;
    const [chapterStr, verseStr] = verseKey.split(":");
    const chapter = parseInt(chapterStr, 10);
    const verse = parseInt(verseStr, 10);
    if (!chapter || !verse) return;

    setBookmarkLoading(true);
    try {
      const res = await fetch("/api/qf/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-qf-token": token },
        body: JSON.stringify({ chapterNumber: chapter, verseNumber: verse }),
      });
      const bData = await res.json().catch(() => ({}));
      if (res.ok) {
        setBookmarkedKey(verseKey);
        setExistingBookmarkKeys((prev) => new Set(prev).add(verseKey));
        toast.success("Verse saved to Quran.com!");
        // Also add to default collection using the returned bookmark ID
        const bookmarkId = bData?.data?.id ?? bData?.id;
        if (bookmarkId && typeof bookmarkId === "string" && /^[\w-]{1,64}$/.test(bookmarkId)) {
          fetch("/api/qf/collections", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-qf-token": token },
            body: JSON.stringify({ bookmarkId, collectionId: "__default__" }),
          }).catch(() => {});
        }
      } else if (res.status === 401 || res.status === 403) {
        clearQFSession();
        setQFConnected(false);
        toast.error("Session expired — please reconnect Quran.com");
      } else {
        toast.error("Failed to bookmark verse");
      }
    } catch {
      toast.error("Failed to bookmark verse");
    } finally {
      setBookmarkLoading(false);
    }
  }

  async function handleCompleteTask(taskId: string, xpReward: number) {
    if (!user || completedTaskIds.has(taskId) || pendingTaskIds.has(taskId)) return;
    setPendingTaskIds((prev) => new Set(prev).add(taskId));
    setCompletedTaskIds((prev) => new Set(prev).add(taskId));
    try {
      await completeTask(user.uid, taskId, today, xpReward);
      refreshProfile().catch(() => undefined);
      toast.success(`+${xpReward} Hasanat earned!`);
      // Record activity day on QF streak API
      const qfToken = getQFAccessToken();
      if (qfToken) {
        fetch("/api/qf/streak", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-qf-token": qfToken },
        }).catch(() => {});
      }
    } catch {
      setCompletedTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
      toast.error("Failed to complete task");
    } finally {
      setPendingTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
    }
  }

  function toggleHomeTaskDetails(taskId: string) {
    setExpandedHomeTaskId((prev) => (prev === taskId ? null : taskId));
  }

  function handleShareToCommunity() {
    if (!moodAyah) return;
    const verseKey = moodAyah.verseKey || `${moodAyah.surah.number}:${moodAyah.numberInSurah}`;
    const title = `Reflection on ${moodAyah.surah.englishName} ${moodAyah.numberInSurah}`;
    const content = [
      `"${moodAyah.translation}"`,
      `— ${moodAyah.surah.englishName}, Verse ${moodAyah.numberInSurah} (${verseKey})`,
      moodExplanation ? `\n${moodExplanation}` : "",
    ].filter(Boolean).join("\n");
    try {
      sessionStorage.setItem(COMMUNITY_PREFILL_KEY, JSON.stringify({ title, content, type: "reflection" }));
    } catch {}
    router.push("/community");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const levelInfo = profile ? getLevelInfo(profile.xp) : null;
  const currentVerseKey = moodAyah
    ? (moodAyah.verseKey || `${moodAyah.surah.number}:${moodAyah.numberInSurah}`)
    : null;
  const isCurrentVerseBookmarked = currentVerseKey
    ? (bookmarkedKey === currentVerseKey || existingBookmarkKeys.has(currentVerseKey))
    : false;

  return (
    <PageContainer
      size="wide"
      className="space-y-10 home-page-cards"
      tooltipTitle="Home Dashboard"
      tooltipDescription={[
        "Track your progress and daily Quran journey.",
        "Check your streak, Hasanat, level, and today's deeds.",
        "Select your mood to receive a relevant ayah and guidance.",
      ]}
    >
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          Assalamu Alaikum, {profile?.name?.split(" ")[0]}
        </h1>
        <p className="text-primary/50 mt-1">Continue your journey with the Quran</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-secondary" />
            <span className="text-xs text-primary/50">Hasanat</span>
          </div>
          <p className="text-2xl font-bold text-primary">{profile?.xp || 0}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-secondary" />
            <span className="text-xs text-primary/50">Level</span>
          </div>
          <p className="text-2xl font-bold text-primary">{levelInfo?.current.name}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-accent" />
            <span className="text-xs text-primary/50">Streak</span>
          </div>
          <p className="text-2xl font-bold text-primary">{profile?.streak || 0} days</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-secondary" />
            <span className="text-xs text-primary/50">Tasks Today</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {todayTasks.filter((t) => completedTaskIds.has(t.id)).length}/{todayTasks.length}
          </p>
        </div>
      </div>

      {/* XP Progress */}
      {profile && <XPBar xp={profile.xp} />}

      {/* Bookmarks */}
      <div className="glass-strong rounded-2xl overflow-hidden">
          <button
            onClick={() => {
              if (!qfConnected) { initiateQFOAuth().catch(() => {}); return; }
              setShowBookmarks((v) => !v);
            }}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-secondary" />
              <span className="text-sm font-semibold text-primary">My Quran.com Bookmarks</span>
            </div>
            <div className="flex items-center gap-2">
              {bookmarksList.length > 0 && (
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                  {bookmarksList.length}
                </span>
              )}
              {showBookmarks ? <ChevronUp size={16} className="text-primary/40" /> : <ChevronDown size={16} className="text-primary/40" />}
            </div>
          </button>
          {showBookmarks && (
            <div className="border-t border-white/10 px-6 py-4">
              {bookmarksList.length === 0 ? (
                <p className="text-sm text-primary/40 text-center py-4">No bookmarks yet. Bookmark a verse to see it here.</p>
              ) : (
                <div className="space-y-2">
                  {bookmarksList.map((b) => (
                    <a
                      key={`${b.key}:${b.verseNumber}`}
                      href={`https://quran.com/${b.key}/${b.verseNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 rounded-xl glass hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
                          <BookOpen size={14} className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary">Surah {b.key} : {b.verseNumber}</p>
                          <p className="text-xs text-primary/40">Verse {b.verseNumber}</p>
                        </div>
                      </div>
                      <span className="text-xs text-primary/30 group-hover:text-secondary transition-colors">quran.com →</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      {/* Mood Selector */}
      <div className="glass-strong rounded-2xl p-7">
        <MoodSelector
          onSelect={handleMoodSelect}
          onCustomSituation={handleCustomSituation}
          selected={mood}
          loading={loadingAyah}
        />

        {/* Connect Quran.com banner — shown only when a verse is visible and not connected */}
        {moodAyah && !loadingAyah && !qfConnected && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20">
            <Link2 size={15} className="text-secondary shrink-0" />
            <p className="text-xs text-primary/70 flex-1">
              Connect your Quran.com account to bookmark verses across devices.
            </p>
            <button
              onClick={handleBookmark}
              className="text-xs font-medium text-secondary hover:text-white transition-colors shrink-0"
            >
              Connect
            </button>
          </div>
        )}

        {loadingAyah && (
          <div className="mt-6 glass-card rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-4 w-28 bg-white/10 rounded-full" />
            <div className="space-y-2">
              <div className="h-5 bg-white/10 rounded-lg w-full" />
              <div className="h-5 bg-white/10 rounded-lg w-4/5 ml-auto" />
              <div className="h-5 bg-white/10 rounded-lg w-3/5 ml-auto" />
            </div>
            <div className="h-4 bg-white/10 rounded-lg w-full" />
            <div className="h-4 bg-white/10 rounded-lg w-3/4" />
            <div className="h-16 bg-white/10 rounded-xl w-full" />
          </div>
        )}

        {moodAyah && !loadingAyah && (
          <div className="mt-6 space-y-3">
            <AyahCard
              text={moodAyah.text}
              translation={moodAyah.translation}
              surahName={moodAyah.surah.englishName}
              ayahNumber={moodAyah.number}
              numberInSurah={moodAyah.numberInSurah}
              verseKey={moodAyah.verseKey}
              explanation={moodExplanation}
              explanationLoading={loadingExplanation}
              bookmarked={isCurrentVerseBookmarked}
              onBookmark={bookmarkLoading ? undefined : handleBookmark}
            />
            <button
              onClick={handleShareToCommunity}
              disabled={!moodExplanation}
              className="flex items-center gap-2 text-xs text-primary/50 hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed px-1"
            >
              <Share2 size={13} />
              Share as Community Reflection
            </button>
          </div>
        )}
      </div>

      {/* Today's Tasks */}
      <div className="glass-strong rounded-2xl p-7">
        <h3 className="font-semibold text-primary mb-4">Today&apos;s Deeds</h3>
        <div className="space-y-3">
          {todayTasks.map((task) => {
            const done = completedTaskIds.has(task.id);
            const pending = pendingTaskIds.has(task.id);
            const expanded = expandedHomeTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                  done
                    ? "bg-[rgba(108,36,112,0.58)] border-accent/35"
                    : "glass border-white/25 hover:border-accent/25 hover:bg-accent/8"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleCompleteTask(task.id, task.xpReward)}
                  disabled={done || pending || loadingTasks}
                  className="shrink-0"
                  aria-label={`Mark ${task.title} as completed`}
                >
                  {done ? (
                    <CheckCircle2 size={22} className="text-secondary shrink-0" />
                  ) : pending ? (
                    <Loader2 size={22} className="text-secondary shrink-0 animate-spin" />
                  ) : (
                    <Circle size={22} className="text-primary/25 shrink-0 hover:text-accent transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleHomeTaskDetails(task.id)}
                    className="w-full text-left"
                    aria-expanded={expanded}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${done ? "text-secondary" : "text-primary"}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-primary/50 truncate">{task.description}</p>
                      </div>
                      {expanded ? (
                        <ChevronUp size={16} className="text-primary/50 mt-0.5 shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-primary/50 mt-0.5 shrink-0" />
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                    <BookOpen size={12} />
                    <span>Quran {task.ayahRef}</span>
                  </div>
                  {expanded && (
                    <div className="mt-3 rounded-xl border border-white/15 bg-[rgba(20,20,40,0.64)] p-3 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-secondary">What Quran says</p>
                        <p className="text-sm text-primary/75 leading-relaxed mt-1">{task.quranGuidance}</p>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div>
                        <p className="text-xs font-medium text-secondary">Benefit and reward</p>
                        <p className="text-sm text-primary/75 leading-relaxed mt-1">{task.deedBenefit}</p>
                      </div>
                    </div>
                  )}
                </div>
                <span className="self-start mt-0.5 text-xs font-medium text-secondary bg-accent/15 px-2 py-1 rounded-full">
                  +{task.xpReward}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
