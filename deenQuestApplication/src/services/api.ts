import { Ayah, MCQData, Mood, SpeechResult } from '../types';

// Point to your deployed Next.js app. Change for local dev:
// export const API_BASE = 'http://192.168.x.x:3000'; // your local IP for device testing
export const API_BASE = 'https://quran-hackathon-omega.vercel.app';

// ── REMOVED: hardcoded AYAH_BANK (violated hackathon rules).
// Quran text is now fetched from the QF API via the /api/mood-ayah backend endpoint.

// ── Public API ────────────────────────────────────────────────────────────────

const OFFLINE_FALLBACK: { ayah: Ayah; question: MCQData } = {
  ayah: {
    reference: '94:5',
    arabic: '',
    transliteration: '',
    translation: 'Unable to load verse. Please check your internet connection.',
    explanation: 'Allah promises that every difficulty carries relief within it.',
    audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/094005.mp3',
  },
  question: {
    question: 'What does this ayah promise about hardship?',
    options: ['It will last forever', 'Ease comes with it', 'Patience removes it'],
    correctIndex: 1,
  },
};

export async function getAyahByMood(mood: Mood): Promise<{ ayah: Ayah; question: MCQData }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(`${API_BASE}/api/mood-ayah?mood=${encodeURIComponent(mood)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return OFFLINE_FALLBACK;
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
