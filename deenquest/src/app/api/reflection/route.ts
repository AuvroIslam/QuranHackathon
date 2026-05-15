import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { fetchTafsirMCP } from "@/lib/quran-mcp";

interface Body {
  verseKey?: string;
  arabic?: string;
  translation?: string;
  mood?: string;
  customText?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const verseKey = (body.verseKey ?? "").trim();
  const translation = (body.translation ?? "").trim();
  const mood = (body.mood ?? "").trim();
  const customText = (body.customText ?? "").trim().slice(0, 200);

  if (!translation) {
    return NextResponse.json({ error: "translation is required" }, { status: 400 });
  }

  const moodContext = customText
    ? `The reader described how they feel as: "${customText}".`
    : mood
      ? `The reader is feeling: ${mood}.`
      : "";

  // Ground the reflection in VERIFIED tafsir from the Quran MCP server so the
  // model reflects on authentic scholarship, not its own training memory.
  // Best-effort: if MCP is unavailable we fall back to an ungrounded
  // reflection (unchanged prior behaviour).
  let tafsirContext = "";
  if (verseKey) {
    try {
      const tafsir = (await fetchTafsirMCP(verseKey)).trim();
      if (tafsir) {
        tafsirContext =
          `[VERIFIED TAFSIR from the Quran MCP server — base your reflection ONLY on this, do not add outside claims]\n${tafsir.slice(0, 1800)}`;
      }
    } catch {
      // MCP unreachable — proceed ungrounded.
    }
  }

  const userMessage = [
    `Ayah ${verseKey}: "${translation}"`,
    moodContext,
    tafsirContext,
    "Write a short, warm reflection on this ayah that speaks directly to the reader. 2-3 sentences, under 280 characters. No greetings, no preamble, no markdown — just the reflection.",
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt =
    "You are a gentle Quran reflection guide. Speak warmly in second person. Reflect on the ayah's meaning and apply it to the reader, staying faithful to any verified tafsir provided. Never invent hadith. Never fabricate ayah references. Never add Arabic. Output plain text only.";

  const result = await callLLM({
    systemPrompt,
    userMessage,
    maxTokens: 220,
    temperature: 0.75,
  });

  if (!result) {
    return NextResponse.json({ error: "All AI providers failed" }, { status: 502 });
  }

  return NextResponse.json({
    reflection: result.content,
    provider: result.provider,
    grounded: Boolean(tafsirContext),
  });
}
