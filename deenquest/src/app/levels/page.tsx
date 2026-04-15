"use client";

import { useAuth } from "@/components/AuthProvider";
import LevelBadge from "@/components/LevelBadge";
import XPBar from "@/components/XPBar";
import StreakBadge from "@/components/StreakBadge";
import { getLevelInfo } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LevelsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile.xp);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Spiritual Journey</h1>
        <p className="text-gray-500 mt-1">Progress through the stations of faith</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex-1">
          <XPBar xp={profile.xp} />
        </div>
        <StreakBadge streak={profile.streak} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
        <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-white">{levelInfo.current.level}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{levelInfo.current.name}</h2>
        <p className="text-lg text-gray-400">{levelInfo.current.nameAr}</p>
        <p className="text-sm text-gray-500 mt-2">{levelInfo.current.description}</p>
        <p className="text-2xl font-bold text-emerald-600 mt-4">{profile.xp} Hasanat</p>
      </div>

      <LevelBadge xp={profile.xp} />
    </div>
  );
}
