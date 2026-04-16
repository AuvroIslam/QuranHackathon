"use client";

import { useAuth } from "@/components/AuthProvider";
import LevelBadge from "@/components/LevelBadge";
import XPBar from "@/components/XPBar";
import StreakBadge from "@/components/StreakBadge";
import PageContainer from "../../components/PageContainer";
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
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile.xp);

  return (
    <PageContainer size="default" className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Your Spiritual Journey</h1>
        <p className="text-primary/50 mt-1">Progress through the stations of faith</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex-1">
          <XPBar xp={profile.xp} />
        </div>
        <StreakBadge streak={profile.streak} />
      </div>

      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-secondary/25">
          <span className="text-3xl font-bold text-white">{levelInfo.current.level}</span>
        </div>
        <h2 className="text-xl font-bold text-primary">{levelInfo.current.name}</h2>
        <p className="text-lg text-primary/35">{levelInfo.current.nameAr}</p>
        <p className="text-sm text-primary/50 mt-2">{levelInfo.current.description}</p>
        <p className="text-2xl font-bold text-secondary mt-4">{profile.xp} Hasanat</p>
      </div>

      <LevelBadge xp={profile.xp} />
    </PageContainer>
  );
}
