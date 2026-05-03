export type UserGoal = 'complete' | 'learn';
export type UserLevel = 'newbie' | 'intermediate' | 'fluent';
export type TimePerDay = 3 | 5 | 10;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  goalSet?: boolean;
  lastActive: string;
  lastSessionDate?: string;
  createdAt: string;
  goal?: UserGoal | null;
  level?: UserLevel | null;
  timePerDay?: TimePerDay | null;
  quranProgress?: { surahNumber: number; ayahNumber: number } | null;
  currentDay?: number;
  sessionDate?: string;
  sessionsToday?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  ayahRef: string;
  quranGuidance: string;
  deedBenefit: string;
  xpReward: number;
  category: string;
}

export interface UserTask {
  userId: string;
  taskId: string;
  completed: boolean;
  date: string;
  isStreakRecovery?: boolean;
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

export interface MCQData {
  question: string;
  options: string[];
  correctIndex: number;
}
