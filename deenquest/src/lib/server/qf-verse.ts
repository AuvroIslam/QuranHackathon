// SERVER-ONLY. Fetches verified Quran text for a verse key from the Quran
// Foundation Content API (OAuth2 client-credentials) with the public
// api.quran.com API as a transparent fallback. No Quran text is hardcoded
// here — callers that need an offline fallback supply their own and label it.
import { getQFContentToken, getQFHeaders } from "@/lib/qf-auth";

const QF_CONTENT_API = "https://apis.quran.foundation/content/api/v4";
const PUBLIC_QURAN_API = "https://api.quran.com/api/v4";

export interface VerseContent {
  arabic: string;
  transliteration: string;
  translation: string;
}

interface CacheEntry {
  data: VerseContent;
  expiresAt: number;
}

// Verse text is immutable, so a long in-memory TTL is safe and makes repeated
// lesson loads (deterministic per level/day) effectively free after warmup.
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchVerseRaw(chapter: number, verse: number, token: string | null) {
  const path = `verses/by_key/${chapter}:${verse}`;
  // Translation ID 20 = Saheeh International. words=true gives word-level
  // transliteration so we never hardcode it.
  const params =
    "?words=true&translations=20&fields=text_uthmani&word_fields=text_uthmani,transliteration_en";

  if (token) {
    try {
      const res = await fetch(`${QF_CONTENT_API}/${path}${params}`, {
        headers: getQFHeaders(token),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) return await res.json();
    } catch {
      // fall through to the public API
    }
  }

  const res = await fetch(`${PUBLIC_QURAN_API}/${path}${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`QF API error ${res.status}`);
  return await res.json();
}

/**
 * Returns verified Arabic / transliteration / translation for a verse key
 * ("chapter:verse"), cached 1h. Throws if both QF and the public API fail or
 * return no Arabic — callers decide whether/how to fall back.
 */
export async function fetchVerseContent(reference: string): Promise<VerseContent> {
  const key = reference.trim();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const [c, v] = key.split(":").map((n) => parseInt(n, 10));
  if (!Number.isFinite(c) || !Number.isFinite(v)) {
    throw new Error(`Invalid verse key: ${reference}`);
  }

  const token = await getQFContentToken();
  const data = await fetchVerseRaw(c, v, token);
  const verse = data.verse;

  const transliteration: string = (verse?.words ?? [])
    .filter((w: { char_type_name?: string }) => w.char_type_name !== "end")
    .map((w: { transliteration?: { text?: string } }) => w.transliteration?.text ?? "")
    .join(" ")
    .trim();
  const arabic: string = verse?.text_uthmani ?? "";
  const translation: string = (verse?.translations?.[0]?.text ?? "")
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "") // strip <sup>N</sup> blocks
    .replace(/<[^>]*>/g, "")                     // strip any remaining tags
    .replace(/([A-Za-z\]])\d+(?=\s|[.,;!?]|$)/g, "$1") // strip bare footnote numbers glued to words
    .replace(/\s+/g, " ")
    .trim();

  if (!arabic) throw new Error("QF returned empty verse text");

  const result: VerseContent = { arabic, transliteration, translation };
  cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
