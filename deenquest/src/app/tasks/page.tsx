"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodaysTasks, DAILY_TASKS } from "@/lib/tasks-data";
import { getUserTasksForDate, completeTask } from "@/lib/firestore";
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
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Deeds</h1>
        <p className="text-gray-500 mt-1">
          Complete good deeds inspired by the Quran to earn Hasanat
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
        <p className="text-4xl font-bold text-emerald-600">
          {todayTasks.filter((t) => completedTaskIds.has(t.id)).length}/{todayTasks.length}
        </p>
        <p className="text-sm text-gray-500 mt-1">tasks completed today</p>
        {todayTasks.every((t) => completedTaskIds.has(t.id)) && (
          <p className="text-sm text-emerald-600 font-medium mt-2">
            All tasks completed! MashaAllah!
          </p>
        )}
      </div>

      {/* Today's Tasks */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Today&apos;s Tasks</h3>
        <div className="space-y-3">
          {todayTasks.map((task) => {
            const done = completedTaskIds.has(task.id);
            return (
              <div
                key={task.id}
                className={`p-5 rounded-xl border transition-all ${
                  done ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-100"
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleComplete(task.id, task.xpReward)}
                    disabled={done}
                    className="mt-0.5"
                  >
                    {done ? (
                      <CheckCircle2 size={24} className="text-emerald-600" />
                    ) : (
                      <Circle size={24} className="text-gray-300 hover:text-emerald-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-medium ${
                          done ? "text-emerald-700 line-through" : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </h4>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        +{task.xpReward} XP
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
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
        <h3 className="font-semibold text-gray-900 mb-4">All Available Deeds</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {DAILY_TASKS.map((task) => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {task.category}
                </span>
                <span className="text-xs font-medium text-gray-400">+{task.xpReward} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
