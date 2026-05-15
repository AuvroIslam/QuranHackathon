import { NextRequest, NextResponse } from "next/server";
import { fetchVerseContent } from "@/lib/server/qf-verse";

// ── Reference bank: only stores verse keys, explanations, and audio URLs.
// Arabic text and translations are fetched from the QF API — never hardcoded.
const REFERENCE_BANK: Record<string, Array<{ ref: string; explanation: string; audioUrl: string }>> = {
  stressed: [
    { ref: "94:5",  explanation: "Allah promises that every difficulty carries relief within it — not after it, but with it.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/094005.mp3" },
    { ref: "2:286", explanation: "Whatever you are facing right now — Allah already knows you can handle it.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/002286.mp3" },
    { ref: "13:28", explanation: "When the world feels overwhelming, returning to Allah is the only true calm.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/013028.mp3" },
  ],
  sad: [
    { ref: "93:3",  explanation: "Allah revealed this ayah when the Prophet felt abandoned. You are never truly alone.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/093003.mp3" },
    { ref: "9:40",  explanation: "These are the words the Prophet said in the darkest moment. Let them reach your heart too.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/009040.mp3" },
    { ref: "12:87", explanation: "No matter how low you feel, Allah's mercy is always greater. Hope is never lost.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/012087.mp3" },
  ],
  grateful: [
    { ref: "14:7",  explanation: "Allah promises that gratitude itself is a magnet for more blessings. It's a divine guarantee.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/014007.mp3" },
    { ref: "55:13", explanation: "This question is asked 31 times in Surah Rahman — a reminder to count your blessings.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/055013.mp3" },
    { ref: "2:152", explanation: "A two-way promise: when you remember Allah, He remembers you personally.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/002152.mp3" },
  ],
  lost: [
    { ref: "93:7",  explanation: "Allah guided the Prophet from confusion to clarity. He can do the same for you today.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/093007.mp3" },
    { ref: "2:186", explanation: "You do not need a mediator. Allah is directly, personally close to you right now.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/002186.mp3" },
    { ref: "39:53", explanation: "Even if you've strayed far, the door of return is always open. Allah's mercy has no limit.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/039053.mp3" },
  ],
  indecisive: [
    { ref: "2:45",  explanation: "When you cannot decide, bring it to Allah in salah. The answer often comes through stillness.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/002045.mp3" },
    { ref: "3:159", explanation: "Seek counsel, then decide — and once decided, trust Allah completely with the outcome.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/003159.mp3" },
  ],
  justHere: [
    { ref: "50:16", explanation: "Allah knows every thought before you think it. You are never hidden from His love.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/050016.mp3" },
    { ref: "3:139", explanation: "Strength and grief cannot coexist with faith. Rise — you were built for this.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/003139.mp3" },
  ],
  overthinking: [
    { ref: "65:3",  explanation: "Stop carrying the weight of every outcome. When you hand it to Allah, it is handled.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/065003.mp3" },
    { ref: "13:28", explanation: "The mind quiets when the heart connects to Allah. Dhikr is the cure for a racing mind.", audioUrl: "https://everyayah.com/data/Alafasy_128kbps/013028.mp3" },
  ],
};

// MCQs by reference — these are comprehension questions, not Quran text
const MCQ_BANK: Record<string, { question: string; options: string[]; correctIndex: number }> = {
  "94:5":  { question: "What does this ayah promise about hardship?", options: ["It will last forever", "Ease comes with it", "Patience removes it"], correctIndex: 1 },
  "2:286": { question: "What does Allah NOT do according to this ayah?", options: ["Forgive sins", "Burden a soul beyond its capacity", "Answer prayers"], correctIndex: 1 },
  "13:28": { question: "Where do hearts find true rest?", options: ["In success", "In sleep", "In remembrance of Allah"], correctIndex: 2 },
  "93:3":  { question: "What does Allah say He has NOT done to the Prophet?", options: ["Forsaken him", "Guided him", "Blessed him"], correctIndex: 0 },
  "9:40":  { question: "What did the Prophet say to comfort his companion?", options: ["Be brave", "Don't grieve, Allah is with us", "We will escape"], correctIndex: 1 },
  "12:87": { question: "What should believers never do?", options: ["Despair of Allah's mercy", "Ask for help", "Make dua"], correctIndex: 0 },
  "14:7":  { question: "What does Allah promise in exchange for gratitude?", options: ["More wealth", "Increase in His favor", "Better health"], correctIndex: 1 },
  "55:13": { question: "How many times is this question asked in Surah Rahman?", options: ["7 times", "21 times", "31 times"], correctIndex: 2 },
  "2:152": { question: "If you remember Allah, what will He do?", options: ["Test you more", "Remember you", "Give you wealth"], correctIndex: 1 },
  "93:7":  { question: "What did Allah do when He found the Prophet lost?", options: ["Left him", "Guided him", "Tested him"], correctIndex: 1 },
  "2:186": { question: "How does Allah describe His proximity to us?", options: ["Distant but watching", "Near", "Only reachable through prophets"], correctIndex: 1 },
  "39:53": { question: "What should we never do regarding Allah's mercy?", options: ["Ask for it", "Despair of it", "Rely on it"], correctIndex: 1 },
  "50:16": { question: "How close is Allah to each of us?", options: ["In the sky above", "Closer than our jugular vein", "Only in the masjid"], correctIndex: 1 },
  "3:139": { question: "What two things does Allah forbid in this ayah?", options: ["Anger and pride", "Weakness and grief", "Fear and doubt"], correctIndex: 1 },
  "2:45":  { question: "What two tools does Allah tell us to seek help through?", options: ["Wealth and status", "Patience and prayer", "Friends and family"], correctIndex: 1 },
  "3:159": { question: "After consulting and deciding, what should you do?", options: ["Keep planning", "Put your trust in Allah", "Ask for more opinions"], correctIndex: 1 },
  "65:3":  { question: "Who is sufficient for the one who relies on Allah?", options: ["His community", "His family", "Allah alone"], correctIndex: 2 },
};

const DEFAULT_QUESTION = {
  question: "What is the main message of this ayah?",
  options: ["Patience", "Trust in Allah", "Gratitude"],
  correctIndex: 1,
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mood = searchParams.get("mood") ?? "justHere";

  const pool = REFERENCE_BANK[mood] ?? REFERENCE_BANK.justHere;
  const entry = pool[Math.floor(Math.random() * pool.length)];

  try {
    // Verified Quran text from the QF Content API (public API fallback, cached).
    const v = await fetchVerseContent(entry.ref);
    return NextResponse.json({
      ayah: {
        reference: entry.ref,
        arabic: v.arabic,
        transliteration: v.transliteration,
        translation: v.translation,
        explanation: entry.explanation,
        audioUrl: entry.audioUrl,
      },
      question: MCQ_BANK[entry.ref] ?? DEFAULT_QUESTION,
    });
  } catch {
    // Verified Quran text could not be fetched. We FAIL rather than serve any
    // hardcoded Quran text — the client shows a retry state.
    return NextResponse.json(
      { error: "Verse text temporarily unavailable" },
      { status: 503 }
    );
  }
}
