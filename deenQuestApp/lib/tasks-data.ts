export interface Task {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  ayahRef: string;
  quranGuidance: string;
  deedBenefit: string;
}

const ALL_TASKS: Task[] = [
  { id: "t1", title: "Read 5 verses of Quran", description: "Open the Quran and read at least 5 verses mindfully.", xpReward: 20, ayahRef: "73:20", quranGuidance: "Read what is easy from the Quran.", deedBenefit: "Each letter brings 10 rewards." },
  { id: "t2", title: "Make morning Dhikr", description: "Say SubhanAllah, Alhamdulillah, Allahu Akbar 33 times each.", xpReward: 15, ayahRef: "33:41", quranGuidance: "Remember Allah with much remembrance.", deedBenefit: "Dhikr keeps the heart alive." },
  { id: "t3", title: "Pray Fajr on time", description: "Wake up and pray Fajr before sunrise.", xpReward: 25, ayahRef: "17:78", quranGuidance: "Establish prayer at the decline of the sun.", deedBenefit: "Fajr prayer is witnessed by angels." },
  { id: "t4", title: "Give Sadaqah today", description: "Give something in charity, even if small.", xpReward: 20, ayahRef: "2:261", quranGuidance: "Those who spend their wealth in Allah's cause are like a grain.", deedBenefit: "Sadaqah extinguishes sins like water extinguishes fire." },
  { id: "t5", title: "Listen to Quran recitation", description: "Listen to at least one surah with focus.", xpReward: 15, ayahRef: "7:204", quranGuidance: "When the Quran is recited, listen to it attentively.", deedBenefit: "Listening to Quran is an act of worship." },
  { id: "t6", title: "Make dua for someone", description: "Sincerely pray for a fellow Muslim.", xpReward: 10, ayahRef: "40:60", quranGuidance: "Call upon Me, I will respond to you.", deedBenefit: "Dua for others is answered by angels." },
  { id: "t7", title: "Read Surah Al-Kahf", description: "Read Surah Al-Kahf today.", xpReward: 30, ayahRef: "18:1", quranGuidance: "Blessed is He who revealed Al-Kahf.", deedBenefit: "Protection from Dajjal for the one who reads it on Friday." },
  { id: "t8", title: "Reflect on an ayah", description: "Pick one ayah and think about its meaning for 5 minutes.", xpReward: 15, ayahRef: "38:29", quranGuidance: "A blessed Book so they may ponder its verses.", deedBenefit: "Reflection on the Quran is the heart of worship." },
  { id: "t9", title: "Pray all 5 prayers", description: "Ensure you complete all 5 obligatory prayers today.", xpReward: 40, ayahRef: "2:238", quranGuidance: "Maintain with care the obligatory prayers.", deedBenefit: "The prayer is the pillar of the religion." },
  { id: "t10", title: "Seek forgiveness 10 times", description: "Say Astaghfirullah at least 10 times with sincerity.", xpReward: 10, ayahRef: "71:10", quranGuidance: "Ask forgiveness of your Lord. Indeed, He is ever forgiving.", deedBenefit: "Istighfar opens doors of provision." },
  { id: "t11", title: "Share Islamic knowledge", description: "Share one ayah or hadith with a friend or family.", xpReward: 15, ayahRef: "16:125", quranGuidance: "Invite to the way of your Lord with wisdom.", deedBenefit: "Conveying knowledge is continuous charity." },
  { id: "t12", title: "Fast a voluntary fast", description: "Fast voluntarily for the sake of Allah.", xpReward: 35, ayahRef: "2:183", quranGuidance: "Fasting has been prescribed upon you.", deedBenefit: "Fasting is a shield from hellfire." },
];

export function getTodaysTasks(): Task[] {
  const day = new Date().getDay();
  const start = (day * 3) % ALL_TASKS.length;
  return [
    ALL_TASKS[start % ALL_TASKS.length],
    ALL_TASKS[(start + 1) % ALL_TASKS.length],
    ALL_TASKS[(start + 2) % ALL_TASKS.length],
  ];
}
