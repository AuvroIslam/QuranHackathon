export interface UserProfile {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  lastActive: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  ayahRef: string;
  xpReward: number;
  category: string;
}

export interface UserTask {
  userId: string;
  taskId: string;
  completed: boolean;
  date: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  type: "question" | "reflection";
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
}

export interface Answer {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
  parentId?: string;
  replyToName?: string;
}

export interface Ayah {
  number: number;
  text: string;
  surah: { number: number; name: string; englishName: string };
  numberInSurah: number;
  translation?: string;
  verseKey?: string;
  audioUrl?: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const LEVELS = [
  { level: 1, name: "Sabr", nameAr: "الصبر", xpRequired: 0, description: "Patience – The foundation of faith" },
  { level: 2, name: "Shukr", nameAr: "الشكر", xpRequired: 200, description: "Gratitude – Recognizing blessings" },
  { level: 3, name: "Tawakkul", nameAr: "التوكل", xpRequired: 500, description: "Trust in Allah – Reliance on the Divine" },
  { level: 4, name: "Ihsan", nameAr: "الإحسان", xpRequired: 1000, description: "Excellence – Worshipping as if you see Him" },
  { level: 5, name: "Taqwa", nameAr: "التقوى", xpRequired: 2000, description: "God-consciousness – The highest station" },
];

export function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) current = level;
    else break;
  }
  const nextLevel = LEVELS.find((l) => l.level === current.level + 1);
  const xpForNext = nextLevel ? nextLevel.xpRequired - xp : 0;
  const progress = nextLevel
    ? ((xp - current.xpRequired) / (nextLevel.xpRequired - current.xpRequired)) * 100
    : 100;
  return { current, nextLevel, xpForNext, progress: Math.min(100, Math.max(0, progress)) };
}
