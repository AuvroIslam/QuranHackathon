// Server-side only — QF OAuth2 client credentials for Content API
// Never expose QF_CLIENT_SECRET to the browser

// Content API always uses production OAuth, separate from user PKCE credentials
const QF_CONTENT_OAUTH_URL = "https://oauth2.quran.foundation/oauth2/token";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getQFContentToken(): Promise<string | null> {
  const clientId = process.env.QF_CONTENT_CLIENT_ID ?? process.env.QF_CLIENT_ID;
  const clientSecret = process.env.QF_CONTENT_CLIENT_SECRET ?? process.env.QF_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60_000) return cachedToken;

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(QF_CONTENT_OAUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=content",
    });

    if (!res.ok) {
      console.error(`[QF] content token failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (typeof data.access_token !== "string" || !data.access_token) return null;

    cachedToken = data.access_token;
    tokenExpiry = now + (typeof data.expires_in === "number" ? data.expires_in : 3600) * 1000;
    return cachedToken;
  } catch (err) {
    console.error("[QF] content token error:", err);
    return null;
  }
}

export function getQFHeaders(token: string): Record<string, string> {
  return {
    "x-auth-token": token,
    "x-client-id": process.env.QF_CONTENT_CLIENT_ID ?? process.env.QF_CLIENT_ID ?? "",
    Accept: "application/json",
  };
}
