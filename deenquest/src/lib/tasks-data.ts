import type { Task } from "./types";

export const DAILY_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Read 1 page of Quran",
    description: "Open the Quran and read at least one page with reflection.",
    ayahRef: "73:20",
    xpReward: 30,
    category: "reading",
  },
  {
    id: "task-2",
    title: "Give a sincere compliment",
    description: "Brighten someone's day with genuine, kind words.",
    ayahRef: "2:83",
    xpReward: 20,
    category: "kindness",
  },
  {
    id: "task-3",
    title: "Make dua for someone",
    description: "Pray for a friend, family member, or even a stranger.",
    ayahRef: "40:60",
    xpReward: 25,
    category: "prayer",
  },
  {
    id: "task-4",
    title: "Give charity (sadaqah)",
    description: "Give something in charity, no matter how small.",
    ayahRef: "2:261",
    xpReward: 35,
    category: "charity",
  },
  {
    id: "task-5",
    title: "Memorize a short ayah",
    description: "Pick a short ayah and commit it to memory.",
    ayahRef: "54:17",
    xpReward: 40,
    category: "memorization",
  },
  {
    id: "task-6",
    title: "Forgive someone",
    description: "Let go of a grudge and forgive someone in your heart.",
    ayahRef: "3:134",
    xpReward: 30,
    category: "character",
  },
  {
    id: "task-7",
    title: "Help a neighbor",
    description: "Do something helpful for your neighbor today.",
    ayahRef: "4:36",
    xpReward: 25,
    category: "kindness",
  },
  {
    id: "task-8",
    title: "Reflect on a Quranic story",
    description: "Read a story from the Quran and write what you learned.",
    ayahRef: "12:111",
    xpReward: 35,
    category: "reflection",
  },
  {
    id: "task-9",
    title: "Practice patience today",
    description: "When something frustrates you, respond with patience.",
    ayahRef: "2:153",
    xpReward: 25,
    category: "character",
  },
  {
    id: "task-10",
    title: "Listen to Quran recitation",
    description: "Listen to at least 5 minutes of beautiful Quran recitation.",
    ayahRef: "7:204",
    xpReward: 20,
    category: "listening",
  },
  {
    id: "task-11",
    title: "Share an ayah with someone",
    description: "Share a meaningful ayah with a friend or family member.",
    ayahRef: "3:104",
    xpReward: 25,
    category: "dawah",
  },
  {
    id: "task-12",
    title: "Avoid backbiting for the day",
    description: "Be mindful of your speech and avoid talking about others negatively.",
    ayahRef: "49:12",
    xpReward: 30,
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
