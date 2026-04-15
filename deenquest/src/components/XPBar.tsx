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
        <span className="text-xs font-medium text-primary/60">
          Level {current.level} - {current.name}
        </span>
        {nextLevel && (
          <span className="text-xs text-primary/35">
            {nextLevel.xpRequired - xp} XP to {nextLevel.name}
          </span>
        )}
      </div>
      <div className="h-2.5 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-secondary to-secondary-dark rounded-full transition-all duration-700 shadow-sm shadow-secondary/30"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
