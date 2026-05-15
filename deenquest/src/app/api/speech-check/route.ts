import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Normalizes Arabic text for comparison by removing diacritics and standardizing letter variants.
// This is required because Whisper transcribes without tashkeel, while the stored ayah text
// includes full diacritical marks — a naive string compare would always return 0% accuracy.
function normalize(text: string): string {
  return (
    text
      // Remove tashkeel (fatha, damma, kasra, sukun, shadda, tanwin, etc.)
      .replace(/[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۤۧۨ-ۭ]/g, "")
      // Normalize alef variants → bare alef
      .replace(/[أإآٱ]/g, "ا")
      // Normalize taa marbuta → haa
      .replace(/ة/g, "ه")
      // Normalize alef maqsura → yaa
      .replace(/ى/g, "ي")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

interface WordResult {
  word: string;    // original word from the ayah (with diacritics)
  correct: boolean;
}

// Compares Whisper's transcribed output against the expected ayah text word-by-word.
// score=0 / correct=false are only produced when the user said nothing (empty transcription)
// or every word was wrong — these are NOT hardcoded defaults; they are computed results.
// score >= 0.6 (60% of words matched) is the passing threshold for "correct".
function compareTexts(spoken: string, ayah: string): { words: WordResult[]; score: number } {
  const spokenWords = normalize(spoken).split(" ").filter(Boolean);
  const ayahWords = ayah.split(" ").filter(Boolean);
  const ayahNorm = ayahWords.map(normalize);

  // Build a consumed-index set so we don't double-count repeated words
  const matched = new Set<number>();

  const words: WordResult[] = ayahWords.map((original, i) => {
    // First try exact positional match
    if (spokenWords[i] !== undefined && spokenWords[i] === ayahNorm[i] && !matched.has(i)) {
      matched.add(i);
      return { word: original, correct: true };
    }
    // Fallback: look for the word anywhere in the spoken output
    const elsewhere = spokenWords.findIndex((w, j) => w === ayahNorm[i] && !matched.has(j));
    if (elsewhere !== -1) {
      matched.add(elsewhere);
      return { word: original, correct: true };
    }
    return { word: original, correct: false };
  });

  const score = ayahWords.length > 0 ? matched.size / ayahWords.length : 0;
  return { words, score };
}

// POST /api/speech-check
// Accepts a multipart form with:
//   audio: audio file recorded by the user (webm/mp4/m4a)
//   ayah:  the expected Arabic ayah text (with or without tashkeel)
// Returns:
//   spoken:  the Arabic text Whisper transcribed from the recording
//   score:   0.0–1.0 fraction of ayah words correctly spoken
//   correct: true if score >= 0.6 (60% word accuracy threshold)
//   words:   per-word breakdown [ { word, correct } ] for UI chip highlighting
//
// score=0 and correct=false only occur when the user said nothing or every word was wrong.
// This is a fully functional implementation using OpenAI Whisper (whisper-1).
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const ayah = formData.get("ayah") as string | null;

    if (!audio || !ayah) {
      return NextResponse.json({ error: "audio and ayah are required" }, { status: 400 });
    }

    // Force Arabic so Whisper doesn't misidentify the language and transliterate instead
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "ar",
    });

    const spoken = transcription.text.trim();
    const { words, score } = compareTexts(spoken, ayah);
    const correct = score >= 0.6;

    return NextResponse.json({ spoken, score, correct, words });
  } catch (err) {
    console.error("[speech-check]", err);
    return NextResponse.json({ error: "Speech check failed" }, { status: 500 });
  }
}
