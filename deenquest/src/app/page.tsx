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
  BookOpen, Flame, Loader2, AlertTriangle, XCircle, Check, Moon, X, Zap,
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
  const [sessionInProgress, setSessionInProgress] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    setSessionInProgress(sessionStorage.getItem("deenquest_session_in_progress") === "true");
    Promise.all([
      getUserTasksForDate(user.uid, today),
      getDailySessionCount(user.uid),
    ])
      .then(([tasks, count]) => {
        setCompletedTaskIds(new Set(tasks.map((t) => t.taskId)));
        setSessionsToday(count);
      })
      .catch((err) => {
        console.error("Failed to load home data:", err);
      })
      .finally(() => {
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
      toast.success(`+${xpReward} XP earned!`);
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

  const MAX_SESSIONS = 3;
  const isLearn = profile.goal === "learn";
  const sessionDone = sessionsToday > 0;
  const sessionMaxed = sessionsToday >= MAX_SESSIONS;

  // Hero card text — mirrors mobile HomeScreen
  let heroTitle = sessionInProgress && !sessionDone
    ? "Continue Your Journey"
    : "Start Today's Quran Journey";
  let heroSubtitle = sessionInProgress && !sessionDone
    ? "Pick up where you left off"
    : sessionDone
    ? "Another session, another step closer"
    : "Personalised ayah based on your mood";

  let buttonLabel = "Begin Now";
  if (sessionMaxed) buttonLabel = `${MAX_SESSIONS}/${MAX_SESSIONS} sessions done`;
  else if (sessionInProgress && !sessionDone) buttonLabel = "Continue";
  else if (sessionDone) buttonLabel = "Keep Going";

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

      {/* Streak Week Widget */}
      {(() => {
        const today = new Date();
        const dow = today.getDay();
        const monFirst = (dow + 6) % 7;
        const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const lastDate = profile.lastSessionDate ? new Date(profile.lastSessionDate) : null;
        const streakStart = lastDate ? new Date(lastDate) : null;
        if (streakStart) streakStart.setDate(lastDate!.getDate() - Math.max((profile.streak ?? 0) - 1, 0));

        const todayMidnight = new Date(today); todayMidnight.setHours(0, 0, 0, 0);

        const weekDays = DAY_LABELS.map((label, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - monFirst + i);
          d.setHours(0, 0, 0, 0);
          const isFuture = d > todayMidnight;
          const isToday = d.getTime() === todayMidnight.getTime();
          if (!lastDate || !streakStart) return { label, completed: false, missed: false, isFuture, isToday };
          const start = new Date(streakStart); start.setHours(0, 0, 0, 0);
          const end = new Date(lastDate); end.setHours(0, 0, 0, 0);
          const completed = d >= start && d <= end;
          return { label, completed, missed: !completed && d < todayMidnight, isFuture, isToday };
        });

        return (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center">
                <Flame size={20} className="text-purple-400" fill="#a855f7" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Streak</p>
                <p className="text-xl font-extrabold text-white leading-none">
                  {profile.streak ?? 0} <span className="text-sm font-medium text-white/50">days</span>
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">XP</p>
                <p className="text-xl font-extrabold text-white leading-none flex items-center gap-1">
                  <Zap size={14} className="text-purple-400" fill="#a855f7" />
                  {profile.xp ?? 0}
                </p>
              </div>
            </div>
            <div className="h-px bg-white/10 mb-4" />
            <div className="flex justify-between">
              {weekDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-white/40 font-semibold">{day.label.charAt(0)}</span>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    day.completed
                      ? "bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/25"
                      : day.missed
                      ? "bg-red-500/15 border-red-500/40"
                      : day.isToday
                      ? "bg-white/8 border-purple-400"
                      : "bg-white/8 border-white/15"
                  }`}>
                    {day.completed && <Check size={14} className="text-white" strokeWidth={3} />}
                    {day.missed && <X size={12} className="text-red-400" strokeWidth={2.5} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
              src={sessionMaxed ? "/celebrating-removebg-preview.png" : sessionDone ? "/thumbsUp_Encouraging-removebg-preview.png" : "/waving_onboarding-removebg-preview.png"}
              alt="Character"
              width={100}
              height={115}
              className="object-contain drop-shadow-lg"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-1">
            {sessionMaxed ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 mb-2">
                  <Moon size={10} className="text-purple-400" />
                  <span className="text-[10px] font-bold text-purple-300">3/3 sessions done</span>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">Amazing work today!</h2>
                <p className="text-sm text-white/70 mt-1">Next session unlocks tomorrow. Still want an ayah?</p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">
                  {isLearn ? "Lesson" : "Reading"}
                </p>
                <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">{heroTitle}</h2>
                <p className="text-sm text-white/70 mt-1">{heroSubtitle}</p>

                {/* Streak pill */}
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                  <Flame size={13} className="text-purple-400" />
                  <span className="text-xs font-bold text-white/80">
                    {profile.streak || 0} day streak
                  </span>
                </div>
                {/* Quran progress pill (complete mode only) */}
                {!isLearn && profile.quranProgress && (
                  <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/40">
                    <BookOpen size={13} className="text-purple-300" />
                    <span className="text-xs font-bold text-purple-300">
                      Surah {profile.quranProgress.surahNumber}, Ayah {profile.quranProgress.ayahNumber}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Button */}
        <div className="relative px-5 pb-5 md:px-7 md:pb-7">
          {sessionMaxed ? (
            <button
              onClick={() => router.push("/session?ayahOnly=true")}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-[0.98] active:brightness-95"
              style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", boxShadow: "0 4px 20px rgba(168,85,247,0.35)" }}
            >
              Get an Ayah
            </button>
          ) : (
            <button
              onClick={() => {
                if (streakStatus.status === "recovery" && !recoveryUnlocked) {
                  setShowRecoveryModal(true);
                } else {
                  router.push("/session");
                }
              }}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-[0.98] active:brightness-95"
              style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", boxShadow: "0 4px 20px rgba(168,85,247,0.35)" }}
            >
              {buttonLabel}
            </button>
          )}
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
                className={`rounded-2xl border text-left transition-all backdrop-blur-xl  ${
                  done
                    ? "bg-purple-950/30 border-accent/40"
                    : "bg-[#15163a]/30 border-white/20 hover:border-accent/50 hover:bg-[#1a1b45]/90"
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

      {/* Recovery Modal */}
      {showRecoveryModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowRecoveryModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{ background: "linear-gradient(160deg, #1e1040 0%, #12082a 100%)", border: "1px solid rgba(255,255,255,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto" style={{ background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.3)" }}>
              <Flame size={26} className="text-orange-400" fill="#fb923c" />
            </div>

            {/* Text */}
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-extrabold text-white">Save Your Streak</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                You need to complete{" "}
                <span className="text-orange-300 font-semibold">
                  {streakStatus.status === "recovery"
                    ? `${streakStatus.tasksNeeded - completedRecoveryTasks} more bonus deed${streakStatus.tasksNeeded - completedRecoveryTasks === 1 ? "" : "s"}`
                    : "bonus deeds"}
                </span>
                {" "}to protect your{" "}
                <span className="text-orange-300 font-semibold">
                  {streakStatus.status === "recovery" ? streakStatus.streak : profile.streak}-day streak
                </span>.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 hover:shadow-2xl hover:shadow-orange-500/50 active:scale-[0.98] active:brightness-95"
                style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", boxShadow: "0 4px 16px rgba(249,115,22,0.35)" }}
              >
                Finish bonus deeds
              </button>
              <button
                onClick={() => { setShowRecoveryModal(false); router.push("/session"); }}
                className="w-full py-3 rounded-2xl font-semibold text-sm text-white/60 hover:text-white/80 hover:bg-white/5 active:scale-[0.98] transition-all"
              >
                Proceed anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
