// Client-side QF OAuth2 PKCE utilities and token management

const QF_ACCESS_TOKEN_KEY = "qf_access_token";
const QF_REFRESH_TOKEN_KEY = "qf_refresh_token";
const QF_TOKEN_EXPIRES_KEY = "qf_token_expires_at";
const QF_CODE_VERIFIER_KEY = "qf_pkce_verifier";
const QF_OAUTH_STATE_KEY = "qf_oauth_state";

export function getQFAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const expiresAt = sessionStorage.getItem(QF_TOKEN_EXPIRES_KEY);
  if (expiresAt && Date.now() > parseInt(expiresAt)) {
    clearQFSession();
    return null;
  }
  return sessionStorage.getItem(QF_ACCESS_TOKEN_KEY);
}

export function setQFSession(accessToken: string, refreshToken: string, expiresIn: number) {
  sessionStorage.setItem(QF_ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(QF_REFRESH_TOKEN_KEY, refreshToken);
  sessionStorage.setItem(QF_TOKEN_EXPIRES_KEY, String(Date.now() + expiresIn * 1000));
}

export function clearQFSession() {
  sessionStorage.removeItem(QF_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(QF_REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(QF_TOKEN_EXPIRES_KEY);
}

export function isQFConnected(): boolean {
  return !!getQFAccessToken();
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function generateVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array.buffer);
}

async function generateChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(digest);
}

export async function initiateQFOAuth(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID;
  if (!clientId) throw new Error("NEXT_PUBLIC_QF_CLIENT_ID is not configured");

  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  const state = base64urlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer);

  sessionStorage.setItem(QF_CODE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(QF_OAUTH_STATE_KEY, state);

  const redirectUri = `${window.location.origin}/auth/qf-callback`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid offline_access bookmark reading_session",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const oauthBase = process.env.NEXT_PUBLIC_QF_OAUTH_BASE_URL ?? "https://oauth2.quran.foundation";
  window.location.href = `${oauthBase}/oauth2/auth?${params}`;
}

export function getStoredVerifier(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(QF_CODE_VERIFIER_KEY);
}

export function getStoredState(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(QF_OAUTH_STATE_KEY);
}

export function clearOAuthStorage(): void {
  sessionStorage.removeItem(QF_CODE_VERIFIER_KEY);
  sessionStorage.removeItem(QF_OAUTH_STATE_KEY);
}
