"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import MoodSelector from "@/components/MoodSelector";
import AyahCard from "@/components/AyahCard";
import XPBar from "@/components/XPBar";
import PageContainer from "../components/PageContainer";
import { getAyahsForMood, searchAyahs } from "@/lib/quran";
import { getTodaysTasks } from "@/lib/tasks-data";
import { getUserTasksForDate, completeTask } from "@/lib/firestore";
import { getLevelInfo } from "@/lib/types";
import { CheckCircle2, Circle, Star, BookOpen, Flame, Trophy, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import LoginPage from "./login/page";

export default function HomePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [mood, setMood] = useState<string>("");
  const [moodAyah, setMoodAyah] = useState<any>(null);
  const [moodExplanation, setMoodExplanation] = useState("");
  const [loadingAyah, setLoadingAyah] = useState(false);
  const todayTasks = getTodaysTasks();
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user) {
      getUserTasksForDate(user.uid, today).then((tasks) => {
        setCompletedTaskIds(new Set(tasks.map((t) => t.taskId)));
        setLoadingTasks(false);
      });
    }
  }, [user, today]);

  async function handleMoodSelect(selectedMood: string) {
    setMood(selectedMood);
    setLoadingAyah(true);
    setMoodExplanation("");
    try {
      const results = await getAyahsForMood(selectedMood);
      if (results.length === 0) { setLoadingAyah(false); return; }
      const ayahData = results[Math.floor(Math.random() * results.length)];
      setMoodAyah(ayahData);

      fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `I'm feeling ${selectedMood}. The Quran verse ${ayahData.surah.englishName} ${ayahData.numberInSurah} says: "${ayahData.translation}". Give me a brief, warm, personal explanation of how this verse relates to my feeling. Keep it under 100 words.`,
            },
          ],
        }),
      })
        .then((r) => r.json())
        .then((data) => setMoodExplanation(data.content || ""))
        .catch(() => {});
    } catch {
      toast.error("Failed to load ayah");
    }
    setLoadingAyah(false);
  }

  async function handleCustomSituation(text: string) {
    setMood("");
    setLoadingAyah(true);
    setMoodExplanation("");
    setMoodAyah(null);
    try {
      const results = await searchAyahs(text);
      if (results.length === 0) {
        toast.error("No matching ayahs found");
        setLoadingAyah(false);
        return;
      }
      const ayahData = results[0];
      setMoodAyah(ayahData);

      fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `The user described their situation: "${text}". The Quran verse ${ayahData.surah.englishName} ${ayahData.numberInSurah} says: "${ayahData.translation}". Give a brief, warm, personal explanation of how this verse relates to their situation. Keep it under 100 words.`,
            },
          ],
        }),
      })
        .then((r) => r.json())
        .then((data) => setMoodExplanation(data.content || ""))
        .catch(() => {});
    } catch {
      toast.error("Failed to find ayah");
    }
    setLoadingAyah(false);
  }

  async function handleCompleteTask(taskId: string, xpReward: number) {
    if (!user || completedTaskIds.has(taskId) || pendingTaskIds.has(taskId)) return;

    setPendingTaskIds((prev) => new Set(prev).add(taskId));
    setCompletedTaskIds((prev) => new Set(prev).add(taskId));

    try {
      await completeTask(user.uid, taskId, today, xpReward);
      refreshProfile().catch(() => undefined);
      toast.success(`+${xpReward} Hasanat earned!`);
    } catch {
      setCompletedTaskIds((prev) => {
        const updated = new Set(prev);
        updated.delete(taskId);
        return updated;
      });
      toast.error("Failed to complete task");
    } finally {
      setPendingTaskIds((prev) => {
        const updated = new Set(prev);
        updated.delete(taskId);
        return updated;
      });
    }
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

  return (
    <PageContainer size="wide" className="space-y-10 home-page-cards">
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

      {/* Mood Selector */}
      <div className="glass-strong rounded-2xl p-7">
        <MoodSelector onSelect={handleMoodSelect} onCustomSituation={handleCustomSituation} selected={mood} loading={loadingAyah} />

        {loadingAyah && (
          <div className="mt-6 flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {moodAyah && !loadingAyah && (
          <div className="mt-6">
            <AyahCard
              text={moodAyah.text}
              translation={moodAyah.translation}
              surahName={moodAyah.surah.englishName}
              ayahNumber={moodAyah.number}
              numberInSurah={moodAyah.numberInSurah}
              verseKey={moodAyah.verseKey}
              explanation={moodExplanation}
            />
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
            return (
              <button
                key={task.id}
                onClick={() => handleCompleteTask(task.id, task.xpReward)}
                disabled={done || pending || loadingTasks}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  done
                    ? "bg-[rgba(108,36,112,0.58)] border-accent/35"
                    : "glass border-white/25 hover:border-accent/25 hover:bg-accent/8"
                }`}
              >
                {done ? (
                  <CheckCircle2 size={22} className="text-secondary shrink-0" />
                ) : pending ? (
                  <Loader2 size={22} className="text-secondary shrink-0 animate-spin" />
                ) : (
                  <Circle size={22} className="text-primary/25 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? "text-secondary" : "text-primary"}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-primary/50 truncate">{task.description}</p>
                </div>
                <span className="text-xs font-medium text-secondary bg-accent/15 px-2 py-1 rounded-full">
                  +{task.xpReward}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
