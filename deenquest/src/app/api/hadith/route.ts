import { NextRequest, NextResponse } from "next/server";

// hadithapi.com integration
//
// API docs: https://hadithapi.com/docs
// Set HADITH_API_KEY in .env (server-only). Endpoint:
//   GET https://hadithapi.com/api/hadiths?apiKey={key}&book={slug}&hadithEnglish={kw}&status=Sahih&paginate=25
// If missing or fails, we fall back to Groq, then a curated bank.

const HADITH_BASE = "https://hadithapi.com/api/hadiths";

interface CachedEntry {
  data: HadithResult;
  expiresAt: number;
}

interface HadithResult {
  english: string;
  narrator?: string;
  collection: string;
  hadithNumber: string;
  reference?: string;
}

const cache = new Map<string, CachedEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

// Mood → English keyword + preferred book (hadithapi.com book slug).
// hadithapi.com supports filtering by `hadithEnglish` (substring match on translation)
// and `book` (slug). We bias to Sahih Bukhari/Muslim for authenticity.
const MOOD_MAP: Record<string, { keyword: string; book: string; label: string }> = {
  stressed: { keyword: "patience", book: "sahih-muslim", label: "Patience" },
  sad: { keyword: "patience", book: "sahih-bukhari", label: "Patience" },
  grateful: { keyword: "thank", book: "sahih-muslim", label: "Gratitude" },
  lost: { keyword: "guidance", book: "sahih-bukhari", label: "Guidance" },
  indecisive: { keyword: "consult", book: "sahih-bukhari", label: "Consultation" },
  justHere: { keyword: "intention", book: "sahih-bukhari", label: "Sincerity" },
  overthinking: { keyword: "remembrance", book: "sahih-muslim", label: "Remembrance" },
  hopeful: { keyword: "trust", book: "sahih-muslim", label: "Trust in Allah" },
};

// Curated fallback — well-known authentic hadith with public references.
const FALLBACK_BANK: Record<string, HadithResult> = {
  stressed: {
    english:
      "Wondrous is the affair of the believer, for there is good in every matter of his — when something pleasing happens to him, he is grateful; and when harm befalls him, he is patient.",
    narrator: "Suhaib (RA)",
    collection: "Sahih Muslim",
    hadithNumber: "2999",
    reference: "Muslim 2999",
  },
  sad: {
    english:
      "No fatigue, illness, sorrow, sadness, hurt or distress befalls a Muslim — even the prick of a thorn — but that Allah expiates some of his sins by it.",
    narrator: "Abu Sa'id Al-Khudri & Abu Hurayrah (RA)",
    collection: "Sahih al-Bukhari",
    hadithNumber: "5641",
    reference: "Bukhari 5641",
  },
  grateful: {
    english: "He who does not thank people, does not thank Allah.",
    narrator: "Abu Hurayrah (RA)",
    collection: "Sunan Abi Dawud",
    hadithNumber: "4811",
    reference: "Abu Dawud 4811",
  },
  lost: {
    english:
      "Whoever Allah wants good for, He grants him understanding of the religion.",
    narrator: "Mu'awiyah (RA)",
    collection: "Sahih al-Bukhari",
    hadithNumber: "71",
    reference: "Bukhari 71",
  },
  indecisive: {
    english:
      "Whoever performs istikharah will not be disappointed, whoever seeks counsel will not regret it, and whoever spends moderately will not be in need.",
    narrator: "Anas ibn Malik (RA)",
    collection: "Al-Mu'jam al-Awsat (At-Tabarani)",
    hadithNumber: "—",
    reference: "Tabarani",
  },
  justHere: {
    english:
      "Actions are but by intentions, and every person will have only what he intended.",
    narrator: "Umar ibn al-Khattab (RA)",
    collection: "Sahih al-Bukhari",
    hadithNumber: "1",
    reference: "Bukhari 1",
  },
  overthinking: {
    english:
      "Whoever among you sees an evil action, let him change it with his hand; and if he is not able to do so, then with his tongue; and if he is not able, then with his heart — and that is the weakest of faith.",
    narrator: "Abu Sa'id Al-Khudri (RA)",
    collection: "Sahih Muslim",
    hadithNumber: "49",
    reference: "Muslim 49",
  },
  hopeful: {
    english:
      "If you were to rely upon Allah with the reliance He is due, you would be given provision like the birds — they go out hungry in the morning and return full in the evening.",
    narrator: "Umar ibn al-Khattab (RA)",
    collection: "Sunan at-Tirmidhi",
    hadithNumber: "2344",
    reference: "Tirmidhi 2344",
  },
};

function getMoodKey(input: string | null): string {
  if (!input) return "justHere";
  const key = input.toLowerCase();
  return key in MOOD_MAP ? key : "justHere";
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

async function fetchFromHadithApi(
  moodKey: string,
  apiKey: string,
  keywordOverride?: string
): Promise<HadithResult | null> {
  const entry = MOOD_MAP[moodKey];
  if (!entry) return null;

  const params = new URLSearchParams({
    apiKey,
    book: entry.book,
    // Keyword may be refined by the LLM (topic only) but the hadith TEXT and
    // NUMBER always come from hadithapi.com — never from the model.
    hadithEnglish: keywordOverride || entry.keyword,
    status: "Sahih",
    paginate: "25",
  });
  const url = `${HADITH_BASE}?${params.toString()}`;

  let data: { hadiths?: { data?: unknown[] } } | undefined;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    data = await res.json();
  } catch {
    return null;
  }

  type RawHadith = {
    hadithEnglish?: string;
    hadithNumber?: string | number;
    englishNarrator?: string;
    book?: { bookName?: string };
  };
  const hadiths: RawHadith[] = Array.isArray(data?.hadiths?.data)
    ? (data!.hadiths!.data as RawHadith[])
    : [];
  if (hadiths.length === 0) return null;

  // Prefer hadiths with non-empty English text and reasonable length.
  const candidates = hadiths.filter((h) => {
    const text = typeof h?.hadithEnglish === "string" ? h.hadithEnglish.trim() : "";
    return text.length > 50 && text.length < 1500;
  });
  const pool = candidates.length > 0 ? candidates : hadiths;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  const body = stripHtml(pick?.hadithEnglish ?? "");
  if (!body) return null;

  const collection = pick?.book?.bookName ?? entry.book;
  const hadithNumber = String(pick?.hadithNumber ?? "");
  const narrator = typeof pick?.englishNarrator === "string"
    ? pick.englishNarrator.replace(/^Narrated\s+/i, "").replace(/[:.]?\s*$/, "").trim() || undefined
    : undefined;

  return {
    english: body.length > 600 ? `${body.slice(0, 590).trim()}…` : body,
    collection,
    hadithNumber,
    narrator,
    reference: hadithNumber ? `${collection} ${hadithNumber}` : collection,
  };
}

// Safe, authentic hadith TOPIC keywords. The LLM may only pick FROM this list
// to refine the hadithapi.com search — it never produces hadith text/numbers,
// so it cannot fabricate or misattribute a citation.
const HADITH_KEYWORDS = [
  "patience", "trust", "reliance", "gratitude", "thankful", "mercy",
  "forgiveness", "hope", "guidance", "remembrance", "intention", "sincerity",
  "consult", "contentment", "hardship", "ease", "prayer", "supplication",
  "charity", "kindness", "anxiety", "grief", "comfort",
] as const;

// Groq is used ONLY to map the user's mood/situation to one safe keyword above.
// Hadith TEXT and NUMBER always come from hadithapi.com (status=Sahih) or the
// curated, pre-verified bank — never from the model. Returns null on any doubt.
async function pickHadithKeyword(moodKey: string, situation?: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const topic = MOOD_MAP[moodKey]?.label ?? moodKey;
  const feeling = situation && situation.trim()
    ? `The user wrote: "${situation.trim()}" (mood category: "${topic}").`
    : `The user is feeling: "${topic}".`;

  const systemPrompt =
    "You map a person's feeling to ONE hadith search keyword. " +
    `Reply with exactly one word from this list and nothing else: ${HADITH_KEYWORDS.join(", ")}.`;

  let content: string | undefined;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${feeling}\n\nOne keyword only:` },
        ],
        max_tokens: 8,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    content = data?.choices?.[0]?.message?.content?.trim().toLowerCase();
  } catch {
    return null;
  }

  if (!content) return null;
  // Accept only an exact allowlist match — never trust free-form model output.
  const match = HADITH_KEYWORDS.find((k) => content === k || content.startsWith(k));
  return match ?? null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const moodKey = getMoodKey(searchParams.get("mood"));
  const situation = searchParams.get("situation")?.trim() || "";
  // Free-text situations are personal — don't serve another user's cached
  // result for them. Plain mood selections cache by mood for an hour.
  const useCache = !situation;
  const cacheKey = moodKey;

  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ hadith: cached.data, source: "cache" });
    }
  }

  // 1) hadithapi.com (status=Sahih) is the AUTHORITATIVE source — real text
  //    and real hadith numbers. The LLM, if available, only refines the search
  //    keyword (to a safe allowlist) so the match fits the mood/situation; it
  //    never authors the hadith, so it cannot fabricate a citation.
  const apiKey = process.env.HADITH_API_KEY;
  if (apiKey) {
    const keyword = await pickHadithKeyword(moodKey, situation);
    const live = await fetchFromHadithApi(moodKey, apiKey, keyword ?? undefined);
    if (live) {
      if (useCache) cache.set(cacheKey, { data: live, expiresAt: Date.now() + CACHE_TTL_MS });
      return NextResponse.json({ hadith: live, source: "hadithapi" });
    }
  }

  // 2) Curated bank — pre-verified authentic hadith with public references,
  //    one per mood. Guarantees the client always gets a relevant, correctly
  //    attributed hadith even when the live API is unavailable.
  const fallback = FALLBACK_BANK[moodKey] ?? FALLBACK_BANK.justHere;
  return NextResponse.json({ hadith: fallback, source: "curated" });
}
