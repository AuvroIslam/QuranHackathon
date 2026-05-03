"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PageContainer from "../components/PageContainer";
import { getTodaysTasks } from "@/lib/tasks-data";
import { getUserTasksForDate, completeTask, getDailySessionCount } from "@/lib/firestore";
import { getStreakStatus } from "@/lib/streakUtils";
import {
  CheckCircle2, ChevronDown, ChevronUp, Circle,
  BookOpen, Flame, Loader2, AlertTriangle, XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function HomePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const todayTasks = getTodaysTasks();
  const today = new Date().toISOString().split("T")[0];

  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [sessionsToday, setSessionsToday] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserTasksForDate(user.uid, today),
      getDailySessionCount(user.uid),
    ]).then(([tasks, count]) => {
      setCompletedTaskIds(new Set(tasks.map((t) => t.taskId)));
      setSessionsToday(count);
      setLoadingTasks(false);
    });
  }, [user, today]);

  async function handleCompleteTask(taskId: string, xpReward: number, isStreakRecovery: boolean) {
    if (!user || completedTaskIds.has(taskId) || pendingTaskIds.has(taskId)) return;
    setPendingTaskIds((prev) => new Set(prev).add(taskId));
    setCompletedTaskIds((prev) => new Set(prev).add(taskId));
    try {
      await completeTask(user.uid, taskId, today, xpReward, isStreakRecovery);
      refreshProfile().catch(() => undefined);
      toast.success(`+${xpReward} Hasanat earned!`);
    } catch {
      setCompletedTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
      toast.error("Failed to complete task");
    } finally {
      setPendingTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const streakStatus = getStreakStatus(profile.lastSessionDate, profile.streak);
  const completedRecoveryTasks = todayTasks.filter(
    (t) => completedTaskIds.has(t.id)
  ).length;
  const recoveryUnlocked =
    streakStatus.status === "recovery"
      ? completedRecoveryTasks >= streakStatus.tasksNeeded
      : true;

  const isLearn = profile.goal === "learn";
  const sessionDone = sessionsToday > 0;

  let heroTitle = isLearn ? "Today's Lesson" : "Today's Reading";
  let heroSubtitle = "";
  if (isLearn) {
    heroSubtitle = profile.currentDay ? `Day ${profile.currentDay}` : "Day 1";
  } else {
    const p = profile.quranProgress;
    heroSubtitle = p ? `Surah ${p.surahNumber}, Ayah ${p.ayahNumber}` : "Al-Fatiha, Ayah 1";
  }

  let buttonLabel = "Begin Now";
  if (sessionDone) buttonLabel = "Keep Going";

  return (
    <PageContainer size="wide" className="space-y-8">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Assalamu Alaikum, {profile.name?.split(" ")[0]}
        </h1>
        <p className="text-white/50 mt-1">Your daily Quran journey continues here</p>
      </div>

      {/* Streak Recovery / Broken Banner */}
      {streakStatus.status === "recovery" && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/30">
          <AlertTriangle size={18} className="text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-300">
              {recoveryUnlocked
                ? "Streak saved! Complete your session to lock it in."
                : streakStatus.tasksNeeded === 1
                ? `Complete 1 bonus deed to save your ${streakStatus.streak}-day streak`
                : `Complete all 3 bonus deeds to save your ${streakStatus.streak}-day streak`}
            </p>
            {!recoveryUnlocked && (
              <p className="text-xs text-orange-400/70 mt-0.5">
                {completedRecoveryTasks}/{streakStatus.tasksNeeded} deeds done
              </p>
            )}
          </div>
        </div>
      )}

      {streakStatus.status === "broken" && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-red-500/15 border border-red-500/30">
          <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-300">
            Streak lost. Start fresh today — every journey begins with one step.
          </p>
        </div>
      )}

      {/* Hero Card */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(108,36,112,0.85) 0%, rgba(40,20,80,0.95) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url(/cardBg1.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative flex items-end gap-4 p-5 pt-6 md:p-7">
          {/* Character image */}
          <div className="shrink-0 self-end">
            <Image
              src={sessionDone ? "/thumbsUp_Encouraging-removebg-preview.png" : "/waving_onboarding-removebg-preview.png"}
              alt="Character"
              width={100}
              height={115}
              className="object-contain drop-shadow-lg"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">
              {isLearn ? "Lesson" : "Reading"}
            </p>
            <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">{heroTitle}</h2>
            <p className="text-sm text-white/70 mt-1">{heroSubtitle}</p>

            {/* Streak pill */}
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/10 border border-white/15">
              <Flame size={13} className="text-orange-400" />
              <span className="text-xs font-bold text-white/80">
                {profile.streak || 0} day streak
              </span>
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="relative px-5 pb-5 md:px-7 md:pb-7">
          <button
            onClick={() => router.push("/session")}
            disabled={streakStatus.status === "recovery" && !recoveryUnlocked}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
              boxShadow: "0 4px 20px rgba(168,85,247,0.35)",
            }}
          >
            {streakStatus.status === "recovery" && !recoveryUnlocked
              ? "Complete bonus deeds first"
              : buttonLabel}
          </button>
        </div>
      </div>

      {/* Bonus Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Today&apos;s Bonus Deeds</h3>
          <span className="text-xs text-white/40">
            {todayTasks.filter((t) => completedTaskIds.has(t.id)).length}/{todayTasks.length} done
          </span>
        </div>

        <div className="space-y-3">
          {todayTasks.map((task) => {
            const done = completedTaskIds.has(task.id);
            const pending = pendingTaskIds.has(task.id);
            const expanded = expandedTaskId === task.id;
            const isRecoveryTask =
              streakStatus.status === "recovery" && !recoveryUnlocked && !done;
            const recoveryTaskIndex = todayTasks
              .filter((t) => !completedTaskIds.has(t.id))
              .findIndex((t) => t.id === task.id);
            const showSavesStreak =
              isRecoveryTask &&
              recoveryTaskIndex < streakStatus.tasksNeeded - completedRecoveryTasks;

            return (
              <div
                key={task.id}
                className={`rounded-2xl border text-left transition-all ${
                  done
                    ? "bg-accent/20 border-accent/30"
                    : "glass border-white/15 hover:border-accent/30"
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => handleCompleteTask(task.id, task.xpReward, isRecoveryTask)}
                    disabled={done || pending || loadingTasks}
                    className="shrink-0 mt-0.5"
                  >
                    {done ? (
                      <CheckCircle2 size={22} className="text-accent" />
                    ) : pending ? (
                      <Loader2 size={22} className="text-accent animate-spin" />
                    ) : (
                      <Circle size={22} className="text-white/25 hover:text-accent transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setExpandedTaskId((prev) => (prev === task.id ? null : task.id))}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${done ? "text-accent" : "text-white"}`}>
                              {task.title}
                            </p>
                            {showSavesStreak && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-300 bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 rounded-full">
                                <Flame size={10} />
                                Saves streak
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/45 mt-0.5 truncate">{task.description}</p>
                        </div>
                        {expanded ? (
                          <ChevronUp size={16} className="text-white/40 mt-0.5 shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="text-white/40 mt-0.5 shrink-0" />
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-secondary">
                        <BookOpen size={11} />
                        <span>{task.ayahRef}</span>
                      </div>
                      <span className="text-xs font-medium text-secondary bg-accent/15 px-2 py-0.5 rounded-full">
                        +{task.xpReward} XP
                      </span>
                    </div>

                    {expanded && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-secondary">What Quran says</p>
                          <p className="text-xs text-white/65 leading-relaxed mt-1">{task.quranGuidance}</p>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div>
                          <p className="text-xs font-semibold text-secondary">Benefit & reward</p>
                          <p className="text-xs text-white/65 leading-relaxed mt-1">{task.deedBenefit}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
