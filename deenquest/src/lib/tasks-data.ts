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

export function getTasksForDate(date: Date): Task[] {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const startIndex = dayOfYear % DAILY_TASKS.length;
  const tasks: Task[] = [];
  for (let i = 0; i < 3; i++) {
    tasks.push(DAILY_TASKS[(startIndex + i) % DAILY_TASKS.length]);
  }
  return tasks;
}

export function getTodaysTasks(): Task[] {
  return getTasksForDate(new Date());
}
