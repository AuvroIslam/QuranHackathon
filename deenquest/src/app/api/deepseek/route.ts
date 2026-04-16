import { NextRequest, NextResponse } from "next/server";
import { groundWithMCP } from "@/lib/quran-mcp";

// Provider configurations (Groq primary, DeepSeek fallback)
const providers = [
  {
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    keyEnv: "GROQ_API_KEY",
  },
  {
    name: "DeepSeek",
    url: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    keyEnv: "DEEPSEEK_API_KEY",
  },
];

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();

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

  // Try each provider in order (Groq first, DeepSeek fallback)
  for (const provider of providers) {
    const apiKey = process.env[provider.keyEnv];
    if (!apiKey) continue;

    try {
      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: "system", content: systemMessage }, ...messages],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.warn(`${provider.name} API failed (${response.status}), trying next provider...`);
        continue;
      }

      const data = await response.json();
      return NextResponse.json({
        content: data.choices[0].message.content,
        grounded: !!groundingContext,
        provider: provider.name,
      });
    } catch (error) {
      console.warn(`${provider.name} API unreachable, trying next provider...`);
      continue;
    }
  }

  return NextResponse.json(
    { error: "All AI providers failed. Please check your API keys." },
    { status: 500 }
  );
}
