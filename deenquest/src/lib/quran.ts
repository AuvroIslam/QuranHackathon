// Quran Foundation Content API client
// All requests go through /api/quran proxy

async function qfGet(path: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams({ path, ...params });
  const res = await fetch(`/api/quran?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`QF API error: ${res.status}`);
  return res.json();
}

async function qfSearch(query: string, size = 10) {
  const params = new URLSearchParams({
    query,
    size: String(size),
  });
  const res = await fetch(`/api/quran/search?${params.toString()}`);
  if (!res.ok) throw new Error(`QF Search error: ${res.status}`);
  return res.json();
}

// Fetch English translation for a verse key from Sahih International (resource 20)
async function fetchTranslation(verseKey: string): Promise<string> {
  try {
    const data = await qfGet(`quran/translations/20`, { verse_key: verseKey });
    const raw = data?.translations?.[0]?.text || "";
    return raw.replace(/<sup[^>]*>.*?<\/sup>/gi, "").replace(/<[^>]*>/g, "");
  } catch {
    return "";
  }
}

function parseVerse(verse: any, translation = "") {
  const verseKey = verse.verse_key || "";
  const [surahNum, ayahNum] = verseKey.split(":").map(Number);

  return {
    number: verse.id || 0,
    text: verse.text_uthmani || verse.text || "",
    translation,
    surah: {
      number: surahNum || verse.chapter_id || 0,
      name: "",
      englishName: verse.chapter?.name_simple || `Surah ${surahNum}`,
    },
    numberInSurah: ayahNum || verse.verse_number || 0,
    verseKey,
    audioUrl: verse.audio?.url || null,
  };
}

export async function getRandomAyah() {
  const data = await qfGet("verses/random", {
    fields: "text_uthmani,chapter_id,verse_number,verse_key",
    language: "en",
  });
  const verse = data.verse;
  const translation = await fetchTranslation(verse.verse_key);
  return parseVerse(verse, translation);
}

export async function getAyahByKey(surah: number, ayah: number) {
  const verseKey = `${surah}:${ayah}`;
  const [data, translation] = await Promise.all([
    qfGet(`verses/by_key/${verseKey}`, {
      fields: "text_uthmani,chapter_id,verse_number,verse_key",
      language: "en",
    }),
    fetchTranslation(verseKey),
  ]);
  return parseVerse(data.verse, translation);
}

export async function searchAyahs(keyword: string) {
  const data = await qfSearch(keyword, 5);
  const results = data?.search?.results || [];
  return results.slice(0, 5).map((item: any) => {
    const verseKey = item.verse_key || "";
    const [surahNum, ayahNum] = verseKey.split(":").map(Number);
    const translationText =
      item.translations?.[0]?.text?.replace(/<[^>]*>/g, "") || "";

    return {
      number: item.verse_id || 0,
      text: item.text || "",
      translation: translationText,
      surah: {
        number: surahNum || 0,
        name: "",
        englishName: `Surah ${surahNum}`,
      },
      numberInSurah: ayahNum || 0,
      verseKey,
    };
  });
}

const AUDIO_CDN = "https://audio.qurancdn.com/";

export async function getAyahAudio(verseKey: string): Promise<string> {
  // Fetch audio from QF API using recitation ID 7 (Mishary Rashid Al-Afasy)
  const data = await qfGet(`verses/by_key/${verseKey}`, {
    fields: "verse_key",
    audio: "7",
  });
  const url = data.verse?.audio?.url || "";
  if (!url) return "";
  // API returns relative paths like "Alafasy/mp3/002255.mp3"
  return url.startsWith("http") ? url : `${AUDIO_CDN}${url}`;
}

export async function getSurahList() {
  const data = await qfGet("chapters", { language: "en" });
  return data.chapters || [];
}

// Dynamic mood-based search using QF Search API instead of hardcoded references
const MOOD_SEARCH_TERMS: Record<string, string> = {
  sad: "comfort sorrow ease hardship",
  anxious: "peace tranquility remembrance heart",
  grateful: "gratitude thankful blessings increase",
  hopeful: "mercy hope forgiveness despair not",
  angry: "patience forgiveness restrain anger",
  lost: "guidance light path straight",
  happy: "joy rejoice blessing glad tidings",
  lonely: "closeness near Allah with you",
};

export async function getAyahsForMood(mood: string) {
  const searchTerm = MOOD_SEARCH_TERMS[mood.toLowerCase()] || MOOD_SEARCH_TERMS["hopeful"];
  const results = await searchAyahs(searchTerm);
  return results;
}
