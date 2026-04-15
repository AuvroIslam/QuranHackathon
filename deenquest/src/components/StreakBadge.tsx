"use client";

import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
      <Flame size={20} className={streak > 0 ? "text-orange-500" : "text-gray-300"} />
      <div>
        <p className="text-lg font-bold text-orange-700">{streak}</p>
        <p className="text-xs text-orange-500">day streak</p>
      </div>
    </div>
  );
}
