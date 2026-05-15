import type { Task } from "./types";

export const DAILY_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Read 1 page of Quran",
    description: "Open the Quran and read at least one page with reflection.",
    ayahRef: "73:20",
    quranGuidance: "Allah tells us to recite from the Quran what is easy for us, showing that consistent recitation is beloved even when small.",
    deedBenefit: "You strengthen your daily bond with the Quran and gain calm, focus, and spiritual consistency.",
    xpReward: 15,
    category: "reading",
  },
  {
    id: "task-2",
    title: "Give a sincere compliment",
    description: "Brighten someone's day with genuine, kind words.",
    ayahRef: "2:83",
    quranGuidance: "Allah commands speaking good to people, so kind words are an act of obedience and mercy.",
    deedBenefit: "You spread positivity, heal hearts, and build better relationships through respectful speech.",
    xpReward: 8,
    category: "kindness",
  },
  {
    id: "task-3",
    title: "Make dua for someone",
    description: "Pray for a friend, family member, or even a stranger.",
    ayahRef: "40:60",
    quranGuidance: "Allah says, Call upon Me, and I will respond, teaching us to turn to Him and care for others through dua.",
    deedBenefit: "You increase compassion, remember Allah more often, and support others through sincere prayer.",
    xpReward: 8,
    category: "prayer",
  },
  {
    id: "task-4",
    title: "Give charity (sadaqah)",
    description: "Give something in charity, no matter how small.",
    ayahRef: "2:261",
    quranGuidance: "Allah compares charity to a seed that multiplies many times, showing how one sincere gift can grow greatly.",
    deedBenefit: "You purify wealth, help someone in need, and unlock multiplied reward by Allah's mercy.",
    xpReward: 15,
    category: "charity",
  },
  {
    id: "task-5",
    title: "Memorize a short ayah",
    description: "Pick a short ayah and commit it to memory.",
    ayahRef: "54:17",
    quranGuidance: "Allah says the Quran has been made easy for remembrance, encouraging us to memorize and reflect.",
    deedBenefit: "You carry divine words in your heart, improve focus, and keep guidance available throughout your day.",
    xpReward: 20,
    category: "memorization",
  },
  {
    id: "task-6",
    title: "Forgive someone",
    description: "Let go of a grudge and forgive someone in your heart.",
    ayahRef: "3:134",
    quranGuidance: "Allah praises those who pardon people, and He loves those who do good.",
    deedBenefit: "You free your heart from anger, gain inner peace, and move closer to Allah's love.",
    xpReward: 12,
    category: "character",
  },
  {
    id: "task-7",
    title: "Help a neighbor",
    description: "Do something helpful for your neighbor today.",
    ayahRef: "4:36",
    quranGuidance: "Allah commands excellence toward neighbors, making everyday service a form of worship.",
    deedBenefit: "You build trust in your community and turn ordinary kindness into lasting reward.",
    xpReward: 10,
    category: "kindness",
  },
  {
    id: "task-8",
    title: "Reflect on a Quranic story",
    description: "Read a story from the Quran and write what you learned.",
    ayahRef: "12:111",
    quranGuidance: "Allah says Quranic stories contain lessons for people of understanding, inviting reflection and action.",
    deedBenefit: "You learn practical wisdom, strengthen iman, and apply Quranic lessons to real life.",
    xpReward: 15,
    category: "reflection",
  },
  {
    id: "task-9",
    title: "Practice patience today",
    description: "When something frustrates you, respond with patience.",
    ayahRef: "2:153",
    quranGuidance: "Allah tells believers to seek help through patience and prayer, and promises He is with the patient.",
    deedBenefit: "You gain emotional control, reduce conflict, and receive support from Allah through sabr.",
    xpReward: 10,
    category: "character",
  },
  {
    id: "task-10",
    title: "Listen to Quran recitation",
    description: "Listen to at least 5 minutes of beautiful Quran recitation.",
    ayahRef: "7:204",
    quranGuidance: "Allah commands attentive listening when the Quran is recited so that mercy may be received.",
    deedBenefit: "You calm your heart, improve reverence for the Quran, and open yourself to Allah's mercy.",
    xpReward: 8,
    category: "listening",
  },
  {
    id: "task-11",
    title: "Share an ayah with someone",
    description: "Share a meaningful ayah with a friend or family member.",
    ayahRef: "3:104",
    quranGuidance: "Allah calls for a community that invites to good, so sharing guidance is a noble deed.",
    deedBenefit: "You spread benefit beyond yourself and can earn ongoing reward when others act on that reminder.",
    xpReward: 10,
    category: "dawah",
  },
  {
    id: "task-12",
    title: "Avoid backbiting for the day",
    description: "Be mindful of your speech and avoid talking about others negatively.",
    ayahRef: "49:12",
    quranGuidance: "Allah warns strongly against backbiting, teaching believers to protect others' honor and dignity.",
    deedBenefit: "You purify your speech, prevent hidden sins, and create a safer, more respectful social space.",
    xpReward: 12,
    category: "character",
  },
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
 * Picks 3 distinct tasks that change every calendar day. Each day's task pool
 * is a fresh seeded Fisher–Yates shuffle of the full bank, so consecutive days
 * get genuinely different deeds (not a fixed window sliding by one).
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
