import { NextRequest, NextResponse } from "next/server";
import { fetchVerseContent } from "@/lib/server/qf-verse";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

const MISTRAL_MODEL = process.env.MISTRAL_DAWAH_MODEL || "mistral-small-latest";

function verseKeyToAudioUrl(ref: string): string {
  const [s, a] = ref.split(":").map(Number);
  if (!s || !a) return "";
  return `https://everyayah.com/data/Alafasy_128kbps/${String(s).padStart(3, "0")}${String(a).padStart(3, "0")}.mp3`;
}

async function fetchAiVerseForCustomMood(
  customText: string
): Promise<{ verseKey: string; explanation: string } | null> {
  // DeepSeek first — better instruction-following for nuanced verse selection.
  // Groq is faster but tends to give generic answers on complex prompts.
  const providers = [
    { url: "https://api.deepseek.com/chat/completions", model: "deepseek-chat", key: process.env.DEEPSEEK_API_KEY },
    { url: "https://api.mistral.ai/v1/chat/completions", model: MISTRAL_MODEL, key: process.env.MISTRAL_API_KEY },
    { url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", key: process.env.GROQ_API_KEY },
  ];
  const systemPrompt = `You are an Islamic scholar with encyclopedic knowledge of all 6,236 verses across all 114 surahs. Your task: find the ONE verse that fits THIS person's situation so precisely that it would NOT be the right answer for any other common hardship.

HARD RULES — break any = wrong answer:
1. NEVER pick these overused verses: 3:139, 94:5, 94:6, 2:286, 65:3, 39:53, 13:28, 2:153, 9:40, 12:87, 3:200. They are banned.
2. The verse must be CATEGORY-SPECIFIC. "Fear of failing an exam" is not the same category as "grief for a sick parent" which is not the same as "worry about family finances." Each needs a completely different verse.
3. Category examples: exam/performance anxiety → knowledge, effort+trust, focus (20:114, 18:10); sick parent → Allah as Al-Shafi, dua for healing, Ayyub's patience (21:83, 26:80, 2:155); job/provision loss → rizq from Allah alone (11:6, 51:22, 65:7); helplessness → dua answered (40:60, 2:186).
4. Explore beyond Al-Baqarah and short surahs: look at Yusuf, Maryam, Al-Anbiya, Al-Kahf, Ibrahim, Az-Zumar, Ghafir, Al-Qasas, Hud, An-Nahl, Al-Isra.
5. Return ONLY valid JSON — no markdown, no extra text.`;

  const userPrompt = `Person's situation: "${customText}"

First, name the ONE specific spiritual category (e.g. fear-of-failure, grief-for-sick-parent, family-financial-anxiety, helplessness, seeking-healing, loneliness, guilt, confusion).

Then find the verse that addresses THAT category specifically — not hardship in general.

JSON (no markdown):
{"need":"[specific category]","verseKey":"surah:ayah","explanation":"Sentence 1: what they are going through (use their words). Sentence 2: how this verse speaks to that specific need."}`;

  async function tryProvider(p: typeof providers[0]): Promise<{ verseKey: string; explanation: string }> {
    if (!p.key) throw new Error("no key");
    const res = await fetch(p.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
      body: JSON.stringify({
        model: p.model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        max_tokens: 300,
        temperature: 1.0,
      }),
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("empty content");
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (fenced?.[1] ?? content).trim();
    const jsonMatch = candidate.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no json");
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed?.verseKey !== "string" || !/^\d+:\d+$/.test(parsed.verseKey)) throw new Error("invalid key");
    return {
      verseKey: parsed.verseKey,
      explanation: typeof parsed.explanation === "string" ? parsed.explanation.trim() : "",
    };
  }

  for (const p of providers) {
    try {
      return await tryProvider(p);
    } catch {
      continue;
    }
  }
  return null;
}

// ── Reference bank: only stores verse keys, explanations, and audio URLs.
// Arabic text and translations are fetched from the QF API — never hardcoded.
const REFERENCE_BANK: Record<string, Array<{ ref: string; explanation: string }>> = {
  stressed: [
    { ref: "94:5",  explanation: "Allah promises that every difficulty carries relief within it — not after it, but with it." },
    { ref: "2:286", explanation: "Whatever you are facing right now — Allah already knows you can handle it." },
    { ref: "13:28", explanation: "When the world feels overwhelming, returning to Allah is the only true calm." },
    { ref: "65:3",  explanation: "Stop carrying the weight of every outcome. When you hand it to Allah, it is handled." },
    { ref: "3:200", explanation: "Endure — not just once, but with layers of patience. Allah stands with those who persist." },
    { ref: "51:22", explanation: "Your provision and your relief are already written in the heavens. Trust that." },
    { ref: "8:46",  explanation: "Peace comes through unity with Allah, not by fighting every wave alone." },
  ],
  sad: [
    { ref: "93:3",  explanation: "Allah revealed this ayah when the Prophet felt abandoned. You are never truly alone." },
    { ref: "9:40",  explanation: "These are the words the Prophet said in the darkest moment. Let them reach your heart too." },
    { ref: "12:87", explanation: "No matter how low you feel, Allah's mercy is always greater. Hope is never lost." },
    { ref: "94:1",  explanation: "Allah Himself expanded the Prophet's chest in grief. He can lift yours too." },
    { ref: "93:5",  explanation: "After the silence and the dark, a gift is coming. Your Lord has not forgotten you." },
    { ref: "2:153", explanation: "Grief is not weakness — Allah is specifically with those who are patient through it." },
    { ref: "10:57", explanation: "The Quran itself is a cure for what ails your heart. Let it heal from the inside." },
  ],
  grateful: [
    { ref: "14:7",  explanation: "Allah promises that gratitude itself is a magnet for more blessings. It's a divine guarantee." },
    { ref: "55:13", explanation: "This question is asked 31 times in Surah Rahman — a reminder to count your blessings." },
    { ref: "2:152", explanation: "A two-way promise: when you remember Allah, He remembers you personally." },
    { ref: "16:18", explanation: "You could never enumerate all of Allah's blessings — the list is simply infinite." },
    { ref: "31:12", explanation: "Gratitude is not just for Allah — it is the mark of a wise and flourishing soul." },
    { ref: "7:144", explanation: "Being chosen for any blessing is itself a gift worth reflecting on." },
    { ref: "17:3",  explanation: "Gratitude is the quality Allah specifically praised in His chosen servant." },
  ],
  lost: [
    { ref: "93:7",  explanation: "Allah guided the Prophet from confusion to clarity. He can do the same for you today." },
    { ref: "2:186", explanation: "You do not need a mediator. Allah is directly, personally close to you right now." },
    { ref: "39:53", explanation: "Even if you've strayed far, the door of return is always open. Allah's mercy has no limit." },
    { ref: "17:9",  explanation: "The Quran was sent specifically to guide those who are uncertain of their direction." },
    { ref: "6:125", explanation: "When the path feels narrow and suffocating, that tightness is itself a sign to return." },
    { ref: "24:35", explanation: "Allah's light guides whoever He wills out of darkness — and He wills for you." },
    { ref: "4:174", explanation: "A clear light and guidance has come to you — you are not without direction." },
  ],
  indecisive: [
    { ref: "2:45",  explanation: "When you cannot decide, bring it to Allah in salah. The answer often comes through stillness." },
    { ref: "3:159", explanation: "Seek counsel, then decide — and once decided, trust Allah completely with the outcome." },
    { ref: "4:59",  explanation: "When you disagree with yourself, return it to Allah and the wisdom He has given." },
    { ref: "16:43", explanation: "Ask those who know — seeking advice is not weakness, it is the Sunnah." },
    { ref: "42:52", explanation: "You did not know the right path before — Allah guides step by step, not all at once." },
    { ref: "20:114", explanation: "Ask Allah to increase your knowledge. Clarity comes through learning, not waiting." },
  ],
  justHere: [
    { ref: "50:16", explanation: "Allah knows every thought before you think it. You are never hidden from His love." },
    { ref: "3:139", explanation: "Strength and grief cannot coexist with faith. Rise — you were built for this." },
    { ref: "57:22", explanation: "Nothing happens by accident. Your moment right now was already known to Allah." },
    { ref: "4:78",  explanation: "Wherever you are, Allah is with you. No state is outside His presence." },
    { ref: "10:62", explanation: "For Allah's close ones, there is no fear and no grief — that nearness is available to you." },
    { ref: "2:45",  explanation: "Even without a named feeling, patience and prayer are the path through any state." },
  ],
  overthinking: [
    { ref: "65:3",  explanation: "Stop carrying the weight of every outcome. When you hand it to Allah, it is handled." },
    { ref: "13:28", explanation: "The mind quiets when the heart connects to Allah. Dhikr is the cure for a racing mind." },
    { ref: "3:159", explanation: "After consulting your thoughts, decide — then release. Tawakkul ends the loop." },
    { ref: "8:46",  explanation: "The restless mind finds no peace until it stops fighting and surrenders to Allah." },
    { ref: "20:46", explanation: "Do not fear what you cannot control. Allah sees and hears every scenario you imagine." },
    { ref: "10:62", explanation: "Those who are close to Allah are free from fear — including fear of their own thoughts." },
    { ref: "94:5",  explanation: "The loop breaks. After this hardship, ease is guaranteed — hold on." },
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
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, "mood-ayah", 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  const { searchParams } = req.nextUrl;
  const mood = searchParams.get("mood") ?? "justHere";
  const customText = searchParams.get("customText")?.trim() ?? "";

  // Custom mood: AI picks a thematically relevant verse
  if (customText) {
    const aiResult = await fetchAiVerseForCustomMood(customText);
    if (aiResult) {
      try {
        const v = await fetchVerseContent(aiResult.verseKey);
        return NextResponse.json({
          ayah: {
            reference: aiResult.verseKey,
            arabic: v.arabic,
            transliteration: v.transliteration,
            translation: v.translation,
            explanation: aiResult.explanation,
            audioUrl: verseKeyToAudioUrl(aiResult.verseKey),
          },
          question: MCQ_BANK[aiResult.verseKey] ?? DEFAULT_QUESTION,
        });
      } catch {
        // QF fetch failed — fall through to curated bank
      }
    }
    // AI failed or QF unreachable — fall back to curated justHere entry
  }

  const pool = REFERENCE_BANK[mood] ?? REFERENCE_BANK.justHere;
  const entry = pool[Math.floor(Math.random() * pool.length)];

  try {
    const v = await fetchVerseContent(entry.ref);
    return NextResponse.json({
      ayah: {
        reference: entry.ref,
        arabic: v.arabic,
        transliteration: v.transliteration,
        translation: v.translation,
        explanation: entry.explanation,
        audioUrl: verseKeyToAudioUrl(entry.ref),
      },
      question: MCQ_BANK[entry.ref] ?? DEFAULT_QUESTION,
    });
  } catch {
    return NextResponse.json({ error: "Verse text temporarily unavailable" }, { status: 503 });
  }
}
