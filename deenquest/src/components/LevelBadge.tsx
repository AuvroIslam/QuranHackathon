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
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              isCurrent
                ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-300"
                : unlocked
                ? "bg-white border-gray-200"
                : "bg-gray-50 border-gray-100 opacity-60"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                isCurrent
                  ? "bg-emerald-600 text-white"
                  : unlocked
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {unlocked ? level.level : <Lock size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{level.name}</h3>
                <span className="text-base text-gray-400">{level.nameAr}</span>
                {unlocked && !isCurrent && <CheckCircle2 size={16} className="text-emerald-500" />}
              </div>
              <p className="text-sm text-gray-500">{level.description}</p>
            </div>
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
              {level.xpRequired} XP
            </span>
          </div>
        );
      })}
    </div>
  );
}
