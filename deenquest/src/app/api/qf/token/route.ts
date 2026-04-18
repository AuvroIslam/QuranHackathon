import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.code || !body?.codeVerifier || !body?.redirectUri) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const clientId = process.env.QF_CLIENT_ID;
  const clientSecret = process.env.QF_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "QF credentials not configured — add QF_CLIENT_ID and QF_CLIENT_SECRET to .env.local" },
      { status: 503 }
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: String(body.code),
    redirect_uri: String(body.redirectUri),
    code_verifier: String(body.codeVerifier),
  });

  try {
    const oauthBase = process.env.QF_OAUTH_BASE_URL ?? "https://oauth2.quran.foundation";
    const res = await fetch(`${oauthBase}/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[QF] token exchange failed ${res.status}:`, errText);
      return NextResponse.json({ error: "Token exchange failed" }, { status: res.status });
    }

    const data = await res.json();
    const accessToken = typeof data.access_token === "string" ? data.access_token : null;
    if (!accessToken) {
      return NextResponse.json({ error: "No access token returned" }, { status: 502 });
    }

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: typeof data.refresh_token === "string" ? data.refresh_token : "",
      expires_in: typeof data.expires_in === "number" ? data.expires_in : 3600,
    });
  } catch (err) {
    console.error("[QF] token exchange error:", err);
    return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
  }
}
