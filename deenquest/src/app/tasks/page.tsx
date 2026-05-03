"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { getTodaysTasks } from "@/lib/tasks-data";
import { getUserTasksForDate, completeTask } from "@/lib/firestore";
import { getStreakStatus } from "@/lib/streakUtils";
import PageContainer from "../../components/PageContainer";
import {
  CheckCircle2, ChevronDown, ChevronUp, Circle,
  BookOpen, Flame, Loader2, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function TasksPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = getTodaysTasks();

  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserTasksForDate(user.uid, today).then((tasks) => {
      setCompletedTaskIds(new Set(tasks.map((t) => t.taskId)));
      setLoadingTasks(false);
    });
  }, [user, today]);

  async function handleComplete(taskId: string, xpReward: number, isStreakRecovery: boolean) {
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

  const streakStatus = getStreakStatus(profile?.lastSessionDate, profile?.streak ?? 0);
  const completedCount = todayTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const completedRecovery = completedCount;
  const recoveryUnlocked =
    streakStatus.status === "recovery"
      ? completedRecovery >= streakStatus.tasksNeeded
      : true;

  return (
    <PageContainer size="default" className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Daily Deeds</h1>
        <p className="text-white/50 mt-1">Good deeds inspired by the Quran</p>
      </div>

      {/* Streak recovery banner */}
      {streakStatus.status === "recovery" && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/30">
          <AlertTriangle size={18} className="text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-300">
              {recoveryUnlocked
                ? "Streak saved! Now complete your daily session."
                : streakStatus.tasksNeeded === 1
                ? `Complete 1 deed here to save your ${streakStatus.streak}-day streak`
                : `Complete all 3 deeds to save your ${streakStatus.streak}-day streak`}
            </p>
            {!recoveryUnlocked && (
              <p className="text-xs text-orange-400/70 mt-0.5">
                {completedRecovery}/{streakStatus.tasksNeeded} done
              </p>
            )}
          </div>
        </div>
      )}

      {/* Progress summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-white/50">
          {completedCount}/{todayTasks.length} completed today
        </p>
        {completedCount === todayTasks.length && (
          <p className="text-sm font-semibold text-accent">MashaAllah! All done ✓</p>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {todayTasks.map((task) => {
          const done = completedTaskIds.has(task.id);
          const pending = pendingTaskIds.has(task.id);
          const expanded = expandedTaskId === task.id;

          const recoveryNeeded = streakStatus.status === "recovery"
            ? streakStatus.tasksNeeded - completedRecovery
            : 0;
          const taskRecoveryIndex = todayTasks
            .filter((t) => !completedTaskIds.has(t.id))
            .findIndex((t) => t.id === task.id);
          const showSavesStreak =
            streakStatus.status === "recovery" &&
            !recoveryUnlocked &&
            !done &&
            taskRecoveryIndex < recoveryNeeded;

          const isRecoveryTask =
            streakStatus.status === "recovery" && !recoveryUnlocked && !done;

          return (
            <div
              key={task.id}
              className={`rounded-2xl border transition-all ${
                done
                  ? "bg-accent/20 border-accent/30"
                  : "glass border-white/15 hover:border-accent/25"
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                <button
                  type="button"
                  onClick={() => handleComplete(task.id, task.xpReward, isRecoveryTask)}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${done ? "text-accent line-through" : "text-white"}`}>
                            {task.title}
                          </span>
                          {showSavesStreak && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-300 bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 rounded-full">
                              <Flame size={10} />
                              Saves streak
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/45 mt-0.5">{task.description}</p>
                      </div>
                      {expanded
                        ? <ChevronUp size={16} className="text-white/40 mt-0.5 shrink-0" />
                        : <ChevronDown size={16} className="text-white/40 mt-0.5 shrink-0" />}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11px] text-white/50 bg-white/8 px-2 py-0.5 rounded-full border border-white/10">
                      {formatCategory(task.category)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <BookOpen size={11} />
                      <span>{task.ayahRef}</span>
                    </div>
                    <span className="text-xs font-semibold text-secondary bg-accent/15 px-2 py-0.5 rounded-full">
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
    </PageContainer>
  );
}
