// Quran Foundation OAuth2 Client Credentials Token Management
// Server-side only — never expose client_secret to the browser

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getQFToken(): Promise<string> {
  const now = Date.now();
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && now < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.QF_CLIENT_ID;
  const clientSecret = process.env.QF_CLIENT_SECRET;
  const authUrl = process.env.QF_AUTH_URL;

  if (!clientId || !clientSecret || !authUrl) {
    throw new Error("QF OAuth2 credentials not configured");
  }

  const res = await fetch(`${authUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "content",
    }).toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`QF OAuth2 token error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600) * 1000;
  return cachedToken!;
}

export function getQFHeaders(token: string): Record<string, string> {
  return {
    "x-auth-token": token,
    "x-client-id": process.env.QF_CLIENT_ID || "",
    Accept: "application/json",
  };
}
