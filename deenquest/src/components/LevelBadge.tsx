"use client";

import { useState } from "react";
import { LEVELS, getLevelInfo } from "@/lib/types";
import { Lock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface LevelBadgeProps {
  xp: number;
}

export default function LevelBadge({ xp }: LevelBadgeProps) {
  const { current } = getLevelInfo(xp);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(current.level);

  function toggleLevel(levelNumber: number) {
    setExpandedLevel((prev) => (prev === levelNumber ? null : levelNumber));
  }

  return (
    <div className="space-y-3">
      {LEVELS.map((level) => {
        const unlocked = xp >= level.xpRequired;
        const isCurrent = level.level === current.level;
        const expanded = expandedLevel === level.level;
        return (
          <div
            key={level.level}
            className={`p-4 rounded-2xl border transition-all ${
              isCurrent
                ? "bg-[rgba(108,36,112,0.72)] border-accent/40 ring-1 ring-accent/35 shadow-lg shadow-secondary/20"
                : unlocked
                ? "glass-card border-white/20"
                : "bg-[rgba(20,20,40,0.68)] border-white/20"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleLevel(level.level)}
              className="w-full flex items-center gap-4 text-left"
              aria-expanded={expanded}
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
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-primary/35 font-medium whitespace-nowrap">
                  {level.xpRequired} XP
                </span>
                {expanded ? (
                  <ChevronUp size={16} className="text-primary/50" />
                ) : (
                  <ChevronDown size={16} className="text-primary/50" />
                )}
              </div>
            </button>

            {expanded ? (
              <div className="mt-3 ml-16 rounded-xl border border-white/15 bg-[rgba(20,20,40,0.64)] p-3 space-y-2">
                <div>
                  <p className="text-xs font-medium text-secondary">Importance</p>
                  <p className="text-sm text-primary/75 leading-relaxed mt-1">{level.importance}</p>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="text-xs font-medium text-secondary">Prophet Story</p>
                  <p className="text-sm text-primary/75 leading-relaxed mt-1">{level.prophetStory}</p>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
