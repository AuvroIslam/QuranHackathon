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
