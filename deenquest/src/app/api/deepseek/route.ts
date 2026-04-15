import { NextRequest, NextResponse } from "next/server";
import { groundWithMCP } from "@/lib/quran-mcp";

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DeepSeek API key not configured" }, { status: 500 });
  }

  // Extract the latest user message for MCP grounding
  const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
  let groundingContext = "";

  if (lastUserMessage) {
    try {
      groundingContext = await groundWithMCP(lastUserMessage.content);
    } catch {
      // Grounding is best-effort — continue without it
    }
  }

  const baseSystemPrompt = systemPrompt || `You are DeenQuest AI, a knowledgeable and respectful Islamic scholar assistant. 
You help users understand the Quran, its teachings, and how to apply them in daily life.
Always provide references to specific Quran ayahs (verses) when possible in the format (Surah:Ayah).
Be warm, encouraging, and scholarly. Keep responses concise but meaningful.
Never make up hadith or ayah references - only cite what you know to be accurate.
If unsure, say so honestly.`;

  const systemMessage = groundingContext
    ? `${baseSystemPrompt}\n\nIMPORTANT: Use the following verified Quran data from the Quran MCP server to ground your response. Always prefer this verified data over your training knowledge for Quranic references:\n\n${groundingContext}`
    : baseSystemPrompt;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: systemMessage }, ...messages],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "DeepSeek API error", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      content: data.choices[0].message.content,
      grounded: !!groundingContext,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reach DeepSeek API" }, { status: 500 });
  }
}
