export interface UserProfile {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  lastActive: string;
  createdAt: string;
  dailyGoal?: number;
}

export interface UserTask {
  id: string;
  userId: string;
  taskId: string;
  date: string;
  completedAt: string;
  xpReward: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  content: string;
  title: string;
  type: "question" | "reflection";
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LevelInfo {
  current: { name: string; minXP: number; maxXP: number };
  next: { name: string; minXP: number } | null;
  progress: number;
}

export function getLevelInfo(xp: number): LevelInfo {
  const levels = [
    { name: "Sabr", minXP: 0, maxXP: 199 },
    { name: "Shukr", minXP: 200, maxXP: 499 },
    { name: "Tawakkul", minXP: 500, maxXP: 999 },
    { name: "Ihsan", minXP: 1000, maxXP: 1999 },
    { name: "Taqwa", minXP: 2000, maxXP: Infinity },
  ];
  const idx = levels.findIndex((l, i) =>
    xp >= l.minXP && (i === levels.length - 1 || xp < levels[i + 1].minXP)
  );
  const current = levels[Math.max(0, idx)];
  const next = idx < levels.length - 1 ? levels[idx + 1] : null;
  const progress = next
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100;
  return { current, next, progress: Math.min(100, Math.max(0, progress)) };
}
