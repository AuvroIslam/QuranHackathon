import type { MCQData } from '../types';

export interface LessonContent {
  reference: string;
  arabic: string;
  transliteration: string;
  translation: string;
  explanation: string;
  audioUrl: string;
}

export interface Lesson {
  day: number;
  title: string;
  subtitle: string;
  focus: string;
  learnContent: LessonContent;
  mcq: MCQData;
  actionText: string;
}

// ── BEGINNER: Letters → Words → Al-Fatiha ────────────────────────────────────

const BEGINNER: Lesson[] = [
  {
    day: 1,
    title: 'The Letter Alif',
    subtitle: 'Start from the very beginning — the first Arabic letter',
    focus: 'Arabic letter ا (Alif)',
    learnContent: {
      reference: '1:1',
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      transliteration: 'Bismillahi r-rahmani r-raheem',
      translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
      explanation: "Today's letter is ا (Alif) — a simple vertical stroke. Spot it inside اللَّهِ (Allah), الرَّحْمَٰنِ (Rahman) and الرَّحِيمِ (Raheem). The Bismillah opens every surah of the Quran. Listen carefully, then repeat.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
    },
    mcq: {
      question: 'Which of the following is the letter Alif (ا)?',
      options: ['ب', 'ا', 'ت'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Write the letter ا (Alif) 10 times. It is a simple vertical stroke — like a standing person.',
  },
  {
    day: 2,
    title: 'The Dotted Letters',
    subtitle: 'Ba, Ta, Tha — one shape, different dots',
    focus: 'Letters ب (Ba) · ت (Ta) · ث (Tha)',
    learnContent: {
      reference: '112:1',
      arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
      transliteration: 'Qul huwallahu ahad',
      translation: 'Say: He is Allah, the One',
      explanation: "Three letters share one base shape — only the dots differ. ب (Ba) has 1 dot below. ت (Ta) has 2 dots above. ث (Tha) has 3 dots above. Spot the dot pattern in أَحَدٌ. This ayah from Surah Al-Ikhlas teaches Allah is uniquely One.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/112001.mp3',
    },
    mcq: {
      question: 'The letter ث (Tha) has how many dots?',
      options: ['1 dot below', '2 dots above', '3 dots above'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Write ب ت ث side by side 5 times each. Say each name aloud: "Ba, Ta, Tha."',
  },
  {
    day: 3,
    title: 'Jim, Ha, Kha',
    subtitle: 'Three shapes told apart by dots',
    focus: 'Letters ج (Jim) · ح (Ha) · خ (Kha)',
    learnContent: {
      reference: '108:1',
      arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
      transliteration: "Innaa a'taynaaka al-kawthar",
      translation: 'Indeed, We have granted you Al-Kawthar',
      explanation: "ج (Jim) has a dot inside its curve. ح (Ha) has NO dot — pure. خ (Kha) has a dot above. Listen for the breathy Ha sound in the recitation. Al-Kawthar is a river in Jannah — abundance. Allah says: We gave YOU this.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/108001.mp3',
    },
    mcq: {
      question: 'Which of these three letters has NO dots?',
      options: ['ج (Jim)', 'ح (Ha)', 'خ (Kha)'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Practice writing ج ح خ and say them aloud. The Ha (ح) is breathy — breathe out gently as you say it.',
  },
  {
    day: 4,
    title: 'The Curved Letters',
    subtitle: 'Dal, Dhal, Ra, Zay — hook-shaped family',
    focus: 'Letters د · ذ · ر · ز',
    learnContent: {
      reference: '103:1',
      arabic: 'وَالْعَصْرِ',
      transliteration: "Wal-'asr",
      translation: 'By time',
      explanation: "د (Dal) and ذ (Dhal) look like a small boomerang — Dhal has a dot. ر (Ra) and ز (Zay) are curled hooks — Zay has a dot. Find ر (Ra) at the end of الْعَصْرِ. Allah swears by time itself — a reminder that time is precious.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/103001.mp3',
    },
    mcq: {
      question: 'Which pair of letters share the same shape (one has a dot, one does not)?',
      options: ['ج and ح', 'ر and ز', 'ب and ت'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Write د ذ then ر ز. Notice the difference in size. Say "Dal, Dhal, Ra, Zay" rhythmically.',
  },
  {
    day: 5,
    title: 'Sin, Shin & Vowels',
    subtitle: 'The zigzag letters + marks that give letters their sound',
    focus: 'Letters س · ش + fatha · kasra · damma',
    learnContent: {
      reference: '112:2',
      arabic: 'اللَّهُ الصَّمَدُ',
      transliteration: 'Allahus-samad',
      translation: 'Allah, the Eternal Refuge',
      explanation: "س (Sin) has 3 teeth, NO dots. ش (Shin) has 3 teeth, 3 dots. Vowels: fatha (َ) = 'a', kasra (ِ) = 'i', damma (ُ) = 'u'. In اللَّهُ the damma makes the 'u' sound. As-Samad means Allah is the one everything depends on.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/112002.mp3',
    },
    mcq: {
      question: 'A fatha (َ) vowel mark makes which sound?',
      options: ["'i' (as in hit)", "'a' (as in hat)", "'u' (as in put)"],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Write س (no dots) and ش (3 dots) 5 times. Then practice: ba-bi-bu (بَ بِ بُ) to feel all three vowel sounds.",
  },
  {
    day: 6,
    title: 'Your First Quranic Words',
    subtitle: 'Using what you know to read real Arabic',
    focus: 'Reading: اللَّه · الرَّحْمَٰن · الرَّحِيم',
    learnContent: {
      reference: '1:1',
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      transliteration: 'Bismillahi r-rahmani r-raheem',
      translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
      explanation: "You know enough letters to read! Bismillah has 4 words: بِسْمِ (in the name) · اللَّهِ (of Allah) · الرَّحْمَٰنِ (the Most Gracious) · الرَّحِيمِ (the Most Merciful). Rahman = vast mercy for everyone. Raheem = special mercy for believers.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
    },
    mcq: {
      question: 'What is the difference between Rahman and Raheem?',
      options: ['They mean the same thing', 'Rahman is vast mercy for all; Raheem is mercy for believers', 'Raheem means forgiveness'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Say the Bismillah before everything you do today — eating, leaving home, studying. Make it a habit.',
  },
  {
    day: 7,
    title: 'Bismillah Mastery',
    subtitle: 'The most recited phrase in the Quran — make it yours',
    focus: 'Perfecting بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    learnContent: {
      reference: '1:1',
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      transliteration: 'Bismillahi r-rahmani r-raheem',
      translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
      explanation: "The Prophet ﷺ said: 'Any important matter that does not begin with Bismillah is cut off from blessing.' It contains 19 Arabic letters — equal to the 19 angels mentioned in Surah Al-Muddaththir. Listen 3 times before recording today.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
    },
    mcq: {
      question: 'The Bismillah contains exactly how many Arabic letters?',
      options: ['19 letters', '17 letters', '21 letters'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Record yourself saying Bismillah and play it back. Focus on the rolling "r" in Rahman and the soft "h" at the end of Raheem.',
  },
  {
    day: 8,
    title: 'Al-Fatiha: The Opening',
    subtitle: 'The most important surah — recited 17 times daily',
    focus: 'Al-Fatiha 1:2 — Alhamdulillah',
    learnContent: {
      reference: '1:2',
      arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      transliteration: "Alhamdu lillahi rabbil 'aalameen",
      translation: '[All] praise is [due] to Allah, Lord of the worlds',
      explanation: "Al-Fatiha is called Umm Al-Quran — the Mother of the Quran. الْحَمْدُ (Alhamdu) = all praise. رَبِّ الْعَالَمِينَ (Rabbil Aalameen) = Lord of all the worlds — not just Earth, but every galaxy, every dimension. You are being kept alive in one of those worlds right now.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001002.mp3',
    },
    mcq: {
      question: 'Alhamdulillah (الْحَمْدُ لِلَّهِ) means?',
      options: ['Allah is great', 'All praise is for Allah', 'In the name of Allah'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Say Alhamdulillah when something good happens today — no matter how small. Train yourself to see Allah's gifts.",
  },
  {
    day: 9,
    title: 'Al-Fatiha: The Contract',
    subtitle: 'The ayah where you make a covenant with Allah',
    focus: 'Al-Fatiha 1:5 — Iyyaka nabudu',
    learnContent: {
      reference: '1:5',
      arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      transliteration: "Iyyaaka na'budu wa iyyaaka nasta'een",
      translation: 'It is You we worship and You we ask for help',
      explanation: "This is the heart of Al-Fatiha. إِيَّاكَ (Iyyaaka) places 'You' first — meaning: You and ONLY You do we worship. نَعْبُدُ (Na'budu) = we worship. نَسْتَعِينُ (Nasta'een) = we seek help from. Every prayer, you renew this promise with Allah 17 times a day.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001005.mp3',
    },
    mcq: {
      question: 'Why does إِيَّاكَ (You) come BEFORE نَعْبُدُ (we worship)?',
      options: ['Arabic grammar rule', 'To emphasize ONLY Allah is worshipped — exclusivity', 'It is easier to pronounce first'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'In your next prayer, pause after this ayah and feel the meaning. You are making a promise to Allah right then.',
  },
  {
    day: 10,
    title: 'Al-Fatiha: Complete',
    subtitle: "You've learned the foundation — now recite it fully",
    focus: 'Al-Fatiha 1:6 — the dua for guidance',
    learnContent: {
      reference: '1:6',
      arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
      transliteration: 'Ihdinas siraatal mustaqeem',
      translation: 'Guide us to the straight path',
      explanation: "اهْدِنَا (Ihdina) = guide US. This is the central dua of all dua — asked at least 17 times every single day. الصِّرَاطَ الْمُسْتَقِيمَ = the straight path, the path of those Allah has blessed. You have now learned all of Al-Fatiha — this is your foundation.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001006.mp3',
    },
    mcq: {
      question: 'Al-Fatiha has how many ayahs?',
      options: ['5 ayahs', '7 ayahs', '6 ayahs'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "You completed the beginner curriculum! Recite Al-Fatiha from memory in your next prayer and feel each word you say.",
  },
];

// ── INTERMEDIATE: Short Surahs ────────────────────────────────────────────────

const INTERMEDIATE: Lesson[] = [
  {
    day: 1,
    title: 'Surah Al-Ikhlas',
    subtitle: 'Worth a third of the Quran in reward',
    focus: 'Surah 112 — Tawheed: the Oneness of Allah',
    learnContent: {
      reference: '112:1',
      arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
      transliteration: 'Qul huwallahu ahad',
      translation: 'Say: He is Allah, [who is] One',
      explanation: "The Prophet ﷺ said this surah equals one-third of the Quran in reward. قُلْ (Qul) = Say — a direct divine command. أَحَدٌ (Ahad) means uniquely One — not just one in number, but incomparable in essence. Absolutely nothing is like Him.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/112001.mp3',
    },
    mcq: {
      question: 'What does أَحَدٌ (Ahad) mean beyond just "one"?',
      options: ['One of many gods', 'Uniquely One — with nothing comparable', 'First in rank'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Recite Surah Al-Ikhlas 3 times tonight before sleeping — the Prophet ﷺ said it equals reciting the whole Quran.',
  },
  {
    day: 2,
    title: 'Surah Al-Kawthar',
    subtitle: 'The shortest surah — one of the greatest promises',
    focus: 'Surah 108 — abundance from Allah',
    learnContent: {
      reference: '108:1',
      arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
      transliteration: "Innaa a'taynaaka al-kawthar",
      translation: 'Indeed, We have granted you Al-Kawthar',
      explanation: "Revealed when enemies mocked the Prophet ﷺ for having no sons. إِنَّا (Innaa) — the royal We, emphasizing greatness. الْكَوْثَرَ is a river of pure abundance in Jannah. Three ayahs. Endless comfort.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/108001.mp3',
    },
    mcq: {
      question: 'What was the context of the revelation of Surah Al-Kawthar?',
      options: ["After the Prophet's victory in battle", "His enemies mocked him for having no sons", 'On the night of Isra and Miraj'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Memorise all 3 ayahs of Surah Al-Kawthar. Write it from memory and check yourself.',
  },
  {
    day: 3,
    title: 'Surah Al-Asr',
    subtitle: 'What you need to succeed — in 3 ayahs',
    focus: 'Surah 103 — the formula for success',
    learnContent: {
      reference: '103:3',
      arabic: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ',
      transliteration: "Illal-ladheena aamanoo wa 'amilus-saalihaati wa tawaasaw bil-haqqi wa tawaasaw bis-sabr",
      translation: 'Except those who believe, do righteous deeds, advise each other to truth, and advise each other to patience',
      explanation: "Imam Al-Shafi'i said: 'If people reflected on this surah alone, it would be sufficient.' The formula: (1) Believe, (2) Act righteously, (3) Spread truth, (4) Encourage patience. تَوَاصَوْا = mutually advising — you need community, not just individual piety.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/103003.mp3',
    },
    mcq: {
      question: "Which scholar said Surah Al-Asr alone would be sufficient guidance?",
      options: ['Imam Malik', "Imam Al-Shafi'i", 'Imam Ibn Hanbal'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Who can you sincerely advise today? Reach out — that's tawaasaw bil-haqq in action.",
  },
  {
    day: 4,
    title: 'Surah An-Nasr',
    subtitle: "The farewell surah — revealed near the Prophet's final days",
    focus: 'Surah 110 — victory and gratitude',
    learnContent: {
      reference: '110:1',
      arabic: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ',
      transliteration: "Idhaa jaa-a nasrullahi wal-fath",
      translation: 'When the victory of Allah has come and the conquest',
      explanation: "Revealed just before the Prophet ﷺ passed away. نَصْرُ اللَّهِ (Nasrullah) = Allah's victory. When Mecca opened without a single battle, this surah came. The lesson: when success arrives, respond with tasbih and istighfar — more worship, not pride.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/110001.mp3',
    },
    mcq: {
      question: 'When victory comes, Surah An-Nasr commands us to do what?',
      options: ['Celebrate and rest', 'Praise Allah and seek His forgiveness', 'Share the news widely'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Think of a recent success. Did you thank Allah properly? Say 'Subhanallah wa bihamdih' 100 times today.",
  },
  {
    day: 5,
    title: 'Surah Al-Fil',
    subtitle: 'The miraculous defeat of the army of elephants',
    focus: 'Surah 105 — Allah\'s power over armies',
    learnContent: {
      reference: '105:1',
      arabic: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ',
      transliteration: "Alam tara kayfa fa'ala rabbuka bi-ashaabil feel",
      translation: 'Have you not considered how your Lord dealt with the companions of the elephant?',
      explanation: "570 CE — the Prophet's birth year. Abraha marched an army of war elephants to destroy the Kaaba. Allah sent birds (Ababeel) carrying stones. The entire army was destroyed. أَلَمْ تَرَ (Alam tara) = Did you not see? — so famous all of Arabia witnessed it.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/105001.mp3',
    },
    mcq: {
      question: 'Who led the army of elephants against the Kaaba?',
      options: ['Abu Jahl', 'Abraha, the Abyssinian ruler', 'Pharaoh'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Memorise Surah Al-Fil (5 ayahs). Recite it slowly and visualise the scene.',
  },
  {
    day: 6,
    title: 'Surah Quraysh',
    subtitle: 'Counting the blessings of security and food',
    focus: 'Surah 106 — gratitude for daily provision',
    learnContent: {
      reference: '106:1',
      arabic: 'لِإِيلَافِ قُرَيْشٍ',
      transliteration: 'Li-ilaafi Quraysh',
      translation: 'For the accustomed security of the Quraysh',
      explanation: "إِيلَاف (Ilaaf) = familiar comfort, accustomed safety. The Quraysh had two trade journeys — winter to Yemen, summer to Syria. Allah protected and fed them. In return: worship the Lord of this House. All our security and food come from Allah — worship Him alone.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/106001.mp3',
    },
    mcq: {
      question: 'The two journeys of the Quraysh mentioned in this surah were?',
      options: ['Mecca to Madinah and back', 'Winter to Yemen, Summer to Syria', 'Day and night journeys'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'List 3 specific things making you feel secure today. Then say Alhamdulillah for each one.',
  },
  {
    day: 7,
    title: "Surah Al-Ma'un",
    subtitle: 'True faith includes caring for people',
    focus: "Surah 107 — worship without compassion is incomplete",
    learnContent: {
      reference: '107:1',
      arabic: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ',
      transliteration: "Ara-aytal-ladhee yukadh-dhibu bid-deen",
      translation: 'Have you seen the one who denies the Recompense?',
      explanation: "Who truly denies religion? Not just atheists — but the one who pushes away the orphan and does not encourage feeding the poor. Faith without caring for people is not complete faith. Al-Ma'un = small neighborly favors — even these matter.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/107001.mp3',
    },
    mcq: {
      question: "According to Surah Al-Ma'un, who truly denies the religion?",
      options: ["Only those who reject Allah", "Those who push away the orphan and don't encourage feeding the poor", 'Those who skip prayers'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Do one genuine act of care today — feed someone, check on a neighbor, give sadaqah.",
  },
  {
    day: 8,
    title: 'Surah Al-Masad',
    subtitle: 'The only surah naming a real person — and condemning them',
    focus: 'Surah 111 — the consequence of opposing truth',
    learnContent: {
      reference: '111:1',
      arabic: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ',
      transliteration: 'Tabbat yadaa abi lahabi wa-tabb',
      translation: 'May the hands of Abu Lahab be ruined, and ruined is he',
      explanation: "Abu Lahab was the Prophet's ﷺ uncle who violently opposed Islam. This surah condemns him by name. It proves the Quran is from Allah — if the Prophet wrote it, why condemn his own uncle? Abu Lahab died a disbeliever exactly as foretold.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/111001.mp3',
    },
    mcq: {
      question: 'Why does Surah Al-Masad prove the divine origin of the Quran?',
      options: ['It is beautifully written', "It condemned the Prophet's own uncle by name — no human author would do this", 'It is the shortest surah'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Memorise Surah Al-Masad. As you recite it, reflect: am I standing on the side of truth or comfort?',
  },
  {
    day: 9,
    title: 'Surah An-Nas',
    subtitle: 'Triple protection from the whispering enemy',
    focus: 'Surah 114 — daily shield against Shaytan',
    learnContent: {
      reference: '114:1',
      arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
      transliteration: "Qul a'udhu bi-rabbin naas",
      translation: 'Say: I seek refuge in the Lord of mankind',
      explanation: "أَعُوذُ (A'udhu) = I seek refuge — like running to a fortress. Three names of Allah: رَبِّ النَّاسِ (Lord), مَلِكِ النَّاسِ (King), إِلَٰهِ النَّاسِ (God) — triple protection. الْوَسْوَاسِ الْخَنَّاسِ = the retreating whisperer — Shaytan who runs when you remember Allah.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/114001.mp3',
    },
    mcq: {
      question: 'الْوَسْوَاسِ الْخَنَّاسِ (Al-Waswasil Khannas) refers to?',
      options: ['Bad friends', 'Shaytan — who retreats when you remember Allah', 'Your own ego'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Recite Surah An-Nas 3 times before sleeping — a Prophetic Sunnah every single night.",
  },
  {
    day: 10,
    title: 'Surah Al-Falaq',
    subtitle: 'The shield against visible and invisible harm',
    focus: 'Surah 113 — comprehensive divine protection',
    learnContent: {
      reference: '113:1',
      arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
      transliteration: "Qul a'udhu bi-rabbil falaq",
      translation: 'Say: I seek refuge in the Lord of daybreak',
      explanation: "الْفَلَقِ (Al-Falaq) = the daybreak, the splitting of darkness by light. We seek refuge from: evil of all creation, darkness when it settles, witchcraft, and the envy of the envier. The Prophet ﷺ said: 'Nothing compares to the Mu'awwidhatayn (Al-Falaq + An-Nas).' Recite them morning and evening.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/113001.mp3',
    },
    mcq: {
      question: 'What does الْفَلَقِ (Al-Falaq) mean?',
      options: ['The night', 'The daybreak — splitting of darkness into light', 'The stars'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "You completed the intermediate curriculum! Add Al-Falaq and An-Nas to your morning and evening adhkar — every single day.",
  },
];

// ── FLUENT: Powerful Verses ───────────────────────────────────────────────────

const FLUENT: Lesson[] = [
  {
    day: 1,
    title: 'Al-Fatiha: Tajweed Focus',
    subtitle: 'The prayer within the prayer — perfect every rule',
    focus: 'Al-Fatiha (1:1) — tajweed precision',
    learnContent: {
      reference: '1:1',
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      transliteration: 'Bismillahi r-rahmani r-raheem',
      translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
      explanation: "Focus on tajweed: the meem (م) in Bismillah has ikhfaa — a nasal linger. الرَّ has shaddah — double the Ra. Rahman has a madd — elongate the Aa. Al-Fatiha is recited more than any other text in human history — 17 times in every day's prayers, by 1.8 billion people.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
    },
    mcq: {
      question: "In tajweed, a shaddah (ّ) on a letter means?",
      options: ['Make it silent', 'Double the letter — hold it twice as long', 'Make it nasal'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Recite Al-Fatiha slowly in your next salah, pausing after each ayah. Allah replies to each one — it is a conversation.",
  },
  {
    day: 2,
    title: 'Ayatul Kursi',
    subtitle: 'The greatest single verse in the Quran',
    focus: 'Al-Baqarah 2:255 — the Throne Verse',
    learnContent: {
      reference: '2:255',
      arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      transliteration: "Allahu laa ilaaha illaa huwal-hayyul-qayyoom",
      translation: 'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence',
      explanation: "The Prophet ﷺ said: 'Ayatul Kursi is the greatest verse in the Quran.' الْحَيُّ (Al-Hayyu) = Ever-Living — no beginning, no end. الْقَيُّومُ (Al-Qayyum) = the Self-Sustaining upon whom all existence depends. Every atom exists only because Al-Qayyum holds it in being. Recite after every fard salah — you are protected until the next.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3',
    },
    mcq: {
      question: 'Reciting Ayatul Kursi after every obligatory prayer gives what benefit?',
      options: ['1000 rewards per letter', 'Protection until the next prayer, and Paradise at death', 'Forgiveness of major sins'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: 'Memorise Ayatul Kursi completely if you have not. Recite it after every fard salah — this is a Sunnah with enormous reward.',
  },
  {
    day: 3,
    title: "The Believer's Declaration",
    subtitle: 'Al-Baqarah 285 — the creed that earns mercy',
    focus: 'Al-Baqarah 2:285 — aqeedah of the believer',
    learnContent: {
      reference: '2:285',
      arabic: 'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ',
      transliteration: "Aamanar-rasoolu bimaa unzila ilayhi mir-rabbihi wal-mu'minoon",
      translation: 'The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers',
      explanation: "These last two ayahs of Al-Baqarah are the Khawateem — the Seals. The Prophet ﷺ said: 'Whoever recites the last two ayahs of Al-Baqarah at night, they will suffice him.' سَمِعْنَا وَأَطَعْنَا — 'We heard and we obeyed' is the believer's response.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/002285.mp3',
    },
    mcq: {
      question: "What did the Prophet ﷺ say about the last two ayahs of Al-Baqarah?",
      options: ['They erase all sins', 'Whoever recites them at night — they will suffice him', 'Best recited at Fajr'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Recite Al-Baqarah 285-286 tonight before sleeping. Make this a permanent nightly habit.",
  },
  {
    day: 4,
    title: "Allah's Promise: No Overloading",
    subtitle: 'Al-Baqarah 286 — the most comforting ayah',
    focus: 'Al-Baqarah 2:286 — the mercy within difficulty',
    learnContent: {
      reference: '2:286',
      arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      transliteration: "Laa yukallifullahu nafsan illaa wus'ahaa",
      translation: 'Allah does not burden a soul beyond that it can bear',
      explanation: "لَا يُكَلِّفُ = does not impose burden. وُسْعَهَا = its capacity. This ayah also contains the dua: رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا — 'Our Lord, do not punish us if we forget or err.' Allah's recorded reply to this dua: 'I have done so.' You are already forgiven for honest mistakes.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/002286.mp3',
    },
    mcq: {
      question: "Allah's recorded reply to the dua in 2:286 (do not punish us if we forget) is?",
      options: ['I will consider it', 'I have done so — the forgiveness is already granted', 'Recite it 100 times for it to take effect'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Write out the dua from 2:286 and memorise it. Use it when guilt from past mistakes weighs on you.",
  },
  {
    day: 5,
    title: 'Witness to Oneness',
    subtitle: 'Al-Imran 18 — Allah, angels, and scholars all testify to the same truth',
    focus: 'Al-Imran 3:18 — testimony of Tawheed',
    learnContent: {
      reference: '3:18',
      arabic: 'شَهِدَ اللَّهُ أَنَّهُ لَا إِلَٰهَ إِلَّا هُوَ وَالْمَلَائِكَةُ وَأُولُو الْعِلْمِ',
      transliteration: "Shahidallahu annahu laa ilaaha illaa huwa wal-malaa-ikatu wa ulul-'ilm",
      translation: 'Allah witnesses that there is no deity except Him, and [so do] the angels and those of knowledge',
      explanation: "شَهِدَ (Shahida) = bore witness. Allah is the first witness to His own Oneness, then the angels, then أُولُو الْعِلْمِ — people of knowledge. To be a sincere scholar is to join the angels in this witnessing. Tawheed is inseparable from justice — قَائِمًا بِالْقِسْطِ (standing firmly in justice).",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/003018.mp3',
    },
    mcq: {
      question: 'The three witnesses to Tawheed in 3:18 are?',
      options: ['Prophets, Companions, and Scholars', 'Allah Himself, the Angels, and People of Knowledge', 'The Quran, Sunnah, and Consensus'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Recite this ayah after Fajr. You join the most distinguished group in creation in testifying to La ilaha illallah.",
  },
  {
    day: 6,
    title: 'Ya-Sin: Heart of the Quran',
    subtitle: "The surah the Prophet ﷺ called the Quran's heart",
    focus: 'Ya-Sin 36:1-3 — the mysterious opening',
    learnContent: {
      reference: '36:1',
      arabic: 'يس وَالْقُرْآنِ الْحَكِيمِ إِنَّكَ لَمِنَ الْمُرْسَلِينَ',
      transliteration: "Yaa-Seen. Wal-qur-aanil-hakeem. Innaka laminal mursaleen",
      translation: 'Ya-Sin. By the Wise Quran. Indeed you are from the messengers.',
      explanation: "يس are disconnected letters — their meaning belongs to Allah alone. The Prophet ﷺ said: 'Everything has a heart, and the heart of the Quran is Ya-Sin.' الْقُرْآنِ الْحَكِيمِ = the Wise Quran — wisdom built into every letter. Reciting Ya-Sin is a major Sunnah, especially for those who are ill.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/036001.mp3',
    },
    mcq: {
      question: "The Prophet ﷺ described Ya-Sin as?",
      options: ['The longest surah', 'The heart of the Quran', 'The surah of mercy'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Recite or listen to Ya-Sin today. It has 83 ayahs — take 20 minutes. The Prophet ﷺ recommended it for important occasions.",
  },
  {
    day: 7,
    title: 'Al-Mulk: The Protector',
    subtitle: 'The surah that will intercede on the Day of Judgment',
    focus: "Al-Mulk 67:1 — Allah's absolute sovereignty",
    learnContent: {
      reference: '67:1',
      arabic: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
      transliteration: "Tabaarakal-ladhee biyadihil-mulku wa huwa 'alaa kulli shay-in qadeer",
      translation: 'Blessed is He in whose hand is dominion, and He is over all things competent',
      explanation: "تَبَارَكَ (Tabaaraka) contains baraka — overflowing goodness. بِيَدِهِ الْمُلْكُ = in His hand is ALL dominion — every government, every power, ultimately in Allah's hand. The Prophet ﷺ said Al-Mulk will intercede for its reciter until he is forgiven. Make it your nightly routine.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/067001.mp3',
    },
    mcq: {
      question: "What did the Prophet ﷺ say Al-Mulk will do for its regular reciter?",
      options: ['Give 1000 rewards per letter', 'Intercede for him until he is forgiven', 'Protect him from the evil eye'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Start memorising Al-Mulk (30 ayahs). Begin with the first 5 tonight. The Prophet ﷺ did not sleep without reciting it.",
  },
  {
    day: 8,
    title: 'Al-Rahman: The Love Letter',
    subtitle: "31 times Allah asks: which favor will you deny?",
    focus: 'Al-Rahman 55:1-4 — the divine teacher',
    learnContent: {
      reference: '55:1',
      arabic: 'الرَّحْمَٰنُ عَلَّمَ الْقُرْآنَ خَلَقَ الْإِنسَانَ عَلَّمَهُ الْبَيَانَ',
      transliteration: "Ar-rahmaan. 'Allamal-qur-aan. Khalaqal-insaan. 'Allamahul-bayaan",
      translation: 'The Most Merciful. Taught the Quran. Created man. Taught him eloquence.',
      explanation: "Four short ayahs — each its own miracle. الرَّحْمَٰنُ taught the Quran FIRST, before mentioning the creation of man — the Quran is the most important gift to humanity. عَلَّمَهُ الْبَيَانَ = taught him eloquence. Every word you speak is a gift from Al-Rahman.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/055001.mp3',
    },
    mcq: {
      question: "In Surah Al-Rahman's opening, what did Allah teach BEFORE mentioning the creation of man?",
      options: ['The laws of nature', 'The Quran — the most important gift', 'The names of things'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Read all of Surah Al-Rahman slowly today, answering 'None of Your favors do I deny, my Lord' after each refrain.",
  },
  {
    day: 9,
    title: "The Beautiful Names",
    subtitle: "Al-Hashr 22-24 — greatest concentration of Allah's names",
    focus: 'Al-Hashr 59:22 — divine attributes',
    learnContent: {
      reference: '59:22',
      arabic: 'هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ عَالِمُ الْغَيْبِ وَالشَّهَادَةِ هُوَ الرَّحْمَٰنُ الرَّحِيمُ',
      transliteration: "Huwallahul-ladhee laa ilaaha illaa huwa 'aalimul-ghaybi wash-shahaadah. Huwar-rahmaanur-raheem",
      translation: 'He is Allah, other than whom there is no deity, Knower of the unseen and the witnessed. He is the Entirely Merciful, the Especially Merciful.',
      explanation: "Three ayahs (22-24) contain 14 of Allah's names. عَالِمُ الْغَيْبِ وَالشَّهَادَةِ = Knower of the unseen AND the seen — your private thoughts, secrets you have never spoken — all fully known. The Prophet ﷺ said: reciting the last 3 ayahs of Al-Hashr morning and evening causes 70,000 angels to pray for you.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/059022.mp3',
    },
    mcq: {
      question: "Reciting the last 3 ayahs of Al-Hashr morning and evening causes?",
      options: ['All sins to be wiped', '70,000 angels to pray for you until evening/morning', 'Your rizq to increase immediately'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "Memorise Al-Hashr 22-24 and add them to your morning and evening adhkar permanently.",
  },
  {
    day: 10,
    title: 'The Noble Quran',
    subtitle: "Al-Waqiah 77-80 — Allah's description of the Book you hold",
    focus: 'Al-Waqiah 56:77-80 — the divine origin of the Quran',
    learnContent: {
      reference: '56:77',
      arabic: 'إِنَّهُ لَقُرْآنٌ كَرِيمٌ فِي كِتَابٍ مَّكْنُونٍ لَّا يَمَسُّهُ إِلَّا الْمُطَهَّرُونَ تَنزِيلٌ مِّن رَّبِّ الْعَالَمِينَ',
      transliteration: "Innahu laqur-aanun kareem. Fee kitaabin maknoon. Laa yamassuhoo illal-mutahharoon. Tanzeelum mir-rabbil-'aalameen",
      translation: 'Indeed it is a noble Quran. In a protected Register. None touch it except the purified. [It is] a revelation from the Lord of the worlds.',
      explanation: "كَرِيمٌ (Kareem) = noble, generous. كِتَابٍ مَّكْنُونٍ = protected Register (Lawh Al-Mahfuz). الْمُطَهَّرُونَ = the purified ones — angels. The Book you recite exists in the heavens, guarded by angels. تَنزِيلٌ مِّن رَّبِّ الْعَالَمِينَ — it descended from the Lord of all worlds. Straight to you.",
      audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/056077.mp3',
    },
    mcq: {
      question: "الْمُطَهَّرُونَ (Al-Mutahharoon — the purified ones) who touch the Quran in its heavenly form are?",
      options: ['Those with wudu', 'The Angels', 'Prophets only'],
      correctIndex: -1, // server-validated via /api/lessons/check
    },
    actionText: "You completed the fluent curriculum! Recite these 4 ayahs whenever you open the Quran — a reminder of the honor of what you hold.",
  },
];

export const LESSON_PLANS: Record<'beginner' | 'intermediate' | 'fluent', Lesson[]> = {
  beginner: BEGINNER,
  intermediate: INTERMEDIATE,
  fluent: FLUENT,
};

export function getLesson(level: 'beginner' | 'intermediate' | 'fluent', day: number): Lesson | null {
  const plan = LESSON_PLANS[level];
  if (!plan || plan.length === 0 || day < 1) return null;
  // `day` is a 1-based sequential lesson counter that advances on every
  // completed lesson (not a calendar day). Once the curriculum is exhausted it
  // wraps so the learner keeps getting lessons (review cycle) instead of being
  // stuck repeating lesson 1 on every session.
  return plan[(day - 1) % plan.length];
}
