// SERVER-ONLY. LLM helper for short, single-turn generations.
// Reads API keys from process.env — must never be imported from client code.
// The /api/deepseek route uses its own more elaborate logic (modes, MCP grounding,
// detailed logging). This helper is for routes that just need a quick text reply
// from the same Groq → Mistral → DeepSeek fallback chain.

interface Provider {
  name: string;
  url: string;
  model: string;
  keyEnv: string;
}

const PROVIDERS: Provider[] = [
  { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", keyEnv: "GROQ_API_KEY" },
  { name: "Mistral", url: "https://api.mistral.ai/v1/chat/completions", model: process.env.MISTRAL_DAWAH_MODEL || "mistral-small-latest", keyEnv: "MISTRAL_API_KEY" },
  { name: "DeepSeek", url: "https://api.deepseek.com/chat/completions", model: "deepseek-chat", keyEnv: "DEEPSEEK_API_KEY" },
];

export interface CallLLMOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface LLMResult {
  content: string;
  provider: string;
}

export async function callLLM(opts: CallLLMOptions): Promise<LLMResult | null> {
  const { systemPrompt, userMessage, maxTokens = 256, temperature = 0.7, timeoutMs = 8000 } = opts;

  for (const provider of PROVIDERS) {
    const apiKey = process.env[provider.keyEnv];
    if (!apiKey) continue;

    try {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) {
        return { content: content.trim(), provider: provider.name };
      }
    } catch {
      // try next provider
    }
  }

  return null;
}
