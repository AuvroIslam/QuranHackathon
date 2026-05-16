import { Ayah, MCQData, Mood, SpeechResult } from '../types';

// Point to your deployed Next.js app. Change for local dev:
// export const API_BASE = 'http://192.168.x.x:3000'; // your local IP for device testing
export const API_BASE = 'https://quran-hackathon-omega.vercel.app';

// ── REMOVED: hardcoded AYAH_BANK (violated hackathon rules).
// Quran text is now fetched from the QF API via the /api/mood-ayah backend endpoint.

// ── Public API ────────────────────────────────────────────────────────────────

// No hardcoded Quran fallback: the verse text is fetched live from the Quran
// Foundation API server-side. On failure we return null and the UI shows a
// retry — we never display a bundled copy of the Quran.
export async function getAyahByMood(
  mood: Mood
): Promise<{ ayah: Ayah; question: MCQData } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(`${API_BASE}/api/mood-ayah?mood=${encodeURIComponent(mood)}`, {
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.ayah?.arabic) return null;
      return { ayah: data.ayah, question: data.question };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

export async function fetchLessonReflection(opts: {
  verseKey?: string;
  arabic?: string;
  translation: string;
  mood?: string;
  customText?: string;
}): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/reflection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.reflection === 'string' ? data.reflection : null;
  } catch {
    return null;
  }
}

export interface HadithEntry {
  english: string;
  narrator?: string;
  collection: string;
  hadithNumber: string;
  reference?: string;
}

export async function fetchHadithForMood(mood: string, situation?: string): Promise<HadithEntry | null> {
  try {
    const qs = new URLSearchParams({ mood });
    if (situation && situation.trim()) qs.set('situation', situation.trim());
    const res = await fetch(`${API_BASE}/api/hadith?${qs.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.hadith ?? null;
  } catch {
    return null;
  }
}

export interface ApiLesson {
  day: number;
  title: string;
  subtitle: string;
  focus: string;
  actionText: string;
  learnContent: Ayah;
  mcq: MCQData;
  source?: string;
}

/**
 * Fetches a lesson from the backend. The Quran text (arabic / transliteration
 * / translation) is fetched LIVE from the Quran Foundation API server-side —
 * never hardcoded in the app. mcq.correctIndex is intentionally -1 so the
 * answer is validated server-side via checkLessonAnswer().
 */
export async function fetchLesson(level: string, day: number): Promise<ApiLesson | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(
        `${API_BASE}/api/lessons?level=${encodeURIComponent(level)}&day=${day}`,
        { signal: controller.signal }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const l = data?.lesson;
      if (!l?.learnContent?.arabic) return null;
      return {
        day: l.day,
        title: l.title,
        subtitle: l.subtitle,
        focus: l.focus,
        actionText: l.actionText,
        learnContent: {
          reference: l.learnContent.reference,
          arabic: l.learnContent.arabic,
          transliteration: l.learnContent.transliteration,
          translation: l.learnContent.translation,
          explanation: l.learnContent.explanation,
          audioUrl: l.learnContent.audioUrl,
        },
        mcq: {
          question: l.mcq.question,
          options: l.mcq.options,
          correctIndex: -1, // server-validated; never trust a client answer key
        },
        source: data?.source,
      };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

export async function checkLessonAnswer(level: string, day: number, selectedIndex: number): Promise<{
  correct: boolean;
  correctIndex: number;
  correctOption?: string;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/api/lessons/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, day, selectedIndex }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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

/** Fire-and-forget: sync the user's daily time goal to Quran.com */
export async function syncGoalToQF(accessToken: string, timePerDay: 3 | 5 | 10): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/qf/goal`, {
      method: 'POST',
      headers: { 'x-qf-token': accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ timePerDay }),
    });
  } catch {
    // Best-effort only
  }
}

/** Fire-and-forget: add a verse to a QF collection (or the default bookmark list) */
export async function addToQFCollection(
  accessToken: string,
  chapterNumber: number,
  verseNumber: number,
  collectionId?: string,
): Promise<void> {
  try {
    if (collectionId) {
      // Add verse directly into the named collection
      await fetch(`${API_BASE}/api/qf/collections`, {
        method: 'POST',
        headers: { 'x-qf-token': accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId, chapterNumber, verseNumber }),
      });
    } else {
      // Default — just create the QF bookmark
      await fetch(`${API_BASE}/api/qf/bookmark`, {
        method: 'POST',
        headers: { 'x-qf-token': accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, verseNumber }),
      });
    }
  } catch {
    // Best-effort only
  }
}
