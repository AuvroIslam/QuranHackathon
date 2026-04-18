"use client";

import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <div className="flex items-center gap-2 bg-[rgba(20,20,40,0.68)] px-4 py-2 rounded-2xl border border-white/20 backdrop-blur-[18px]">
      <Flame size={20} className={streak > 0 ? "text-secondary" : "text-primary/25"} />
      <div>
        <p className="text-lg font-bold text-secondary">{streak}</p>
        <p className="text-xs text-primary/70">day streak</p>
      </div>
    </div>
  );
}
