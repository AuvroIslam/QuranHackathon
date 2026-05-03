import { Ayah, MCQData, Mood, SpeechResult } from '../types';

// Point to your deployed Next.js app. Change for local dev:
// export const API_BASE = 'http://192.168.x.x:3000'; // your local IP for device testing
export const API_BASE = 'https://quran-hackathon-omega.vercel.app';

// ── Curated ayah bank (fast, no network needed) ──────────────────────────────

const AYAH_BANK: Record<Mood | string, Ayah[]> = {
  stressed: [
    {
      reference: '94:5',
      arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
      transliteration: "Fa-inna ma'al 'usri yusraa",
      translation: 'For indeed, with hardship will be ease.',
      explanation: 'Allah promises that every difficulty carries relief within it — not after it, but with it.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/094005.mp3',
    },
    {
      reference: '2:286',
      arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      transliteration: "Laa yukallifullahu nafsan illaa wus'ahaa",
      translation: 'Allah does not burden a soul beyond that it can bear.',
      explanation: 'Whatever you are facing right now — Allah already knows you can handle it.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/002286.mp3',
    },
    {
      reference: '13:28',
      arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      transliteration: 'Alaa bidhikrillahi tatma-innul quloob',
      translation: 'Verily, in the remembrance of Allah do hearts find rest.',
      explanation: 'When the world feels overwhelming, returning to Allah is the only true calm.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/013028.mp3',
    },
  ],
  sad: [
    {
      reference: '93:3',
      arabic: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
      transliteration: 'Maa wadda-aka rabbuka wa maa qalaa',
      translation: 'Your Lord has not taken leave of you, nor has He forsaken you.',
      explanation: 'Allah revealed this ayah when the Prophet felt abandoned. You are never truly alone.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/093003.mp3',
    },
    {
      reference: '9:40',
      arabic: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
      transliteration: "Laa tahzan innallaha ma'anaa",
      translation: 'Do not grieve; indeed Allah is with us.',
      explanation: 'These are the words the Prophet said in the darkest moment. Let them reach your heart too.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/009040.mp3',
    },
    {
      reference: '12:87',
      arabic: 'لَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ',
      transliteration: 'Laa tay-asoo min rawhill-laah',
      translation: 'Despair not of the mercy of Allah.',
      explanation: "No matter how low you feel, Allah's mercy is always greater. Hope is never lost.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/012087.mp3',
    },
  ],
  grateful: [
    {
      reference: '14:7',
      arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
      transliteration: "La-in shakartum la-azeedannakum",
      translation: 'If you are grateful, I will surely increase you in favor.',
      explanation: "Allah promises that gratitude itself is a magnet for more blessings. It's a divine guarantee.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/014007.mp3',
    },
    {
      reference: '55:13',
      arabic: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
      transliteration: "Fabi-ayyi aalaaa'i rabbikumaa tukadhdhibaan",
      translation: 'So which of the favors of your Lord would you deny?',
      explanation: 'This question is asked 31 times in Surah Rahman — a reminder to count your blessings.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/055013.mp3',
    },
    {
      reference: '2:152',
      arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
      transliteration: 'Fadh-kurooni adhkurkum wash-kuroo lee wa laa takfuroon',
      translation: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
      explanation: 'A two-way promise: when you remember Allah, He remembers you personally.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/002152.mp3',
    },
  ],
  lost: [
    {
      reference: '93:7',
      arabic: 'وَوَجَدَكَ ضَالًّا فَهَدَىٰ',
      transliteration: 'Wa wajadaka daallan fa-hadaa',
      translation: 'And He found you lost and guided you.',
      explanation: 'Allah guided the Prophet from confusion to clarity. He can do the same for you today.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/093007.mp3',
    },
    {
      reference: '2:186',
      arabic: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
      transliteration: "Wa idhaa sa-alaka 'ibaadee 'annee fa-innee qareeb",
      translation: 'And when My servants ask you concerning Me — indeed I am near.',
      explanation: 'You do not need a mediator. Allah is directly, personally close to you right now.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/002186.mp3',
    },
    {
      reference: '39:53',
      arabic: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
      transliteration: 'Laa taqnatoo min rahmatillaah',
      translation: 'Do not despair of the mercy of Allah.',
      explanation: "Even if you've strayed far, the door of return is always open. Allah's mercy has no limit.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/039053.mp3',
    },
  ],
  indecisive: [
    {
      reference: '2:45',
      arabic: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
      transliteration: "Wasta'eenoo bis-sabri was-salaah",
      translation: 'And seek help through patience and prayer.',
      explanation: 'When you cannot decide, bring it to Allah in salah. The answer often comes through stillness.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/002045.mp3',
    },
    {
      reference: '3:159',
      arabic: 'وَشَاوِرْهُمْ فِي الْأَمْرِ فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ',
      transliteration: "Wa shaawirhum fil amri fa-idhaa 'azamta fatawakkal 'alallah",
      translation: 'Consult them in the matter and when you have decided, put your trust in Allah.',
      explanation: 'Seek counsel, then decide — and once decided, trust Allah completely with the outcome.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/003159.mp3',
    },
  ],
  justHere: [
    {
      reference: '50:16',
      arabic: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ',
      transliteration: 'Wa nahnu aqrabu ilayhi min hablil wareed',
      translation: 'And We are closer to him than his jugular vein.',
      explanation: 'Allah knows every thought before you think it. You are never hidden from His love.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/050016.mp3',
    },
    {
      reference: '3:139',
      arabic: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ',
      transliteration: "Wa laa tahinoo wa laa tahzanoo wa antumul a'loon",
      translation: 'Do not weaken and do not grieve, and you will be superior.',
      explanation: 'Strength and grief cannot coexist with faith. Rise — you were built for this.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/003139.mp3',
    },
  ],
  overthinking: [
    {
      reference: '65:3',
      arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
      transliteration: "'alallahi fa-huwa hasbuh Wa man yatawakkal",
      translation: 'And whoever relies upon Allah — then He is sufficient for him.',
      explanation: 'Stop carrying the weight of every outcome. When you hand it to Allah, it is handled.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/065003.mp3',
    },
    {
      reference: '13:28',
      arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      transliteration: 'Alaa bidhikrillahi tatma-innul quloob',
      translation: 'Verily, in the remembrance of Allah do hearts find rest.',
      explanation: 'The mind quiets when the heart connects to Allah. Dhikr is the cure for a racing mind.',
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/013028.mp3',
    },
  ],
};

// Pre-written MCQs matched to each ayah reference
const MCQ_BANK: Record<string, MCQData> = {
  '94:5': {
    question: 'What does this ayah promise about hardship?',
    options: ['It will last forever', 'Ease comes with it', 'Patience removes it'],
    correctIndex: 1,
  },
  '2:286': {
    question: 'What does Allah NOT do according to this ayah?',
    options: ['Forgive sins', 'Burden a soul beyond its capacity', 'Answer prayers'],
    correctIndex: 1,
  },
  '13:28': {
    question: 'Where do hearts find true rest?',
    options: ['In success', 'In sleep', 'In remembrance of Allah'],
    correctIndex: 2,
  },
  '93:3': {
    question: 'What does Allah say He has NOT done to the Prophet?',
    options: ['Forsaken him', 'Guided him', 'Blessed him'],
    correctIndex: 0,
  },
  '9:40': {
    question: 'What did the Prophet say to comfort his companion?',
    options: ['Be brave', "Don't grieve, Allah is with us", 'We will escape'],
    correctIndex: 1,
  },
  '12:87': {
    question: 'What should believers never do?',
    options: ["Despair of Allah's mercy", 'Ask for help', 'Make dua'],
    correctIndex: 0,
  },
  '14:7': {
    question: 'What does Allah promise in exchange for gratitude?',
    options: ['More wealth', 'Increase in His favor', 'Better health'],
    correctIndex: 1,
  },
  '55:13': {
    question: 'How many times is this question asked in Surah Rahman?',
    options: ['7 times', '21 times', '31 times'],
    correctIndex: 2,
  },
  '2:152': {
    question: 'If you remember Allah, what will He do?',
    options: ['Test you more', 'Remember you', 'Give you wealth'],
    correctIndex: 1,
  },
  '93:7': {
    question: 'What did Allah do when He found the Prophet lost?',
    options: ['Left him', 'Guided him', 'Tested him'],
    correctIndex: 1,
  },
  '2:186': {
    question: 'How does Allah describe His proximity to us?',
    options: ['Distant but watching', 'Near', 'Only reachable through prophets'],
    correctIndex: 1,
  },
  '39:53': {
    question: "What should we never do regarding Allah's mercy?",
    options: ['Ask for it', 'Despair of it', 'Rely on it'],
    correctIndex: 1,
  },
  '50:16': {
    question: 'How close is Allah to each of us?',
    options: ['In the sky above', 'Closer than our jugular vein', 'Only in the masjid'],
    correctIndex: 1,
  },
  '3:139': {
    question: 'What two things does Allah forbid in this ayah?',
    options: ['Anger and pride', 'Weakness and grief', 'Fear and doubt'],
    correctIndex: 1,
  },
  '2:45': {
    question: 'What two tools does Allah tell us to seek help through?',
    options: ['Wealth and status', 'Patience and prayer', 'Friends and family'],
    correctIndex: 1,
  },
  '3:159': {
    question: 'After consulting and deciding, what should you do?',
    options: ['Keep planning', 'Put your trust in Allah', 'Ask for more opinions'],
    correctIndex: 1,
  },
  '65:3': {
    question: 'Who is sufficient for the one who relies on Allah?',
    options: ['His community', 'His family', 'Allah alone'],
    correctIndex: 2,
  },
};

// ── Public API ────────────────────────────────────────────────────────────────

export function getAyahByMood(mood: Mood): { ayah: Ayah; question: MCQData } {
  const pool = AYAH_BANK[mood] ?? AYAH_BANK.justHere;
  const ayah = pool[Math.floor(Math.random() * pool.length)];
  const question = MCQ_BANK[ayah.reference] ?? {
    question: 'What is the main message of this ayah?',
    options: ['Patience', 'Trust in Allah', 'Gratitude'],
    correctIndex: 1,
  };
  return { ayah, question };
}

export async function checkSpeech(
  audioUri: string,
  ayahText: string
): Promise<SpeechResult> {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recitation.m4a',
    } as unknown as Blob);
    formData.append('ayah', ayahText);

    const res = await fetch(`${API_BASE}/api/speech-check`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch {
    return { spoken: '', score: 0, correct: false, words: [] };
  }
}
