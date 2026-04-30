const BASE = "https://quran-hackathon-omega.vercel.app";

export async function fetchAI(messages: { role: string; content: string }[], groundingQuery = "") {
  const res = await fetch(`${BASE}/api/deepseek`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, groundingQuery }),
  });
  return res.json();
}

export async function fetchSurahList() {
  const res = await fetch(`${BASE}/api/quran?path=chapters&language=en`);
  return res.json();
}

export async function fetchVerses(chapterId: number) {
  const res = await fetch(
    `${BASE}/api/quran?path=verses/by_chapter/${chapterId}&words=true&translations=131&per_page=50&page=1`
  );
  return res.json();
}

export async function fetchAudioUrl(verseKey: string) {
  const res = await fetch(
    `${BASE}/api/quran?path=recitations/7/by_ayah/${verseKey}`
  );
  return res.json();
}

export async function fetchTafsir(verseKey: string) {
  const res = await fetch(
    `${BASE}/api/quran?path=tafsirs/169/by_ayah/${verseKey}`
  );
  return res.json();
}

export async function searchQuran(q: string) {
  const res = await fetch(`${BASE}/api/quran/search?q=${encodeURIComponent(q)}&size=5&language=en`);
  return res.json();
}
