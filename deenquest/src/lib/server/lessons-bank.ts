// SERVER-ONLY. Do not import from client components — leaks MCQ answer keys.
// Only import from files inside src/app/api/**/route.ts.
//
// NOTE: This bank holds ONLY pedagogy — the verse `reference`, the teaching
// `explanation`, the recitation `audioUrl`, the comprehension `mcq`, and the
// `actionText`. It deliberately holds NO Quran verse text: the Arabic,
// transliteration and translation are fetched live by verse key from the
// Quran Foundation Content API at request time (see /api/lessons). Short
// Arabic words inside an explanation are teaching commentary, not a hardcoded
// copy of the ayah.
import type { MCQData } from '../types';

export interface LessonContent {
  reference: string; // "surah:ayah" — verse text is fetched live from QF
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

const audio = (surah: number, ayah: number) =>
  `https://everyayah.com/data/Alafasy_128kbps/${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;

// ── BEGINNER: Letters → Words → Al-Fatiha → first short surahs ────────────────

const BEGINNER: Lesson[] = [
  {
    day: 1,
    title: 'The Letter Alif',
    subtitle: 'Start from the very beginning — the first Arabic letter',
    focus: 'Arabic letter ا (Alif)',
    learnContent: {
      reference: '1:1',
      explanation:
        "Today's letter is ا (Alif) — a simple vertical stroke. You will spot it inside the names of Allah in this opening verse. The Bismillah opens every surah of the Quran. Listen carefully, then repeat.",
      audioUrl: audio(1, 1),
    },
    mcq: {
      question: 'Which of the following is the letter Alif (ا)?',
      options: ['ب', 'ا', 'ت'],
      correctIndex: 1,
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
      explanation:
        "Three letters share one base shape — only the dots differ. ب (Ba) has 1 dot below. ت (Ta) has 2 dots above. ث (Tha) has 3 dots above. This verse from Surah Al-Ikhlas teaches that Allah is uniquely One.",
      audioUrl: audio(112, 1),
    },
    mcq: {
      question: 'The letter ث (Tha) has how many dots?',
      options: ['1 dot below', '2 dots above', '3 dots above'],
      correctIndex: 2,
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
      explanation:
        "ج (Jim) has a dot inside its curve. ح (Ha) has NO dot — pure. خ (Kha) has a dot above. Listen for the breathy Ha sound in the recitation. Al-Kawthar is a river of abundance in Paradise — Allah says: We gave YOU this.",
      audioUrl: audio(108, 1),
    },
    mcq: {
      question: 'Which of these three letters has NO dots?',
      options: ['ج (Jim)', 'ح (Ha)', 'خ (Kha)'],
      correctIndex: 1,
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
      explanation:
        "د (Dal) and ذ (Dhal) look like a small boomerang — Dhal has a dot. ر (Ra) and ز (Zay) are curled hooks — Zay has a dot. In this verse Allah swears by time itself — a reminder that time is precious.",
      audioUrl: audio(103, 1),
    },
    mcq: {
      question: 'Which pair of letters share the same shape (one has a dot, one does not)?',
      options: ['ج and ح', 'ر and ز', 'ب and ت'],
      correctIndex: 1,
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
      explanation:
        "س (Sin) has 3 teeth, NO dots. ش (Shin) has 3 teeth, 3 dots. Vowels: fatha = 'a', kasra = 'i', damma = 'u'. This verse teaches that Allah is As-Samad — the One everything depends on.",
      audioUrl: audio(112, 2),
    },
    mcq: {
      question: 'A fatha (َ) vowel mark makes which sound?',
      options: ["'i' (as in hit)", "'a' (as in hat)", "'u' (as in put)"],
      correctIndex: 1,
    },
    actionText: "Write س (no dots) and ش (3 dots) 5 times. Then practice: ba-bi-bu (بَ بِ بُ) to feel all three vowel sounds.",
  },
  {
    day: 6,
    title: 'Your First Quranic Words',
    subtitle: 'Using what you know to read real Arabic',
    focus: 'Reading the Bismillah word by word',
    learnContent: {
      reference: '1:1',
      explanation:
        "You know enough letters to read! The Bismillah has 4 words: 'in the name', 'of Allah', 'the Most Gracious', 'the Most Merciful'. Rahman = vast mercy for everyone. Raheem = special mercy for the believers.",
      audioUrl: audio(1, 1),
    },
    mcq: {
      question: 'What is the difference between Rahman and Raheem?',
      options: ['They mean the same thing', 'Rahman is vast mercy for all; Raheem is mercy for believers', 'Raheem means forgiveness'],
      correctIndex: 1,
    },
    actionText: 'Say the Bismillah before everything you do today — eating, leaving home, studying. Make it a habit.',
  },
  {
    day: 7,
    title: 'Bismillah Mastery',
    subtitle: 'The most recited phrase in the Quran — make it yours',
    focus: 'Perfecting the Bismillah',
    learnContent: {
      reference: '1:1',
      explanation:
        "The Bismillah is the opening of the Quran and is said before every good action. Listen to it three times before recording today, focusing on the rolling 'r' in Rahman and the soft 'h' at the end of Raheem.",
      audioUrl: audio(1, 1),
    },
    mcq: {
      question: 'When should a Muslim say the Bismillah?',
      options: ['Only during salah', 'Before beginning any good or important action', 'Only on Fridays'],
      correctIndex: 1,
    },
    actionText: 'Record yourself saying Bismillah and play it back. Focus on the rolling "r" in Rahman and the soft "h" in Raheem.',
  },
  {
    day: 8,
    title: 'Al-Fatiha: The Opening',
    subtitle: 'The most important surah — recited in every prayer',
    focus: 'Al-Fatiha 1:2 — Alhamdulillah',
    learnContent: {
      reference: '1:2',
      explanation:
        "Al-Fatiha is called Umm Al-Quran — the Mother of the Quran. This verse means 'All praise is due to Allah, Lord of the worlds' — not just Earth, but every world that exists. You are being kept alive right now by that same Lord.",
      audioUrl: audio(1, 2),
    },
    mcq: {
      question: 'Alhamdulillah (الْحَمْدُ لِلَّهِ) means?',
      options: ['Allah is great', 'All praise is for Allah', 'In the name of Allah'],
      correctIndex: 1,
    },
    actionText: "Say Alhamdulillah when something good happens today — no matter how small. Train yourself to see Allah's gifts.",
  },
  {
    day: 9,
    title: 'Al-Fatiha: The Contract',
    subtitle: 'The verse where you make a covenant with Allah',
    focus: 'Al-Fatiha 1:5 — You alone we worship',
    learnContent: {
      reference: '1:5',
      explanation:
        "This is the heart of Al-Fatiha: 'It is You we worship and You we ask for help.' Placing 'You' first means: You and ONLY You. In every prayer you renew this promise with Allah.",
      audioUrl: audio(1, 5),
    },
    mcq: {
      question: 'What does this verse emphasise by placing "You" before "we worship"?',
      options: ['An Arabic grammar rule with no meaning', 'That ONLY Allah is worshipped — exclusivity', 'That it is easier to pronounce'],
      correctIndex: 1,
    },
    actionText: 'In your next prayer, pause after this verse and feel the meaning. You are making a promise to Allah right then.',
  },
  {
    day: 10,
    title: 'Al-Fatiha: The Dua for Guidance',
    subtitle: "You've learned the foundation — now ask for the path",
    focus: 'Al-Fatiha 1:6 — Guide us to the straight path',
    learnContent: {
      reference: '1:6',
      explanation:
        "'Guide us to the straight path.' This is the central dua of all dua, asked in every unit of every prayer. You have now covered the core of Al-Fatiha — this is your foundation.",
      audioUrl: audio(1, 6),
    },
    mcq: {
      question: 'Al-Fatiha has how many ayahs?',
      options: ['5 ayahs', '7 ayahs', '6 ayahs'],
      correctIndex: 1,
    },
    actionText: 'Recite Al-Fatiha in your next prayer and feel each word you say.',
  },
  {
    day: 11,
    title: 'Al-Fatiha: Mercy Repeated',
    subtitle: 'Why Allah names His mercy twice in one short surah',
    focus: 'Al-Fatiha 1:3 — Ar-Rahman Ar-Raheem',
    learnContent: {
      reference: '1:3',
      explanation:
        "Right after praising Allah as Lord of the worlds, this verse repeats 'the Most Gracious, the Most Merciful'. Allah leads with mercy before mentioning the Day of Judgment — hope before fear.",
      audioUrl: audio(1, 3),
    },
    mcq: {
      question: 'What does Al-Fatiha mention immediately after "Lord of the worlds"?',
      options: ["Allah's mercy (Ar-Rahman, Ar-Raheem)", 'A warning of punishment', 'A command to fight'],
      correctIndex: 0,
    },
    actionText: 'Each time you say this verse in prayer today, remember one specific mercy Allah gave you this week.',
  },
  {
    day: 12,
    title: 'Al-Fatiha: The Day of Judgment',
    subtitle: 'Master of the Day of Recompense',
    focus: 'Al-Fatiha 1:4 — Maliki yawmid-deen',
    learnContent: {
      reference: '1:4',
      explanation:
        "'Master of the Day of Judgment.' Allah is the sole owner of that Day — no one will speak or intercede except by His permission. Naming this in Al-Fatiha keeps the believer balanced between hope and accountability.",
      audioUrl: audio(1, 4),
    },
    mcq: {
      question: 'This verse describes Allah as Master of what?',
      options: ['The Day of Judgment', 'The oceans', 'The angels only'],
      correctIndex: 0,
    },
    actionText: 'Before sleeping, take 60 seconds to honestly review your day — the small daily reckoning.',
  },
  {
    day: 13,
    title: 'Al-Fatiha: The Final Verse',
    subtitle: 'The path of those Allah has blessed',
    focus: 'Al-Fatiha 1:7 — the two paths',
    learnContent: {
      reference: '1:7',
      explanation:
        "The closing verse asks for the path of those Allah favoured — not the path of those who earned anger nor of those who went astray. Al-Fatiha ends by asking to be kept in good company.",
      audioUrl: audio(1, 7),
    },
    mcq: {
      question: 'Whose path does Al-Fatiha ask Allah to guide us to?',
      options: ['Those Allah has blessed and favoured', 'The wealthy', 'The most knowledgeable people only'],
      correctIndex: 0,
    },
    actionText: 'Choose one righteous person you admire and message them something kind today — good company is a path.',
  },
  {
    day: 14,
    title: 'Al-Ikhlas: The Eternal Refuge',
    subtitle: 'Allah, As-Samad — the One all depend on',
    focus: 'Surah Al-Ikhlas 112:2',
    learnContent: {
      reference: '112:2',
      explanation:
        "'Allah, the Eternal Refuge (As-Samad).' Everything turns to Him for its needs, while He needs nothing. The whole universe leans on Him; He leans on nothing.",
      audioUrl: audio(112, 2),
    },
    mcq: {
      question: 'As-Samad means Allah is the One who…',
      options: ['Needs help from creation', 'Everything depends on, while He needs nothing', 'Rests on the seventh day'],
      correctIndex: 1,
    },
    actionText: 'When you next need something, ask Allah for it first — before asking any person.',
  },
  {
    day: 15,
    title: 'Al-Ikhlas: He Is Unlike Anything',
    subtitle: 'Neither begetting nor begotten',
    focus: 'Surah Al-Ikhlas 112:3-4',
    learnContent: {
      reference: '112:3',
      explanation:
        "'He neither begets nor is born.' Allah has no parents, no children, no equal. This is pure Tawheed — the verse that the Prophet ﷺ said carries the weight of a third of the Quran in reward.",
      audioUrl: audio(112, 3),
    },
    mcq: {
      question: 'Surah Al-Ikhlas teaches that Allah…',
      options: ['Has a family like creation', 'Neither begets nor is begotten — nothing is like Him', 'Is one of several gods'],
      correctIndex: 1,
    },
    actionText: 'Recite Surah Al-Ikhlas three times tonight before sleeping.',
  },
  {
    day: 16,
    title: 'Al-Asr: The Oath by Time',
    subtitle: 'Allah swears by time — humanity is at loss',
    focus: 'Surah Al-Asr 103:1-2',
    learnContent: {
      reference: '103:2',
      explanation:
        "'Indeed, mankind is in loss.' After swearing by time, Allah states the default state of every human — losing — unless they meet the four conditions in the next verse.",
      audioUrl: audio(103, 2),
    },
    mcq: {
      question: 'According to Surah Al-Asr, what is the default state of mankind?',
      options: ['In profit', 'In loss — unless they believe and act righteously', 'Already saved'],
      correctIndex: 1,
    },
    actionText: 'Audit one hour of your day today: was it spent in something beneficial, or in loss?',
  },
  {
    day: 17,
    title: 'Al-Asr: The Four-Part Formula',
    subtitle: 'Faith, good deeds, truth, and patience',
    focus: 'Surah Al-Asr 103:3',
    learnContent: {
      reference: '103:3',
      explanation:
        "The exceptions to loss: those who (1) believe, (2) do righteous deeds, (3) advise each other to truth, and (4) advise each other to patience. Notice the last two are about community, not just yourself.",
      audioUrl: audio(103, 3),
    },
    mcq: {
      question: 'Which TWO conditions in Al-Asr involve other people, not just yourself?',
      options: ['Believing and praying', 'Advising one another to truth and to patience', 'Fasting and charity'],
      correctIndex: 1,
    },
    actionText: 'Sincerely advise one person toward something good today — gently and privately.',
  },
  {
    day: 18,
    title: 'Ash-Sharh: Ease With Hardship',
    subtitle: "Allah's promise repeated twice",
    focus: 'Surah Ash-Sharh 94:5-6',
    learnContent: {
      reference: '94:6',
      explanation:
        "'Indeed, with hardship comes ease.' Allah states it twice for emphasis. The ease arrives WITH the hardship, not only after it — relief is built into the difficulty itself.",
      audioUrl: audio(94, 6),
    },
    mcq: {
      question: 'What does this verse promise about hardship?',
      options: ['It never ends', 'Ease comes with it', 'Only the patient avoid it'],
      correctIndex: 1,
    },
    actionText: 'Name one current hardship and write down one small mercy hidden inside it.',
  },
  {
    day: 19,
    title: 'Al-Qadr: The Night of Power',
    subtitle: 'A night better than a thousand months',
    focus: 'Surah Al-Qadr 97:1',
    learnContent: {
      reference: '97:1',
      explanation:
        "'Indeed, We sent it [the Quran] down during the Night of Decree.' This surah honours the night the Quran began to descend — worship in it is better than that of a thousand months.",
      audioUrl: audio(97, 1),
    },
    mcq: {
      question: 'What was sent down on the Night of Decree (Laylat al-Qadr)?',
      options: ['The Quran', 'The angels only', 'Rain'],
      correctIndex: 0,
    },
    actionText: 'Plan how you will seek Laylat al-Qadr in the last ten nights of your next Ramadan.',
  },
  {
    day: 20,
    title: 'Al-Alaq: The First Revelation',
    subtitle: 'The very first word revealed: Read',
    focus: "Surah Al-'Alaq 96:1",
    learnContent: {
      reference: '96:1',
      explanation:
        "'Read, in the name of your Lord who created.' The first word ever revealed of the Quran was 'Read' — knowledge and recitation are the foundation of this religion. You completed the beginner curriculum by living that first command.",
      audioUrl: audio(96, 1),
    },
    mcq: {
      question: 'What was the first word revealed of the Quran?',
      options: ['Pray', 'Read (Iqra)', 'Fight'],
      correctIndex: 1,
    },
    actionText: "You completed the beginner curriculum! Commit to reading even one line of Quran with meaning every day.",
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
      explanation:
        "The Prophet ﷺ said this surah equals one-third of the Quran in reward. 'Say: He is Allah, One.' Ahad means uniquely One — not just one in number, but incomparable in essence. Nothing is like Him.",
      audioUrl: audio(112, 1),
    },
    mcq: {
      question: 'What does أَحَدٌ (Ahad) mean beyond just "one"?',
      options: ['One of many gods', 'Uniquely One — with nothing comparable', 'First in rank'],
      correctIndex: 1,
    },
    actionText: 'Recite Surah Al-Ikhlas 3 times tonight before sleeping.',
  },
  {
    day: 2,
    title: 'Surah Al-Kawthar',
    subtitle: 'The shortest surah — one of the greatest promises',
    focus: 'Surah 108 — abundance from Allah',
    learnContent: {
      reference: '108:1',
      explanation:
        "Revealed when enemies mocked the Prophet ﷺ for having no surviving sons. 'Indeed, We have granted you Al-Kawthar' — a river of pure abundance in Paradise. Three verses. Endless comfort.",
      audioUrl: audio(108, 1),
    },
    mcq: {
      question: 'What was the context of the revelation of Surah Al-Kawthar?',
      options: ["After a battle victory", "His enemies mocked him for having no sons", 'On the night journey'],
      correctIndex: 1,
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
      explanation:
        "Imam Al-Shafi'i said reflecting on this surah alone would suffice people. The formula: believe, act righteously, spread truth, and encourage patience — and the last two require community.",
      audioUrl: audio(103, 3),
    },
    mcq: {
      question: "Which scholar said Surah Al-Asr alone would be sufficient guidance?",
      options: ['Imam Malik', "Imam Al-Shafi'i", 'Imam Ibn Hanbal'],
      correctIndex: 1,
    },
    actionText: "Who can you sincerely advise today? Reach out — that's mutual advice toward truth in action.",
  },
  {
    day: 4,
    title: 'Surah An-Nasr',
    subtitle: "The farewell surah — near the Prophet's final days",
    focus: 'Surah 110 — victory and gratitude',
    learnContent: {
      reference: '110:1',
      explanation:
        "Revealed near the end of the Prophet's ﷺ life. When Allah's victory and the conquest of Mecca came without battle, the response commanded was more worship and seeking forgiveness — not pride.",
      audioUrl: audio(110, 1),
    },
    mcq: {
      question: 'When victory comes, Surah An-Nasr commands us to do what?',
      options: ['Celebrate and rest', 'Praise Allah and seek His forgiveness', 'Announce it widely'],
      correctIndex: 1,
    },
    actionText: "Think of a recent success. Did you thank Allah properly? Say 'Subhanallahi wa bihamdih' often today.",
  },
  {
    day: 5,
    title: 'Surah Al-Fil',
    subtitle: 'The miraculous defeat of the army of elephants',
    focus: "Surah 105 — Allah's power over armies",
    learnContent: {
      reference: '105:1',
      explanation:
        "Around the year of the Prophet's birth, Abraha marched an army with elephants to destroy the Kaaba. Allah sent birds carrying stones and the army was destroyed. 'Have you not considered how your Lord dealt with them?'",
      audioUrl: audio(105, 1),
    },
    mcq: {
      question: 'Who led the army of elephants against the Kaaba?',
      options: ['Abu Jahl', 'Abraha', 'Pharaoh'],
      correctIndex: 1,
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
      explanation:
        "The Quraysh had two trade journeys — winter and summer — and Allah protected and fed them. In return: worship the Lord of this House. All our security and food come from Allah alone.",
      audioUrl: audio(106, 1),
    },
    mcq: {
      question: 'The two journeys of the Quraysh mentioned in this surah were?',
      options: ['Mecca to Madinah and back', 'A winter journey and a summer journey', 'Day and night journeys'],
      correctIndex: 1,
    },
    actionText: 'List 3 specific things making you feel secure today. Then say Alhamdulillah for each one.',
  },
  {
    day: 7,
    title: "Surah Al-Ma'un",
    subtitle: 'True faith includes caring for people',
    focus: 'Surah 107 — worship without compassion is incomplete',
    learnContent: {
      reference: '107:1',
      explanation:
        "Who truly denies the religion? Not only the disbeliever — but the one who repels the orphan and does not urge feeding the poor. Faith without care for people is incomplete faith.",
      audioUrl: audio(107, 1),
    },
    mcq: {
      question: "According to Surah Al-Ma'un, who truly denies the religion?",
      options: ["Only those who reject Allah", "Those who repel the orphan and don't encourage feeding the poor", 'Those who travel often'],
      correctIndex: 1,
    },
    actionText: "Do one genuine act of care today — feed someone, check on a neighbour, give sadaqah.",
  },
  {
    day: 8,
    title: 'Surah Al-Masad',
    subtitle: 'A surah that proves the Quran is divine',
    focus: 'Surah 111 — the consequence of opposing truth',
    learnContent: {
      reference: '111:1',
      explanation:
        "Abu Lahab was the Prophet's ﷺ uncle who violently opposed Islam. This surah foretold he would die a disbeliever — and he did. No human author would condemn his own uncle by name and stake the message on it.",
      audioUrl: audio(111, 1),
    },
    mcq: {
      question: 'Why is Surah Al-Masad seen as evidence of the Quran’s divine origin?',
      options: ['It is beautifully written', "It condemned the Prophet's own uncle and its prophecy came true", 'It is the shortest surah'],
      correctIndex: 1,
    },
    actionText: 'As you recite it, reflect: am I standing on the side of truth or of comfort?',
  },
  {
    day: 9,
    title: 'Surah An-Nas',
    subtitle: 'Triple protection from the whispering enemy',
    focus: 'Surah 114 — daily shield against Shaytan',
    learnContent: {
      reference: '114:1',
      explanation:
        "'I seek refuge in the Lord of mankind.' This surah names Allah as Lord, King, and God of mankind — triple protection — from the retreating whisperer who flees when you remember Allah.",
      audioUrl: audio(114, 1),
    },
    mcq: {
      question: 'The "retreating whisperer" in Surah An-Nas refers to?',
      options: ['Bad friends', 'Shaytan — who retreats when you remember Allah', 'Your own memory'],
      correctIndex: 1,
    },
    actionText: "Recite Surah An-Nas before sleeping — a Prophetic Sunnah every night.",
  },
  {
    day: 10,
    title: 'Surah Al-Falaq',
    subtitle: 'The shield against visible and invisible harm',
    focus: 'Surah 113 — comprehensive divine protection',
    learnContent: {
      reference: '113:1',
      explanation:
        "'I seek refuge in the Lord of daybreak.' We seek refuge from the evil of creation, of darkness, of harmful practices, and of envy. With An-Nas, these are the Mu'awwidhatayn — recited morning and evening.",
      audioUrl: audio(113, 1),
    },
    mcq: {
      question: 'What does الْفَلَق (Al-Falaq) mean?',
      options: ['The night', 'The daybreak', 'The stars'],
      correctIndex: 1,
    },
    actionText: "Add Al-Falaq and An-Nas to your morning and evening adhkar — every day.",
  },
  {
    day: 11,
    title: 'Surah Al-Kafirun',
    subtitle: 'A clear line: no compromise in worship',
    focus: 'Surah 109 — sincerity in creed',
    learnContent: {
      reference: '109:1',
      explanation:
        "'Say: O disbelievers' — this surah politely but firmly refuses any mixing of worship. The Prophet ﷺ recited it often; it is a declaration of pure devotion to Allah alone.",
      audioUrl: audio(109, 1),
    },
    mcq: {
      question: 'What is the main message of Surah Al-Kafirun?',
      options: ['Hostility to all people', 'No compromise in pure worship of Allah', 'A call to isolate oneself'],
      correctIndex: 1,
    },
    actionText: 'Identify one area where you "mix intentions". Renew it sincerely for Allah today.',
  },
  {
    day: 12,
    title: 'Surah Al-Kafirun: The Close',
    subtitle: '"For you your religion, and for me mine"',
    focus: 'Surah 109:6 — dignified coexistence',
    learnContent: {
      reference: '109:6',
      explanation:
        "'For you is your religion, and for me is mine.' Firmness in belief together with peaceful coexistence — clarity of creed does not require hostility toward people.",
      audioUrl: audio(109, 6),
    },
    mcq: {
      question: 'The final verse of Al-Kafirun teaches a Muslim to be…',
      options: ['Aggressive toward others', 'Firm in belief yet peaceful with people', 'Silent about belief'],
      correctIndex: 1,
    },
    actionText: 'Have one respectful conversation today where you disagree without anger.',
  },
  {
    day: 13,
    title: 'Surah At-Takathur',
    subtitle: 'The distraction of endless accumulation',
    focus: 'Surah 102 — competition for more',
    learnContent: {
      reference: '102:1',
      explanation:
        "'Competition in increase distracts you — until you visit the graves.' A direct diagnosis of the modern condition: chasing more until death interrupts. The cure is purpose over accumulation.",
      audioUrl: audio(102, 1),
    },
    mcq: {
      question: 'What does Surah At-Takathur warn against?',
      options: ['Praying too much', 'Being distracted by endless worldly accumulation', 'Travelling'],
      correctIndex: 1,
    },
    actionText: 'Give away or declutter one thing you have been hoarding but do not need.',
  },
  {
    day: 14,
    title: 'Surah Az-Zalzalah',
    subtitle: 'No good deed is too small',
    focus: 'Surah 99:7-8 — atom’s weight',
    learnContent: {
      reference: '99:7',
      explanation:
        "'Whoever does an atom's weight of good will see it, and whoever does an atom's weight of evil will see it.' Nothing is wasted and nothing is hidden — the smallest act counts.",
      audioUrl: audio(99, 7),
    },
    mcq: {
      question: 'What does Surah Az-Zalzalah say about the smallest good deed?',
      options: ['It is ignored', 'Even an atom’s weight of good will be seen', 'Only big deeds count'],
      correctIndex: 1,
    },
    actionText: 'Do one tiny good deed you would normally consider "too small to matter".',
  },
  {
    day: 15,
    title: 'Surah Al-Qadr',
    subtitle: 'The night better than a thousand months',
    focus: 'Surah 97 — Laylat al-Qadr',
    learnContent: {
      reference: '97:1',
      explanation:
        "'Indeed, We sent it down on the Night of Decree.' Worship in this single night is better than a thousand months — Allah multiplies sincere effort beyond imagination.",
      audioUrl: audio(97, 1),
    },
    mcq: {
      question: 'The Night of Decree is described as better than…',
      options: ['A thousand months', 'One year', 'A week of Hajj'],
      correctIndex: 0,
    },
    actionText: 'Set a reminder now to pursue the last ten nights of your next Ramadan seriously.',
  },
  {
    day: 16,
    title: 'Surah Al-Bayyinah',
    subtitle: 'Sincerity is the core of the religion',
    focus: 'Surah 98:5 — worship with sincerity',
    learnContent: {
      reference: '98:5',
      explanation:
        "'They were commanded only to worship Allah, sincere in devotion to Him, and to establish prayer and give zakah.' This verse summarises the essence of every revealed religion: sincerity.",
      audioUrl: audio(98, 5),
    },
    mcq: {
      question: 'According to 98:5, worship must be done with…',
      options: ['Sincerity to Allah alone', 'An audience watching', 'Payment expected'],
      correctIndex: 0,
    },
    actionText: 'Do one act of worship today that absolutely no one else will ever know about.',
  },
  {
    day: 17,
    title: "Surah Ad-Duha",
    subtitle: "Allah has not abandoned you",
    focus: 'Surah 93 — comfort in silence',
    learnContent: {
      reference: '93:3',
      explanation:
        "Revealed when revelation paused and the Prophet ﷺ felt alone: 'Your Lord has not forsaken you, nor does He hate you.' A direct reassurance for anyone who feels distant from Allah.",
      audioUrl: audio(93, 3),
    },
    mcq: {
      question: 'What reassurance does Surah Ad-Duha give?',
      options: ['Allah has not forsaken you', 'Wealth is coming soon', 'Enemies will be punished today'],
      correctIndex: 0,
    },
    actionText: 'If you feel spiritually distant, pray two units of prayer right now — return is always open.',
  },
  {
    day: 18,
    title: 'Surah Ash-Sharh',
    subtitle: 'Relief packaged inside difficulty',
    focus: 'Surah 94:5-8 — ease with hardship',
    learnContent: {
      reference: '94:5',
      explanation:
        "'For indeed, with hardship comes ease.' Stated twice. The surah ends by directing energy from one finished task straight into worship — momentum toward Allah.",
      audioUrl: audio(94, 5),
    },
    mcq: {
      question: 'How many times does Surah Ash-Sharh state that ease comes with hardship?',
      options: ['Once', 'Twice', 'Seven times'],
      correctIndex: 1,
    },
    actionText: 'When you finish your next task today, immediately do one small act of worship.',
  },
  {
    day: 19,
    title: 'Surah Al-Humazah',
    subtitle: 'The danger of mockery and hoarding',
    focus: 'Surah 104 — character and wealth',
    learnContent: {
      reference: '104:1',
      explanation:
        "A warning to every backbiter and slanderer who amasses wealth and counts it, thinking it will make him immortal. The surah links cruel speech and greed as a single disease.",
      audioUrl: audio(104, 1),
    },
    mcq: {
      question: 'Surah Al-Humazah condemns which two things together?',
      options: ['Prayer and fasting', 'Mocking/slander and hoarding wealth', 'Travel and trade'],
      correctIndex: 1,
    },
    actionText: 'Catch yourself once today before a sarcastic or mocking comment — and stay silent.',
  },
  {
    day: 20,
    title: "Surah Al-'Alaq",
    subtitle: 'The first revelation: Read',
    focus: "Surah 96:1 — the first command",
    learnContent: {
      reference: '96:1',
      explanation:
        "'Read, in the name of your Lord who created.' The first words of the Quran ever revealed. Knowledge begins with the name of Allah — you have completed the intermediate curriculum by answering that call.",
      audioUrl: audio(96, 1),
    },
    mcq: {
      question: "What is the theme of the first revealed verse of the Quran?",
      options: ['Wealth', 'Reading and knowledge in the name of your Lord', 'Warfare'],
      correctIndex: 1,
    },
    actionText: "You completed the intermediate curriculum! Begin a habit of reading one short tafsir note daily.",
  },
];

// ── FLUENT: Powerful Verses ───────────────────────────────────────────────────

const FLUENT: Lesson[] = [
  {
    day: 1,
    title: 'Al-Fatiha: Tajweed Focus',
    subtitle: 'The prayer within the prayer — perfect every rule',
    focus: 'Al-Fatiha 1:1 — tajweed precision',
    learnContent: {
      reference: '1:1',
      explanation:
        "Focus on tajweed in the Bismillah: the meem with its nasal linger, the shaddah doubling the Ra, and the elongation (madd) in Rahman. Al-Fatiha is recited more than any other text in human history.",
      audioUrl: audio(1, 1),
    },
    mcq: {
      question: 'In tajweed, a shaddah (ّ) on a letter means?',
      options: ['Make it silent', 'Double the letter — hold it twice as long', 'Make it nasal'],
      correctIndex: 1,
    },
    actionText: 'Recite Al-Fatiha slowly in your next salah, pausing after each ayah — it is a conversation.',
  },
  {
    day: 2,
    title: 'Ayatul Kursi',
    subtitle: 'The greatest single verse in the Quran',
    focus: 'Al-Baqarah 2:255 — the Throne Verse',
    learnContent: {
      reference: '2:255',
      explanation:
        "The Prophet ﷺ said Ayatul Kursi is the greatest verse in the Quran. Al-Hayy (Ever-Living) and Al-Qayyum (Self-Sustaining, upon whom all existence depends) — every atom is held in being by Him. Recite it after every fard salah.",
      audioUrl: audio(2, 255),
    },
    mcq: {
      question: 'Ayatul Kursi is described by the Prophet ﷺ as?',
      options: ['The longest verse', 'The greatest verse in the Quran', 'A verse only for Ramadan'],
      correctIndex: 1,
    },
    actionText: 'Memorise Ayatul Kursi if you have not. Recite it after every fard salah — a Sunnah with great reward.',
  },
  {
    day: 3,
    title: "The Believer's Declaration",
    subtitle: 'Al-Baqarah 285 — the creed that earns mercy',
    focus: 'Al-Baqarah 2:285 — "we hear and we obey"',
    learnContent: {
      reference: '2:285',
      explanation:
        "The last two verses of Al-Baqarah are called the Khawateem (the Seals). 'We hear and we obey' is the believer's response to revelation — submission with trust.",
      audioUrl: audio(2, 285),
    },
    mcq: {
      question: "What is the believer's response to revelation in 2:285?",
      options: ['"We will think about it"', '"We hear and we obey"', '"We need proof first"'],
      correctIndex: 1,
    },
    actionText: "Recite Al-Baqarah 285–286 tonight before sleeping. Make this a permanent nightly habit.",
  },
  {
    day: 4,
    title: "Allah's Promise: No Overburden",
    subtitle: 'Al-Baqarah 286 — the most comforting verse',
    focus: 'Al-Baqarah 2:286 — capacity and mercy',
    learnContent: {
      reference: '2:286',
      explanation:
        "'Allah does not burden a soul beyond what it can bear.' Whatever you are carrying, by definition you have the capacity for it. The verse also teaches the dua asking Allah not to hold us accountable for honest mistakes.",
      audioUrl: audio(2, 286),
    },
    mcq: {
      question: 'What does Allah promise in 2:286?',
      options: ['No one will ever be tested', 'No soul is burdened beyond its capacity', 'Hardship is punishment'],
      correctIndex: 1,
    },
    actionText: "Memorise the dua at the end of 2:286 and use it when guilt from past mistakes weighs on you.",
  },
  {
    day: 5,
    title: 'Witness to Oneness',
    subtitle: 'Allah, the angels, and people of knowledge testify',
    focus: 'Al-Imran 3:18 — testimony of Tawheed',
    learnContent: {
      reference: '3:18',
      explanation:
        "'Allah witnesses that there is no deity except Him, and so do the angels and those of knowledge.' To be a sincere seeker of knowledge is to join the angels in witnessing Tawheed, upheld with justice.",
      audioUrl: audio(3, 18),
    },
    mcq: {
      question: 'The three witnesses to Tawheed named in 3:18 are?',
      options: ['Prophets, Companions, Scholars', 'Allah, the Angels, and People of Knowledge', 'Quran, Sunnah, Consensus'],
      correctIndex: 1,
    },
    actionText: "Recite this verse after Fajr and reflect: my pursuit of knowledge is an act of witnessing.",
  },
  {
    day: 6,
    title: 'Ya-Sin: Heart of the Quran',
    subtitle: "The surah called the Quran's heart",
    focus: 'Ya-Sin 36:1-3 — the mysterious opening',
    learnContent: {
      reference: '36:1',
      explanation:
        "Ya-Sin opens with disconnected letters whose full meaning is known to Allah, followed by an oath by the Wise Quran affirming the Prophet ﷺ is truly a messenger. Reciting Ya-Sin is an established Sunnah.",
      audioUrl: audio(36, 1),
    },
    mcq: {
      question: 'What is affirmed in the opening verses of Ya-Sin?',
      options: ['That the Prophet ﷺ is truly one of the messengers', 'A law of inheritance', 'The story of Musa'],
      correctIndex: 0,
    },
    actionText: "Recite or listen to Ya-Sin today with the translation open beside you.",
  },
  {
    day: 7,
    title: 'Al-Mulk: The Protector',
    subtitle: 'The surah of sovereignty',
    focus: "Al-Mulk 67:1 — Allah's absolute dominion",
    learnContent: {
      reference: '67:1',
      explanation:
        "'Blessed is He in whose hand is all dominion, and He is over all things competent.' Every power on earth is ultimately in Allah's hand. The Prophet ﷺ encouraged reciting Al-Mulk regularly, especially at night.",
      audioUrl: audio(67, 1),
    },
    mcq: {
      question: 'Surah Al-Mulk opens by declaring that all dominion is…',
      options: ['Shared among kings', "In Allah's hand alone", 'Temporary for everyone equally'],
      correctIndex: 1,
    },
    actionText: "Start memorising Al-Mulk — the first 5 ayahs tonight.",
  },
  {
    day: 8,
    title: 'Ar-Rahman: The Divine Teacher',
    subtitle: 'He taught the Quran',
    focus: 'Ar-Rahman 55:1-4 — gifts of the Most Merciful',
    learnContent: {
      reference: '55:1',
      explanation:
        "'The Most Merciful taught the Quran, created man, taught him eloquence.' Allah mentions teaching the Quran before creating man — the Quran is the greatest gift to humanity, and speech itself is His gift.",
      audioUrl: audio(55, 1),
    },
    mcq: {
      question: "In Ar-Rahman's opening, what is mentioned BEFORE the creation of man?",
      options: ['The mountains', 'Teaching the Quran', 'The night and day'],
      correctIndex: 1,
    },
    actionText: "Read Surah Ar-Rahman today, answering its recurring question with gratitude.",
  },
  {
    day: 9,
    title: 'The Beautiful Names',
    subtitle: "Al-Hashr 22-24 — Allah's names concentrated",
    focus: 'Al-Hashr 59:22 — divine attributes',
    learnContent: {
      reference: '59:22',
      explanation:
        "'He is Allah, other than whom there is no deity, Knower of the unseen and the witnessed.' Your private thoughts and unspoken secrets are fully known to Him — and He is still Ar-Rahman, Ar-Raheem.",
      audioUrl: audio(59, 22),
    },
    mcq: {
      question: '59:22 describes Allah as the Knower of…',
      options: ['Only what is visible', 'The unseen AND the witnessed', 'Only the future'],
      correctIndex: 1,
    },
    actionText: "Memorise Al-Hashr 22–24 and add them to your morning and evening adhkar.",
  },
  {
    day: 10,
    title: 'The Noble Quran',
    subtitle: "Al-Waqiah 77-80 — the Book you hold",
    focus: 'Al-Waqiah 56:77-80 — the divine origin of the Quran',
    learnContent: {
      reference: '56:77',
      explanation:
        "'Indeed, it is a noble Quran, in a protected Register' — guarded in the heavens, a revelation from the Lord of the worlds, sent down to you. Approach it with the honour it deserves.",
      audioUrl: audio(56, 77),
    },
    mcq: {
      question: 'How does Al-Waqiah 77-80 describe the Quran?',
      options: ['An ordinary book', 'A noble Quran, in a protected Register, from the Lord of the worlds', 'A book of poetry'],
      correctIndex: 1,
    },
    actionText: "Before your next recitation, pause and remember the honour of what you are holding.",
  },
  {
    day: 11,
    title: 'Remember Me, I Remember You',
    subtitle: 'A two-way promise',
    focus: 'Al-Baqarah 2:152',
    learnContent: {
      reference: '2:152',
      explanation:
        "'So remember Me; I will remember you. And be grateful to Me and do not deny Me.' Allah's remembrance of you in return is immeasurably greater than your remembrance of Him.",
      audioUrl: audio(2, 152),
    },
    mcq: {
      question: 'What does Allah promise in 2:152 in return for remembering Him?',
      options: ['He will remember you', 'Immediate wealth', 'Nothing specific'],
      correctIndex: 0,
    },
    actionText: 'Keep your tongue moist with dhikr for the gaps in your day — walking, waiting, commuting.',
  },
  {
    day: 12,
    title: 'Patience and Prayer',
    subtitle: 'The two tools for every hardship',
    focus: 'Al-Baqarah 2:153',
    learnContent: {
      reference: '2:153',
      explanation:
        "'O you who believe, seek help through patience and prayer. Indeed, Allah is with the patient.' Two practical instruments are given for every difficulty, and a promise of His companionship.",
      audioUrl: audio(2, 153),
    },
    mcq: {
      question: 'According to 2:153, what two things should we seek help through?',
      options: ['Wealth and status', 'Patience and prayer', 'Friends and planning'],
      correctIndex: 1,
    },
    actionText: 'Next time you feel overwhelmed, pause and pray two units before reacting.',
  },
  {
    day: 13,
    title: 'Allah Is Near',
    subtitle: 'No intermediary needed',
    focus: 'Al-Baqarah 2:186',
    learnContent: {
      reference: '2:186',
      explanation:
        "'When My servants ask you about Me — indeed I am near. I respond to the call of the caller when he calls upon Me.' Allah answers directly; there is no distance and no middleman in dua.",
      audioUrl: audio(2, 186),
    },
    mcq: {
      question: 'What does 2:186 say about Allah’s nearness to those who call on Him?',
      options: ['He is distant', 'He is near and responds to the caller', 'Only prophets can reach Him'],
      correctIndex: 1,
    },
    actionText: 'Make one heartfelt dua today in your own words, certain it is heard.',
  },
  {
    day: 14,
    title: 'A Dua for a Steady Heart',
    subtitle: 'Ask not to be led astray after guidance',
    focus: 'Al-Imran 3:8',
    learnContent: {
      reference: '3:8',
      explanation:
        "'Our Lord, let not our hearts deviate after You have guided us, and grant us mercy from Yourself.' Guidance must be protected with constant dua — hearts turn, so we ask the One who turns them.",
      audioUrl: audio(3, 8),
    },
    mcq: {
      question: 'What does the dua in 3:8 ask Allah to protect?',
      options: ['Wealth', 'The heart from deviating after guidance', 'Reputation'],
      correctIndex: 1,
    },
    actionText: 'Memorise this short dua and add it to your daily routine.',
  },
  {
    day: 15,
    title: 'Owner of All Sovereignty',
    subtitle: 'Honour and provision are in His hand',
    focus: 'Al-Imran 3:26',
    learnContent: {
      reference: '3:26',
      explanation:
        "'Say: O Allah, Owner of Sovereignty, You give sovereignty to whom You will and take it away from whom You will... in Your hand is all good.' A powerful dua against arrogance and despair alike.",
      audioUrl: audio(3, 26),
    },
    mcq: {
      question: '3:26 teaches that honour and dominion are…',
      options: ['Earned only by force', "Given and removed by Allah", 'Permanent for the powerful'],
      correctIndex: 1,
    },
    actionText: 'When you see someone with status, make dua for them instead of envying them.',
  },
  {
    day: 16,
    title: 'A Way Out',
    subtitle: 'Taqwa opens unexpected doors',
    focus: 'At-Talaq 65:2-3',
    learnContent: {
      reference: '65:3',
      explanation:
        "'Whoever fears Allah — He will make for him a way out, and provide for him from where he does not expect. And whoever relies upon Allah — He is sufficient for him.' Taqwa plus tawakkul is the formula for relief.",
      audioUrl: audio(65, 3),
    },
    mcq: {
      question: 'According to 65:2-3, what does Allah promise the one who fears Him and relies on Him?',
      options: ['A way out and provision from unexpected places', 'Immediate fame', 'Freedom from all tests'],
      correctIndex: 0,
    },
    actionText: 'Identify one decision where you can choose the God-conscious option over the easy one — and take it.',
  },
  {
    day: 17,
    title: 'Hearts Find Rest',
    subtitle: 'The cure for a restless mind',
    focus: "Ar-Ra'd 13:28",
    learnContent: {
      reference: '13:28',
      explanation:
        "'Unquestionably, by the remembrance of Allah hearts find rest.' Anxiety quiets not by control of outcomes but by connection to Allah — dhikr is the prescription for an unsettled heart.",
      audioUrl: audio(13, 28),
    },
    mcq: {
      question: 'According to 13:28, hearts find true rest in…',
      options: ['Success', 'The remembrance of Allah', 'Sleep'],
      correctIndex: 1,
    },
    actionText: 'When your mind races today, stop and say "La ilaha illallah" slowly ten times.',
  },
  {
    day: 18,
    title: 'Never Despair of Mercy',
    subtitle: 'The most hopeful verse for the sinner',
    focus: 'Az-Zumar 39:53',
    learnContent: {
      reference: '39:53',
      explanation:
        "'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins.' No sin is too great for sincere repentance.",
      audioUrl: audio(39, 53),
    },
    mcq: {
      question: 'What does 39:53 tell those who have sinned greatly?',
      options: ['It is too late', 'Do not despair — Allah forgives all sins', 'Only minor sins are forgiven'],
      correctIndex: 1,
    },
    actionText: 'If a past sin still haunts you, make sincere tawbah right now and let it go.',
  },
  {
    day: 19,
    title: 'Call Upon Me',
    subtitle: 'An open invitation to ask',
    focus: 'Ghafir 40:60',
    learnContent: {
      reference: '40:60',
      explanation:
        "'Your Lord says: Call upon Me; I will respond to you.' Dua is not a backup plan — it is itself an act of worship that Allah personally invited you to.",
      audioUrl: audio(40, 60),
    },
    mcq: {
      question: 'In 40:60, what does Allah invite people to do?',
      options: ['Call upon Him — He will respond', 'Stay silent', 'Only ask through others'],
      correctIndex: 0,
    },
    actionText: 'Keep a short list of three duas and ask Allah for them every day this week.',
  },
  {
    day: 20,
    title: 'Gratitude Multiplies',
    subtitle: "Allah's guarantee for the thankful",
    focus: 'Ibrahim 14:7',
    learnContent: {
      reference: '14:7',
      explanation:
        "'If you are grateful, I will surely increase you.' Gratitude is not just good manners — it is a divine mechanism for increase. You completed the fluent curriculum; gratitude keeps the growth going.",
      audioUrl: audio(14, 7),
    },
    mcq: {
      question: 'What does Allah promise the grateful in 14:7?',
      options: ['He will increase them', 'Nothing changes', 'A delayed reward only'],
      correctIndex: 0,
    },
    actionText: "You completed the fluent curriculum! Write three specific things you are grateful for, every night.",
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
