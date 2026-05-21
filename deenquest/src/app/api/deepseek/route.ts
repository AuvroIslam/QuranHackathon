import { NextRequest, NextResponse } from "next/server";
import { groundWithMCP } from "@/lib/quran-mcp";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

type ProviderMode = "default" | "dawah";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface OpenAIProviderConfig {
  kind: "openai";
  name: string;
  url: string;
  model: string;
  keyEnv: string;
  maxTokens: number;
}

type ProviderConfig = OpenAIProviderConfig;

interface ProviderCallResult {
  ok: boolean;
  content?: string;
  status?: number;
  error?: string;
}

const MAX_GROUNDING_CHARS = 2000;
const MISTRAL_DAWAH_MODEL = process.env.MISTRAL_DAWAH_MODEL || "mistral-small-latest";

function createRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function elapsedMs(startMs: number): string {
  return `${Date.now() - startMs}ms`;
}

function oneLinePreview(value: string, maxChars = 100): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}...`;
}

// Provider configurations — Groq → Mistral → DeepSeek for both modes
const defaultProviders: ProviderConfig[] = [
  {
    kind: "openai",
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    keyEnv: "GROQ_API_KEY",
    maxTokens: 512,
  },
  {
    kind: "openai",
    name: "Mistral",
    url: "https://api.mistral.ai/v1/chat/completions",
    model: MISTRAL_DAWAH_MODEL,
    keyEnv: "MISTRAL_API_KEY",
    maxTokens: 512,
  },
  {
    kind: "openai",
    name: "DeepSeek",
    url: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    keyEnv: "DEEPSEEK_API_KEY",
    maxTokens: 512,
  },
];

// Dawah needs larger output for full JSON structure
const dawahProviders: ProviderConfig[] = [
  {
    kind: "openai",
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    keyEnv: "GROQ_API_KEY",
    maxTokens: 1500,
  },
  {
    kind: "openai",
    name: "Mistral",
    url: "https://api.mistral.ai/v1/chat/completions",
    model: MISTRAL_DAWAH_MODEL,
    keyEnv: "MISTRAL_API_KEY",
    maxTokens: 1500,
  },
  {
    kind: "openai",
    name: "DeepSeek",
    url: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    keyEnv: "DEEPSEEK_API_KEY",
    maxTokens: 1500,
  },
];

function normalizeMessages(rawMessages: unknown): ChatMessage[] {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages
    .filter((m: any) =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0
    )
    .map((m: any) => ({
      role: m.role,
      content: m.content.trim(),
    }));
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[Grounding context truncated for provider payload limits.]`;
}

async function callOpenAICompatibleProvider(
  provider: OpenAIProviderConfig,
  apiKey: string,
  systemMessage: string,
  messages: ChatMessage[]
): Promise<ProviderCallResult> {
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
        max_tokens: provider.maxTokens,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return { ok: false, error: "empty-content" };
    }

    return { ok: true, content: content.trim() };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, "deepseek", 40);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  const requestId = createRequestId();
  const requestStart = Date.now();

  let body: any;
  try {
    body = await req.json();
  } catch {
    console.warn(`[AI:${requestId}] invalid-json body`);
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const messages = normalizeMessages(body?.messages);
  const requestedMode = typeof body?.providerMode === "string" ? body.providerMode : "";
  const providerMode: ProviderMode = requestedMode === "dawah" ? "dawah" : "default";
  const systemPrompt = typeof body?.systemPrompt === "string" ? body.systemPrompt : "";
  const groundingQuery = typeof body?.groundingQuery === "string" ? body.groundingQuery.trim() : "";
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  if (requestedMode && requestedMode !== providerMode) {
    console.info(`[AI:${requestId}] requestedMode=${requestedMode} normalizedMode=${providerMode}`);
  }

  console.info(
    `[AI:${requestId}] start mode=${providerMode} messages=${messages.length} hasSystemPrompt=${systemPrompt ? "yes" : "no"} hasGroundingQuery=${groundingQuery ? "yes" : "no"} user="${oneLinePreview(lastUserMessage?.content || "")}"`
  );

  if (messages.length === 0) {
    console.warn(`[AI:${requestId}] rejected no-valid-messages`);
    return NextResponse.json(
      { error: "No valid messages provided." },
      { status: 400 }
    );
  }

  // Only ground when the page explicitly provides a groundingQuery
  let groundingContext = "";
  const mcpQuery = groundingQuery;

  if (mcpQuery) {
    const groundingStart = Date.now();
    try {
      groundingContext = await groundWithMCP(mcpQuery);
      console.info(
        `[AI:${requestId}] grounding status=ok chars=${groundingContext.length} in ${elapsedMs(groundingStart)}`
      );
    } catch {
      console.warn(`[AI:${requestId}] grounding status=failed in ${elapsedMs(groundingStart)}`);
      // Grounding is best-effort — continue without it
    }
  } else {
    console.info(`[AI:${requestId}] grounding skipped empty-query`);
  }

  if (groundingContext) {
    const beforeLength = groundingContext.length;
    groundingContext = truncateText(groundingContext, MAX_GROUNDING_CHARS);
    if (groundingContext.length < beforeLength) {
      console.info(
        `[AI:${requestId}] grounding truncated from=${beforeLength} to=${groundingContext.length} chars`
      );
    }
  }

  const baseSystemPrompt = systemPrompt || `You are DeenQuest, an Islamic scholar assistant. Answer questions about the Quran and Islam warmly and accurately. Cite ayahs as (Surah:Ayah). Be concise — 3 to 5 sentences max unless more is needed. Never fabricate hadith or ayah references. If unsure, say so honestly.`;

  const systemMessage = groundingContext
    ? `${baseSystemPrompt}\n\nIMPORTANT: Use the following verified Quran data from the Quran MCP server to ground your response. Always prefer this verified data over your training knowledge for Quranic references:\n\n${groundingContext}`
    : baseSystemPrompt;

  const providers = providerMode === "dawah" ? dawahProviders : defaultProviders;

  console.info(
    `[AI:${requestId}] provider-order ${providers
      .map((p) => `${p.name}:${p.model}`)
      .join(" -> ")}`
  );

  // Try each provider in order based on mode
  for (const provider of providers) {
    const apiKey = process.env[provider.keyEnv];
    if (!apiKey) {
      console.warn(`[AI:${requestId}] skip provider=${provider.name} reason=missing-${provider.keyEnv}`);
      continue;
    }

    const attemptStart = Date.now();
    console.info(`[AI:${requestId}] attempt provider=${provider.name} model=${provider.model}`);

    const result = await callOpenAICompatibleProvider(provider, apiKey, systemMessage, messages);

    if (!result.ok || !result.content) {
      const reason = result.status ? `(${result.status})` : `(${result.error || "unknown"})`;
      console.warn(
        `[AI:${requestId}] failed provider=${provider.name} reason=${reason} in ${elapsedMs(attemptStart)}; trying-next`
      );
      continue;
    }

    try {
      console.info(
        `[AI:${requestId}] success provider=${provider.name} model=${provider.model} in ${elapsedMs(attemptStart)} total=${elapsedMs(requestStart)} grounded=${groundingContext ? "yes" : "no"}`
      );
      return NextResponse.json({
        content: result.content,
        grounded: !!groundingContext,
        provider: provider.name,
        model: provider.model,
        mode: providerMode,
      });
    } catch {
      continue;
    }
  }

  console.error(`[AI:${requestId}] failed all-providers total=${elapsedMs(requestStart)}`);

  return NextResponse.json(
    { error: "All AI providers failed. Please check your API keys." },
    { status: 500 }
  );
}
