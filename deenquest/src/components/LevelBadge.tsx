"use client";

import { LEVELS, getLevelInfo } from "@/lib/types";
import { Lock, CheckCircle2 } from "lucide-react";

interface LevelBadgeProps {
  xp: number;
}

export default function LevelBadge({ xp }: LevelBadgeProps) {
  const { current } = getLevelInfo(xp);

  return (
    <div className="space-y-3">
      {LEVELS.map((level) => {
        const unlocked = xp >= level.xpRequired;
        const isCurrent = level.level === current.level;
        return (
          <div
            key={level.level}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              isCurrent
                ? "bg-secondary-dark  border-secondary/55 ring-1 ring-white shadow-lg shadow-secondary/20"
                : unlocked
                ? "glass-card border-white/20"
                : "bg-[rgba(20,20,40,0.68)] border-white/20"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                isCurrent
                  ? "bg-white text-secondary-dark shadow-lg shadow-secondary/25"
                  : unlocked
                  ? "bg-accent/15 text-secondary"
                  : "bg-white/20 text-primary/35"
              }`}
            >
              {unlocked ? level.level : <Lock size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-primary">{level.name}</h3>
                <span className="text-base text-primary/35">{level.nameAr}</span>
                {unlocked && !isCurrent && <CheckCircle2 size={16} className="text-secondary" />}
              </div>
              <p className="text-sm text-primary/50">{level.description}</p>
            </div>
            <span className="text-xs text-primary/35 font-medium whitespace-nowrap">
              {level.xpRequired} XP
            </span>
          </div>
        );
      })}
    </div>
  );
}
