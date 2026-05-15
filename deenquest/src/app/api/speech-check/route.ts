import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { compareTexts } from "@/lib/arabic-utils";

// OPENAI_API_KEY is configured in Vercel environment variables (Production + Preview).
// Do not assume it is missing because it is absent from .env.local — it is intentionally server-only.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/speech-check
// Accepts a multipart form with:
//   audio: audio file recorded by the user (webm/mp4/m4a)
//   ayah:  the expected Arabic ayah text (with or without tashkeel)
// Returns:
//   spoken:  the Arabic text Whisper transcribed from the recording
//   score:   0.0–1.0 fraction of ayah words correctly spoken
//   correct: true if score >= 0.6 (60% word accuracy threshold)
//   words:   per-word breakdown [ { word, correct } ] for UI chip highlighting
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
