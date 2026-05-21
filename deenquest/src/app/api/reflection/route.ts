import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { fetchTafsirMCP } from "@/lib/quran-mcp";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

interface Body {
  verseKey?: string;
  arabic?: string;
  translation?: string;
  mood?: string;
  customText?: string;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, "reflection", 15);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

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
    ? `The reader is going through this specific situation: "${customText}". The reflection MUST speak directly to this — reference what they shared, not just the verse in isolation.`
    : mood
      ? `The reader is feeling: ${mood}. Connect the verse to what someone feeling ${mood} is actually experiencing inside.`
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
    "Write a warm, personal reflection on this ayah for this specific reader. 4-5 sentences. Start by acknowledging what they are going through (use their own words if they shared a situation), then show how this verse speaks directly to that — what Allah is saying to them right now through it, and what they can hold onto. No greetings, no preamble, no markdown — just the reflection.",
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt =
    "You are a gentle Quran reflection guide. Speak warmly in second person. Reflect on the ayah's meaning and apply it to the reader, staying faithful to any verified tafsir provided. Never invent hadith. Never fabricate ayah references. Never add Arabic. Output plain text only.";

  const result = await callLLM({
    systemPrompt,
    userMessage,
    maxTokens: 420,
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
