"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTasksForDate, DAILY_TASKS } from "@/lib/tasks-data";
import { getUserTasksForDate, completeTask, completeBonusTask } from "@/lib/firestore";
import PageContainer from "../../components/PageContainer";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, BookOpen, Sparkles, Loader2, Trophy } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Task, UserTask } from "@/lib/types";

interface WeeklyDayProgress {
  date: string;
  weekday: string;
  dayNumber: number;
  completedCount: number;
  totalCount: number;
  isToday: boolean;
}

interface WeeklyDayProgressInternal extends WeeklyDayProgress {
  completedIds: Set<string>;
  dayTasks: Task[];
  completedTasks: UserTask[];
}

const BONUS_XP_REWARD = 10;

function toIsoDateOnly(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getSortedCategoriesByCount(categoryCounts: Record<string, number>) {
  return Object.entries(categoryCounts)
    .sort((a, b) => a[1] - b[1])
    .map(([category]) => category);
}

function getLowestCategoryNudge(sortedCategories: string[]) {
  const lowest = sortedCategories[0];
  return lowest ? `${formatCategory(lowest)} is low this week, try one today.` : "";
}

function getBonusTaskForCategories(
  sortedCategories: string[],
  todayTasks: Task[],
  excludedTaskIds: Set<string>
) {
  const todayTaskIds = new Set(todayTasks.map((task) => task.id));
  for (const category of sortedCategories) {
    const candidate = DAILY_TASKS.find(
      (task) =>
        task.category === category &&
        !todayTaskIds.has(task.id) &&
        !excludedTaskIds.has(task.id)
    );
    if (candidate) return candidate;
  }
  return null;
}

export default function TasksPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [today] = useState(() => toIsoDateOnly(new Date()));
  const [todayTasks] = useState<Task[]>(() => getTasksForDate(new Date()));
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyDayProgress[]>([]);
  const [weeklyCategoryCounts, setWeeklyCategoryCounts] = useState<Record<string, number>>({});
  const [categoryNudge, setCategoryNudge] = useState("");
  const [bonusTask, setBonusTask] = useState<Task | null>(null);
  const [completedBonusTask, setCompletedBonusTask] = useState<Task | null>(null);
  const [bonusDoneToday, setBonusDoneToday] = useState(false);
  const [completedBonusSourceIdsToday, setCompletedBonusSourceIdsToday] = useState<Set<string>>(new Set());
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [pendingBonus, setPendingBonus] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [bonusDetailsOpen, setBonusDetailsOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    let cancelled = false;

    async function loadTaskProgress() {
      try {
        setLoadingTasks(true);
        const now = new Date();
        const pastWeek = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(now);
          date.setDate(now.getDate() - (6 - index));
          return date;
        });

        const dayProgress: WeeklyDayProgressInternal[] = await Promise.all(
          pastWeek.map(async (date) => {
            const dateKey = toIsoDateOnly(date);
            const completedTasks = await getUserTasksForDate(uid, dateKey);
            const completedIds = new Set(completedTasks.map((task) => task.taskId));
            const dayTasks = getTasksForDate(date);

            return {
              date: dateKey,
              weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
              dayNumber: date.getDate(),
              completedCount: dayTasks.filter((task) => completedIds.has(task.id)).length,
              totalCount: dayTasks.length,
              isToday: dateKey === today,
              completedIds,
              dayTasks,
              completedTasks,
            };
          })
        );

        if (cancelled) return;

        const categoryCounts = DAILY_TASKS.reduce<Record<string, number>>((acc, task) => {
          if (!(task.category in acc)) acc[task.category] = 0;
          return acc;
        }, {});

        dayProgress.forEach((day) => {
          day.dayTasks.forEach((task) => {
            if (day.completedIds.has(task.id)) {
              categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
            }
          });

          day.completedTasks.forEach((task) => {
            if (task.isBonus && task.bonusCategory) {
              categoryCounts[task.bonusCategory] = (categoryCounts[task.bonusCategory] || 0) + 1;
            }
          });
        });

        const todayProgress = dayProgress.find((day) => day.isToday);
        const todayCompletedTasks = todayProgress?.completedTasks || [];
        const todayBonusSourceIds = new Set(
          todayCompletedTasks
            .filter((task) => task.isBonus && task.sourceTaskId)
            .map((task) => task.sourceTaskId as string)
        );
        const completedBonusRecord = todayCompletedTasks.find(
          (task) => task.isBonus && task.sourceTaskId
        );
        const completedBonusTaskFromHistory = completedBonusRecord?.sourceTaskId
          ? DAILY_TASKS.find((task) => task.id === completedBonusRecord.sourceTaskId) || null
          : null;
        const todayHasBonus = todayCompletedTasks.some((task) => task.isBonus);
        const sortedCategories = getSortedCategoriesByCount(categoryCounts);

        setCompletedTaskIds(todayProgress ? todayProgress.completedIds : new Set());
        setCompletedBonusSourceIdsToday(todayBonusSourceIds);
        setBonusDoneToday(todayHasBonus);
        setCompletedBonusTask(completedBonusTaskFromHistory);
        setWeeklyCategoryCounts(categoryCounts);
        setCategoryNudge(getLowestCategoryNudge(sortedCategories));
        setBonusTask(
          todayHasBonus
            ? null
            : getBonusTaskForCategories(sortedCategories, todayTasks, todayBonusSourceIds)
        );
        setWeeklyProgress(
          dayProgress.map((day) => ({
            date: day.date,
            weekday: day.weekday,
            dayNumber: day.dayNumber,
            completedCount: day.completedCount,
            totalCount: day.totalCount,
            isToday: day.isToday,
          }))
        );
      } catch {
        if (!cancelled) {
          setLoadingTasks(false);
          toast.error("Failed to load task progress");
        }
        return;
      }

      setLoadingTasks(false);
    }

    loadTaskProgress();

    return () => {
      cancelled = true;
    };
  }, [user, today, todayTasks]);

  function updateCategoryProgress(category: string, delta: number, recomputeBonusTask: boolean) {
    setWeeklyCategoryCounts((prev) => {
      const updated = {
        ...prev,
        [category]: Math.max(0, (prev[category] || 0) + delta),
      };
      const sortedCategories = getSortedCategoriesByCount(updated);
      setCategoryNudge(getLowestCategoryNudge(sortedCategories));
      if (recomputeBonusTask && !bonusDoneToday) {
        setBonusTask(
          getBonusTaskForCategories(
            sortedCategories,
            todayTasks,
            completedBonusSourceIdsToday
          )
        );
      }
      return updated;
    });
  }

  async function handleComplete(taskId: string, xpReward: number) {
    if (!user || completedTaskIds.has(taskId) || pendingTaskIds.has(taskId)) return;

    const completedTask = todayTasks.find((task) => task.id === taskId);
    setPendingTaskIds((prev) => new Set(prev).add(taskId));
    setCompletedTaskIds((prev) => new Set(prev).add(taskId));
    setWeeklyProgress((prev) =>
      prev.map((day) =>
        day.isToday && day.completedCount < day.totalCount
          ? { ...day, completedCount: day.completedCount + 1 }
          : day
      )
    );
    if (completedTask) {
      updateCategoryProgress(completedTask.category, 1, true);
    }

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
      setWeeklyProgress((prev) =>
        prev.map((day) =>
          day.isToday && day.completedCount > 0
            ? { ...day, completedCount: day.completedCount - 1 }
            : day
        )
      );
      if (completedTask) {
        updateCategoryProgress(completedTask.category, -1, true);
      }
      toast.error("Failed to complete task");
    } finally {
      setPendingTaskIds((prev) => {
        const updated = new Set(prev);
        updated.delete(taskId);
        return updated;
      });
    }
  }

  async function handleCompleteBonus() {
    if (!user || !bonusTask || bonusDoneToday || pendingBonus) return;

    const selectedBonusTask = bonusTask;
    setPendingBonus(true);
    setBonusDoneToday(true);
    setCompletedBonusTask(selectedBonusTask);
    setBonusTask(null);
    setCompletedBonusSourceIdsToday((prev) => new Set(prev).add(selectedBonusTask.id));
    updateCategoryProgress(selectedBonusTask.category, 1, false);

    try {
      await completeBonusTask(
        user.uid,
        `bonus-${selectedBonusTask.id}`,
        today,
        BONUS_XP_REWARD,
        selectedBonusTask.category,
        selectedBonusTask.id
      );

      refreshProfile().catch(() => undefined);
      toast.success(`Bonus deed completed! +${BONUS_XP_REWARD} Hasanat`);
    } catch (error) {
      const isAlreadyCompleted =
        error instanceof Error && error.message.includes("already completed");

      if (isAlreadyCompleted) {
        const todayCompletedTasks = await getUserTasksForDate(user.uid, today);
        const completedBonusRecord = todayCompletedTasks.find(
          (task) => task.isBonus && task.sourceTaskId
        );
        const completedBonusTaskFromHistory = completedBonusRecord?.sourceTaskId
          ? DAILY_TASKS.find((task) => task.id === completedBonusRecord.sourceTaskId) || selectedBonusTask
          : selectedBonusTask;

        setBonusDoneToday(true);
        setCompletedBonusTask(completedBonusTaskFromHistory);
        setBonusTask(null);
        toast.error("You can complete only one bonus deed per day");
      } else {
        setBonusDoneToday(false);
        setCompletedBonusTask(null);
        setBonusTask(selectedBonusTask);
        setCompletedBonusSourceIdsToday((prev) => {
          const updated = new Set(prev);
          updated.delete(selectedBonusTask.id);
          return updated;
        });
        updateCategoryProgress(selectedBonusTask.category, -1, true);
        toast.error("Failed to complete bonus deed");
      }
    } finally {
      setPendingBonus(false);
    }
  }

  function toggleTaskDetails(taskId: string) {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fullyCompletedDays = weeklyProgress.filter(
    (day) => day.completedCount === day.totalCount
  ).length;
  const bonusDisplayTask = bonusDoneToday ? (completedBonusTask ?? bonusTask) : bonusTask;

  return (
    <PageContainer
      size="default"
      className="space-y-8"
      tooltipTitle="Daily Tasks"
      tooltipDescription={[
        "Complete daily good deeds inspired by the Quran.",
        "Earn Hasanat, build streaks, and track your weekly balance.",
        "Take the bonus deed for extra progress.",
      ]}
    >
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Daily Deeds</h1>
            <p className="text-primary/50 mt-1">
              Complete good deeds inspired by the Quran to earn Hasanat
            </p>
          </div>
          <Link
            href="/levels"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/20 border border-secondary/30 text-secondary text-sm font-semibold hover:bg-secondary/30 transition-all shrink-0"
          >
            <Trophy size={15} />
            My Levels
          </Link>
        </div>

        {/* Progress */}
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-4xl font-bold text-secondary">
            {todayTasks.filter((t) => completedTaskIds.has(t.id)).length}/{todayTasks.length}
          </p>
          <p className="text-sm text-primary/50 mt-1">tasks completed today</p>
          {todayTasks.every((t) => completedTaskIds.has(t.id)) && (
            <p className="text-sm text-secondary font-medium mt-2">
              All tasks completed! MashaAllah!
            </p>
          )}
        </div>

        {/* Today's Tasks */}
        <div>
          <h3 className="font-semibold text-primary mb-4">Today&apos;s Tasks</h3>
          <div className="space-y-3">
            {todayTasks.map((task) => {
              const done = completedTaskIds.has(task.id);
              const pending = pendingTaskIds.has(task.id);
              const expanded = expandedTaskId === task.id;
              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    done
                      ? "bg-[rgba(108,36,112,0.72)] border-accent/40"
                      : "bg-[rgba(20,20,40,0.68)] border-white/20 backdrop-blur-[18px]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleComplete(task.id, task.xpReward)}
                      disabled={done || pending}
                      className="mt-0.5"
                    >
                      {done ? (
                        <CheckCircle2 size={24} className="text-secondary" />
                      ) : pending ? (
                        <Loader2 size={24} className="text-secondary animate-spin" />
                      ) : (
                        <Circle size={24} className="text-primary/25 hover:text-accent transition-colors" />
                      )}
                    </button>
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => toggleTaskDetails(task.id)}
                        className="w-full text-left"
                        aria-expanded={expanded}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h4
                            className={`font-medium ${
                              done ? "text-secondary line-through" : "text-primary"
                            }`}
                          >
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-secondary bg-accent/15 px-3 py-1 rounded-full">
                              +{task.xpReward} XP
                            </span>
                            {expanded ? (
                              <ChevronUp size={16} className="text-primary/50" />
                            ) : (
                              <ChevronDown size={16} className="text-primary/50" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-primary/50 mt-1">{task.description}</p>
                      </button>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-secondary bg-accent/15 px-2 py-0.5 rounded-full">
                          {formatCategory(task.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                        <BookOpen size={12} />
                        <span>Quran {task.ayahRef}</span>
                      </div>
                      {expanded ? (
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
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonus Deed */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-primary">Bonus Deed</h3>
            <span className="text-xs text-secondary bg-accent/15 px-3 py-1 rounded-full">
              Optional +{BONUS_XP_REWARD} XP
            </span>
          </div>
          <p className="text-sm text-primary/50 mb-4">
            One optional extra deed from your lowest category this week.
          </p>

          {loadingTasks ? (
            <p className="text-sm text-primary/50">Loading bonus deed...</p>
          ) : bonusDisplayTask ? (
            <div
              className={`rounded-2xl border p-5 transition-all ${
                bonusDoneToday
                  ? "bg-[rgba(108,36,112,0.72)] border-accent/40"
                  : "bg-[rgba(20,20,40,0.68)] border-white/20 backdrop-blur-[18px]"
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={handleCompleteBonus}
                  disabled={bonusDoneToday || pendingBonus}
                  className="mt-0.5"
                >
                  {bonusDoneToday ? (
                    <CheckCircle2 size={24} className="text-secondary" />
                  ) : pendingBonus ? (
                    <Loader2 size={24} className="text-secondary animate-spin" />
                  ) : (
                    <Circle size={24} className="text-primary/25 hover:text-accent transition-colors" />
                  )}
                </button>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setBonusDetailsOpen((prev) => !prev)}
                    className="w-full text-left"
                    aria-expanded={bonusDetailsOpen}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-secondary" />
                        <span className="text-xs text-secondary">Suggested from low category</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-secondary bg-accent/15 px-3 py-1 rounded-full">
                          +{BONUS_XP_REWARD} XP
                        </span>
                        {bonusDetailsOpen ? (
                          <ChevronUp size={16} className="text-primary/50" />
                        ) : (
                          <ChevronDown size={16} className="text-primary/50" />
                        )}
                      </div>
                    </div>
                    <h4
                      className={`font-medium mt-1 ${
                        bonusDoneToday ? "text-secondary line-through" : "text-primary"
                      }`}
                    >
                      {bonusDisplayTask.title}
                    </h4>
                    <p
                      className={`text-sm mt-1 ${bonusDoneToday ? "text-primary/45" : "text-primary/50"}`}
                    >
                      {bonusDisplayTask.description}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-secondary bg-accent/15 px-2 py-0.5 rounded-full">
                      {formatCategory(bonusDisplayTask.category)}
                    </span>
                    <span className="text-xs text-primary/45">Quran {bonusDisplayTask.ayahRef}</span>
                  </div>
                  {bonusDetailsOpen ? (
                    <div className="mt-3 rounded-xl border border-white/15 bg-[rgba(20,20,40,0.64)] p-3 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-secondary">What Quran says</p>
                        <p className="text-sm text-primary/75 leading-relaxed mt-1">{bonusDisplayTask.quranGuidance}</p>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div>
                        <p className="text-xs font-medium text-secondary">Benefit and reward</p>
                        <p className="text-sm text-primary/75 leading-relaxed mt-1">{bonusDisplayTask.deedBenefit}</p>
                        
                      </div>
                    </div>
                  ) : null}
                  {bonusDoneToday ? (
                    <p className="text-xs text-primary/45 mt-2">Come back tomorrow for a new bonus deed.</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-primary/50">No bonus deed available right now.</p>
          )}
        </div>

        {/* Weekly Streak */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">7-Day Streak</h3>
            <span className="text-xs text-primary/50">
              {fullyCompletedDays}/7 full days
            </span>
          </div>

          {loadingTasks ? (
            <p className="text-sm text-primary/50">Loading streak data...</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weeklyProgress.map((day) => {
                const isFull = day.completedCount === day.totalCount;
                const isPartial = day.completedCount > 0 && !isFull;
                const stateClasses = isFull
                  ? "bg-linear-to-br from-secondary/55 to-accent/35 border-secondary/70 shadow-secondary/25"
                  : isPartial
                    ? "bg-linear-to-br from-accent/32 to-accent/20 border-accent/70 shadow-accent/20"
                    : "bg-white/20 border-white/28";
                const todayClasses = day.isToday
                  ? "ring-1 ring-white/50 border-white/70"
                  : "";

                return (
                  <div key={day.date} className="text-center">
                    <p className={`text-[11px] ${day.isToday ? "text-primary/70" : "text-primary/50"}`}>
                      {day.weekday}
                    </p>
                    <div
                      className={`relative mt-1 rounded-xl py-3 border backdrop-blur-sm shadow-md transition-all ${stateClasses} ${todayClasses}`}
                    >
                      {day.isToday ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-white/90"
                        />
                      ) : null}
                      {isFull ? (
                        <CheckCircle2 size={12} className="absolute right-2 top-2 text-white/90" />
                      ) : null}
                      <p className={`text-sm font-semibold ${isFull ? "text-white" : "text-primary"}`}>
                        {day.dayNumber}
                      </p>
                      <p
                        className={`mt-0.5 text-[10px] ${
                          isFull ? "text-white/85" : isPartial ? "text-primary/75" : "text-primary/50"
                        }`}
                      >
                        {day.completedCount}/{day.totalCount}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-primary/45 mt-3">
            Bright card means all deeds completed, pink card means partial progress, and a subtle marker highlights the current day.
          </p>
          {profile?.streak ? (
            <p className="text-xs text-secondary mt-1">Current streak: {profile.streak} day(s)</p>
          ) : null}
        </div>

        {/* Deed Categories Balance */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-primary mb-4">Deed Categories Balance</h3>
          {loadingTasks ? (
            <p className="text-sm text-primary/50">Loading category balance...</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(weeklyCategoryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between rounded-xl border border-white/15 bg-[rgba(20,20,40,0.68)] px-4 py-2"
                  >
                    <span className="text-sm text-primary">{formatCategory(category)}</span>
                    <span className="text-xs font-medium text-secondary">{count} completed</span>
                  </div>
                ))}
            </div>
          )}

          {categoryNudge ? (
            <p className="text-xs text-accent mt-3">{categoryNudge}</p>
          ) : null}
        </div>
    </PageContainer>
  );
}
