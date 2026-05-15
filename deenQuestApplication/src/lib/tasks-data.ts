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

export const DAILY_TASKS: Task[] = [
  { id: 'task-1', title: 'Read 1 page of Quran', description: 'Open the Quran and read at least one page with reflection.', ayahRef: '73:20', quranGuidance: 'Allah tells us to recite from the Quran what is easy for us.', deedBenefit: 'Strengthen your daily bond with the Quran.', xpReward: 15, category: 'reading' },
  { id: 'task-2', title: 'Give a sincere compliment', description: "Brighten someone's day with genuine, kind words.", ayahRef: '2:83', quranGuidance: 'Allah commands speaking good to people.', deedBenefit: 'Spread positivity and build better relationships.', xpReward: 8, category: 'kindness' },
  { id: 'task-3', title: 'Make dua for someone', description: 'Pray for a friend, family member, or even a stranger.', ayahRef: '40:60', quranGuidance: 'Allah says, Call upon Me, and I will respond.', deedBenefit: 'Increase compassion and remember Allah more often.', xpReward: 8, category: 'prayer' },
  { id: 'task-4', title: 'Give charity (sadaqah)', description: 'Give something in charity, no matter how small.', ayahRef: '2:261', quranGuidance: 'Allah compares charity to a seed that multiplies many times.', deedBenefit: 'Purify wealth and help someone in need.', xpReward: 15, category: 'charity' },
  { id: 'task-5', title: 'Memorize a short ayah', description: 'Pick a short ayah and commit it to memory.', ayahRef: '54:17', quranGuidance: 'Allah says the Quran has been made easy for remembrance.', deedBenefit: 'Carry divine words in your heart.', xpReward: 20, category: 'memorization' },
  { id: 'task-6', title: 'Forgive someone', description: 'Let go of a grudge and forgive someone in your heart.', ayahRef: '3:134', quranGuidance: 'Allah praises those who pardon people.', deedBenefit: 'Free your heart from anger and gain inner peace.', xpReward: 12, category: 'character' },
  { id: 'task-7', title: 'Help a neighbor', description: 'Do something helpful for your neighbor today.', ayahRef: '4:36', quranGuidance: 'Allah commands excellence toward neighbors.', deedBenefit: 'Build trust in your community.', xpReward: 10, category: 'kindness' },
  { id: 'task-8', title: 'Reflect on a Quranic story', description: 'Read a story from the Quran and write what you learned.', ayahRef: '12:111', quranGuidance: 'Quranic stories contain lessons for people of understanding.', deedBenefit: 'Learn practical wisdom and strengthen iman.', xpReward: 15, category: 'reflection' },
  { id: 'task-9', title: 'Practice patience today', description: 'When something frustrates you, respond with patience.', ayahRef: '2:153', quranGuidance: 'Allah tells believers to seek help through patience and prayer.', deedBenefit: 'Gain emotional control and reduce conflict.', xpReward: 10, category: 'character' },
  { id: 'task-10', title: 'Listen to Quran recitation', description: 'Listen to at least 5 minutes of beautiful Quran recitation.', ayahRef: '7:204', quranGuidance: 'Allah commands attentive listening when the Quran is recited.', deedBenefit: 'Calm your heart and open yourself to mercy.', xpReward: 8, category: 'listening' },
  { id: 'task-11', title: 'Share an ayah with someone', description: 'Share a meaningful ayah with a friend or family member.', ayahRef: '3:104', quranGuidance: 'Allah calls for a community that invites to good.', deedBenefit: 'Spread benefit beyond yourself.', xpReward: 10, category: 'dawah' },
  { id: 'task-12', title: 'Avoid backbiting for the day', description: 'Be mindful of your speech and avoid talking about others negatively.', ayahRef: '49:12', quranGuidance: 'Allah warns strongly against backbiting.', deedBenefit: 'Purify your speech and prevent hidden sins.', xpReward: 12, category: 'character' },
];

/** Days since the Unix epoch in the local timezone — a stable per-calendar-day seed. */
function epochDay(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  );
}

/** Deterministic seeded PRNG (mulberry32) — same seed → same sequence. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Picks 3 distinct tasks that change every calendar day. Each day's pool is a
 * fresh seeded Fisher–Yates shuffle of the full bank, so consecutive days get
 * genuinely different deeds (not a fixed window sliding by one).
 */
export function getTasksForDate(date: Date): Task[] {
  const rng = mulberry32(epochDay(date) * 2654435761);
  const idx = DAILY_TASKS.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, 3).map((i) => DAILY_TASKS[i]);
}

export function getTodaysTasks(): Task[] {
  return getTasksForDate(new Date());
}
