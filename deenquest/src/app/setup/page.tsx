"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, GraduationCap, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { saveUserGoal } from "@/lib/firestore";
import { initiateQFOAuth } from "@/lib/qf-user-auth";
import type { UserGoal, UserLevel, TimePerDay } from "@/lib/types";

type WizardStep = "goal" | "level" | "time" | "quran-connect";

const MASCOTS: Record<WizardStep, string> = {
  goal: "/waving_onboarding-removebg-preview.png",
  level: "/achievement-removebg-preview.png",
  time: "/reading-removebg-preview.png",
  "quran-connect": "/waving_onboarding-removebg-preview.png",
};

const MASCOT_SPEECH: Record<WizardStep, string> = {
  goal: "Assalamu Alaykum! What brings you here today? 🌙",
  level: "Great choice! How familiar are you with Arabic? 📖",
  time: "Almost there! How much time can you give each day? ⏰",
  "quran-connect": "One last thing — connect your Quran.com account to sync your progress! 🔗",
};

const LEVEL_IMAGES: Record<UserLevel, string> = {
  newbie: "/newbie_icon_purple(islamic_style)-_very_simple_202605030448.jpeg",
  intermediate: "/intermediatite_icon_islamic_style_,_202605030448.jpeg",
  fluent: "/expert_icon_islamic_style_,_202605030448.jpeg",
};

export default function SetupPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<WizardStep>("goal");
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [saving, setSaving] = useState(false);

  const stepNum =
    step === "goal" ? 1
    : step === "level" ? 2
    : step === "time" ? (goal === "learn" ? 3 : 2)
    : goal === "learn" ? 4 : 3;
  const totalSteps = goal === "learn" ? 4 : 3;

  function handleGoalSelect(selected: UserGoal) {
    setGoal(selected);
    if (selected === "learn") {
      setStep("level");
    } else {
      setStep("time");
    }
  }

  function handleLevelSelect(selected: UserLevel) {
    setLevel(selected);
    setStep("time");
  }

  async function handleTimeSelect(time: TimePerDay) {
    if (!user || !goal) return;
    setSaving(true);
    try {
      await saveUserGoal(user.uid, goal, { level: level ?? undefined, timePerDay: time });
      await refreshProfile();
      setStep("quran-connect");
    } catch {
      // keep saving=false so user can retry
    } finally {
      setSaving(false);
    }
  }

  function handleQFConnect() {
    initiateQFOAuth().catch(console.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < stepNum ? "bg-accent" : "bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Mascot + speech bubble */}
        <div className="flex items-end gap-4 mb-6">
          <div className="shrink-0">
            <Image
              src={MASCOTS[step]}
              alt="Mascot"
              width={90}
              height={100}
              className="object-contain"
            />
          </div>
          <div className="relative flex-1 glass-card rounded-2xl rounded-bl-sm p-4 mb-4">
            <div
              className="absolute -left-2.5 bottom-4 w-0 h-0"
              style={{
                borderTop: "8px solid transparent",
                borderBottom: "8px solid transparent",
                borderRight: "12px solid rgba(255,255,255,0.08)",
              }}
            />
            <p className="text-sm font-semibold text-white/90">{MASCOT_SPEECH[step]}</p>
          </div>
        </div>

        {/* Step header */}
        <div className="mb-6">
          <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
            Step {stepNum} of {totalSteps}
          </p>
          <h1 className="text-2xl font-bold text-white">
            {step === "goal" ? "What is your goal?"
              : step === "level" ? "What is your level?"
              : step === "time" ? "How much time per day?"
              : "Connect Quran.com"}
          </h1>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {step === "goal" && (
            <>
              <GoalCard
                icon={<BookOpen size={26} className="text-accent" />}
                title="Complete the Quran"
                description="Read and listen through all 114 surahs at your own pace"
                onPress={() => handleGoalSelect("complete")}
              />
              <GoalCard
                icon={<GraduationCap size={26} className="text-accent" />}
                title="Learn to Read Quran"
                description="Build your Arabic reading skill from letters to full verses"
                onPress={() => handleGoalSelect("learn")}
              />
            </>
          )}

          {step === "level" && (
            <>
              <LevelCard
                imageSrc={LEVEL_IMAGES.newbie}
                title="Newbie"
                desc="I don't know Arabic letters yet"
                detail="Letters → Al-Fatiha in 10 days"
                onPress={() => handleLevelSelect("newbie")}
              />
              <LevelCard
                imageSrc={LEVEL_IMAGES.intermediate}
                title="Intermediate"
                desc="I know the letters and basics"
                detail="Short surahs with transliteration support"
                onPress={() => handleLevelSelect("intermediate")}
              />
              <LevelCard
                imageSrc={LEVEL_IMAGES.fluent}
                title="Fluent"
                desc="I can read, just need practice"
                detail="Powerful verses — no transliteration"
                onPress={() => handleLevelSelect("fluent")}
              />
            </>
          )}

          {step === "time" && (
            <>
              <TimeCard
                minutes={3}
                estimate={goal === "complete" ? "~3 years to complete Quran" : "~3 exercises per session"}
                onPress={() => handleTimeSelect(3)}
                loading={saving}
              />
              <TimeCard
                minutes={5}
                estimate={goal === "complete" ? "~1.5 years to complete Quran" : "~5 exercises per session"}
                onPress={() => handleTimeSelect(5)}
                loading={saving}
              />
              <TimeCard
                minutes={10}
                estimate={goal === "complete" ? "~10 months to complete Quran" : "~10 exercises per session"}
                onPress={() => handleTimeSelect(10)}
                loading={saving}
              />
            </>
          )}

          {step === "quran-connect" && (
            <>
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex justify-center">
                  <Image
                    src="/quran.comLogo.png"
                    alt="Quran.com"
                    width={160}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <p className="text-white/55 text-sm text-center leading-relaxed">
                  Sync your bookmarks, reading goals, and streaks across all your devices.
                </p>
                <div className="space-y-2 pt-1">
                  {["Sync bookmarks & collections", "Track your reading streaks", "Cross-device progress"].map((b) => (
                    <div key={b} className="flex items-center gap-2 text-white/60 text-sm">
                      <span className="text-accent text-xs">●</span>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleQFConnect}
                className="w-full rounded-2xl p-4 flex items-center gap-4 text-left transition-all group border border-secondary/40 bg-linear-to-r from-secondary/20 to-secondary-dark/20 hover:from-secondary/30 hover:to-secondary-dark/30"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary/25 flex items-center justify-center shrink-0 group-hover:bg-secondary/35 transition-colors">
                  <BookOpen size={26} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">Connect Quran.com</p>
                  <p className="text-xs text-white/55 mt-0.5">You&apos;ll be redirected to authorise DeenQuest</p>
                </div>
                <span className="text-secondary text-lg font-bold shrink-0">→</span>
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full text-center text-white/40 text-sm py-2 hover:text-white/60 transition-colors"
              >
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-white/10 transition-all group"
    >
      <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center shrink-0 group-hover:bg-accent/25 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm">{title}</p>
        <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <span className="text-accent text-lg font-bold shrink-0">→</span>
    </button>
  );
}

function LevelCard({
  imageSrc,
  title,
  desc,
  detail,
  onPress,
}: {
  imageSrc: string;
  title: string;
  desc: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-white/10 transition-all group"
    >
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
        <Image src={imageSrc} alt={title} width={56} height={56} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm">{title}</p>
        <p className="text-xs text-white/55 mt-0.5">{desc}</p>
        <p className="text-xs text-white/35 mt-0.5">{detail}</p>
      </div>
      <span className="text-accent text-lg font-bold shrink-0">→</span>
    </button>
  );
}

function TimeCard({
  minutes,
  estimate,
  onPress,
  loading,
}: {
  minutes: number;
  estimate: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onPress}
      disabled={loading}
      className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-white/10 transition-all disabled:opacity-60 group"
    >
      <div className="w-14 h-14 rounded-full border-2 border-accent/40 bg-accent/10 flex flex-col items-center justify-center shrink-0">
        <span className="text-accent font-extrabold text-lg leading-none">{minutes}</span>
        <span className="text-white/40 text-[10px] font-semibold">min</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm">{minutes} minutes / day</p>
        <p className="text-xs text-white/55 mt-0.5">{estimate}</p>
      </div>
      {loading ? (
        <Loader2 size={20} className="text-accent animate-spin shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full border-2 border-accent/50 bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
          <Check size={14} className="text-accent" />
        </div>
      )}
    </button>
  );
}
