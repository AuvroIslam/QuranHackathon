"use client";

import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <div className="flex items-center gap-2 bg-accent/12 px-4 py-2 rounded-2xl border border-accent/20 backdrop-blur-sm">
      <Flame size={20} className={streak > 0 ? "text-secondary" : "text-primary/25"} />
      <div>
        <p className="text-lg font-bold text-secondary">{streak}</p>
        <p className="text-xs text-accent">day streak</p>
      </div>
    </div>
  );
}
