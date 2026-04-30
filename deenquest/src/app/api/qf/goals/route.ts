import { NextRequest, NextResponse } from "next/server";

const QF_API = process.env.QF_USER_API_BASE_URL ?? "https://apis.quran.foundation";

function qfHeaders(token: string, clientId: string) {
  return {
    "x-auth-token": token,
    "x-client-id": clientId,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function qfFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// GET — fetch user's reading goals
export async function GET(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  try {
    const res = await qfFetch(`${QF_API}/auth/v1/goals`, {
      headers: qfHeaders(token, clientId),
    });
    const data = await res.json().catch(() => ({ data: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

// POST — create or update a daily verses goal
export async function POST(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const target = Number(body?.dailyVerses);

  if (!Number.isInteger(target) || target < 1 || target > 604) {
    return NextResponse.json({ error: "dailyVerses must be 1–604" }, { status: 400 });
  }

  try {
    const res = await qfFetch(`${QF_API}/auth/v1/goals`, {
      method: "POST",
      headers: qfHeaders(token, clientId),
      body: JSON.stringify({ type: "verses", target, period: "day" }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "QF API timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
  }
}
