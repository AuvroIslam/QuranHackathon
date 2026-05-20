// Quran MCP Client — Server-side only
// Calls Quran MCP tools via JSON-RPC over Streamable HTTP
// Used to ground AI responses in verified canonical Quran data

const MCP_URL = process.env.QURAN_MCP_URL || "https://mcp.quran.ai";

async function initSession(): Promise<string | null> {
  try {
    const res = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "deenquest", version: "1.0.0" },
        },
      }),
    });
    return res.headers.get("mcp-session-id");
  } catch {
    return null;
  }
}

async function callMCPTool(
  toolName: string,
  args: Record<string, unknown>,
  sessionId: string | null
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  if (sessionId) {
    headers["mcp-session-id"] = sessionId;
  }

  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
    },
  });

  try {
    const res = await fetch(MCP_URL, {
      method: "POST",
      headers,
      body,
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream")) {
      const text = await res.text();
      const lines = text.split("\n");
      let resultData = "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.result?.content) {
              resultData = parsed.result.content
                .filter((c: any) => c.type === "text")
                .map((c: any) => c.text)
                .join("\n");
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
      return resultData;
    }

    const data = await res.json();
    if (data.result?.content) {
      return data.result.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n");
    }
    if (data.error) {
      console.error("MCP tool error:", data.error);
      return "";
    }
    return JSON.stringify(data.result || data);
  } catch (error) {
    console.error(`MCP tool ${toolName} failed:`, error);
    return "";
  }
}

export async function searchQuranMCP(query: string): Promise<string> {
  const sid = await initSession();
  return callMCPTool("search_quran", { query, translations: "en-abdel-haleem" }, sid);
}

export async function fetchQuranMCP(ayahs: string): Promise<string> {
  const sid = await initSession();
  return callMCPTool("fetch_quran", { ayahs, editions: "ar-simple-clean" }, sid);
}

export async function fetchTranslationMCP(ayahs: string): Promise<string> {
  const sid = await initSession();
  return callMCPTool("fetch_translation", { ayahs, editions: "en-abdel-haleem" }, sid);
}

export async function fetchTafsirMCP(
  ayahs: string,
  edition = "en-ibn-kathir"
): Promise<string> {
  const sid = await initSession();
  return callMCPTool("fetch_tafsir", { ayahs, editions: edition }, sid);
}

export async function groundWithMCP(userQuery: string): Promise<string> {
  try {
    const searchResult = await searchQuranMCP(userQuery);
    if (!searchResult) return "";
    return `[VERIFIED QURAN DATA from Quran MCP Server (mcp.quran.ai)]\n${searchResult}`;
  } catch (error) {
    console.error("MCP grounding failed:", error);
    return "";
  }
}
