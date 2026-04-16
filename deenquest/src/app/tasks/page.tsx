"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodaysTasks, DAILY_TASKS } from "@/lib/tasks-data";
import { getUserTasksForDate, completeTask } from "@/lib/firestore";
import PageContainer from "../../components/PageContainer";
import { CheckCircle2, Circle, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

export default function TasksPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const todayTasks = getTodaysTasks();
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      getUserTasksForDate(user.uid, today).then((tasks) => {
        setCompletedTaskIds(new Set(tasks.map((t) => t.taskId)));
        setLoadingTasks(false);
      });
    }
  }, [user, today]);

  async function handleComplete(taskId: string, xpReward: number) {
    if (!user || completedTaskIds.has(taskId)) return;
    try {
      await completeTask(user.uid, taskId, today, xpReward);
      setCompletedTaskIds((prev) => new Set(prev).add(taskId));
      await refreshProfile();
      toast.success(`+${xpReward} Hasanat earned!`);
    } catch {
      toast.error("Failed to complete task");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageContainer size="default" className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Daily Deeds</h1>
        <p className="text-primary/50 mt-1">
          Complete good deeds inspired by the Quran to earn Hasanat
        </p>
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
            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border transition-all ${
                  done ? "bg-accent/10 border-accent/25" : "glass-card"
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleComplete(task.id, task.xpReward)}
                    disabled={done}
                    className="mt-0.5"
                  >
                    {done ? (
                      <CheckCircle2 size={24} className="text-secondary" />
                    ) : (
                      <Circle size={24} className="text-primary/25 hover:text-accent transition-colors" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-medium ${
                          done ? "text-secondary line-through" : "text-primary"
                        }`}
                      >
                        {task.title}
                      </h4>
                      <span className="text-xs font-medium text-secondary bg-accent/15 px-3 py-1 rounded-full">
                        +{task.xpReward} XP
                      </span>
                    </div>
                    <p className="text-sm text-primary/50 mt-1">{task.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                      <BookOpen size={12} />
                      <span>Quran {task.ayahRef}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Tasks Overview */}
      <div>
        <h3 className="font-semibold text-primary mb-4">All Available Deeds</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {DAILY_TASKS.map((task) => (
            <div key={task.id} className="glass-card rounded-2xl p-4">
              <h4 className="font-medium text-primary text-sm">{task.title}</h4>
              <p className="text-xs text-primary/50 mt-1">{task.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-secondary bg-accent/15 px-2 py-0.5 rounded-full">
                  {task.category}
                </span>
                <span className="text-xs font-medium text-primary/35">+{task.xpReward} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
