import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Strip Arabic diacritics (tashkeel) so comparison isn't thrown off by missing marks
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const ayah = formData.get("ayah") as string | null;

    if (!audio || !ayah) {
      return NextResponse.json({ error: "audio and ayah are required" }, { status: 400 });
    }

    // Whisper transcription — specify Arabic so it doesn't guess the language
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
