"use client";

import { getLevelInfo } from "@/lib/types";

interface XPBarProps {
  xp: number;
}

export default function XPBar({ xp }: XPBarProps) {
  const { current, nextLevel, progress } = getLevelInfo(xp);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">
          Level {current.level} - {current.name}
        </span>
        {nextLevel && (
          <span className="text-xs text-gray-400">
            {nextLevel.xpRequired - xp} XP to {nextLevel.name}
          </span>
        )}
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
