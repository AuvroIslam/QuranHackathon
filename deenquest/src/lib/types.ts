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
  isBonus?: boolean;
  bonusCategory?: string;
  sourceTaskId?: string;
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

export interface LevelStation {
  level: number;
  name: string;
  nameAr: string;
  xpRequired: number;
  description: string;
  importance: string;
  prophetStory: string;
}

export const LEVELS: LevelStation[] = [
  {
    level: 1,
    name: "Sabr",
    nameAr: "الصبر",
    xpRequired: 0,
    description: "Patience – The foundation of faith",
    importance: "Sabr keeps your heart steady during tests and helps you obey Allah even when life feels difficult.",
    prophetStory: "Prophet Ayyub (AS) endured years of illness and loss with patience, and Allah restored his health, family, and honor.",
  },
  {
    level: 2,
    name: "Shukr",
    nameAr: "الشكر",
    xpRequired: 200,
    description: "Gratitude – Recognizing blessings",
    importance: "Shukr turns ordinary moments into worship and protects the heart from negativity and envy.",
    prophetStory: "Prophet Sulaiman (AS) thanked Allah for his kingdom and wisdom, and his gratitude increased both his blessings and humility.",
  },
  {
    level: 3,
    name: "Tawakkul",
    nameAr: "التوكل",
    xpRequired: 500,
    description: "Trust in Allah – Reliance on the Divine",
    importance: "Tawakkul gives peace after effort: you do your part sincerely, then place outcomes in Allah's hands.",
    prophetStory: "When Prophet Musa (AS) faced the sea with his people trapped behind him, he trusted Allah and a path opened where none seemed possible.",
  },
  {
    level: 4,
    name: "Ihsan",
    nameAr: "الإحسان",
    xpRequired: 1000,
    description: "Excellence – Worshipping as if you see Him",
    importance: "Ihsan means doing every deed with sincerity, beauty, and awareness that Allah sees you.",
    prophetStory: "Prophet Yusuf (AS) chose integrity over temptation and remained excellent in character, and Allah raised him to leadership and honor.",
  },
  {
    level: 5,
    name: "Taqwa",
    nameAr: "التقوى",
    xpRequired: 2000,
    description: "God-consciousness – The highest station",
    importance: "Taqwa is a constant awareness of Allah that guides choices, protects from sin, and brings clarity.",
    prophetStory: "Prophet Nuh (AS) stayed firm in obedience for many years despite rejection, and Allah granted him protection, victory, and lasting legacy.",
  },
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
