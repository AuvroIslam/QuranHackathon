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

// GET — fetch current streak
export async function GET(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${QF_API}/auth/v1/streaks`, {
      headers: qfHeaders(token, clientId),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "QF API timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

// POST — record activity day (updates streak)
export async function POST(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${QF_API}/auth/v1/activity-days`, {
      method: "POST",
      headers: qfHeaders(token, clientId),
      body: JSON.stringify({ date: new Date().toISOString().split("T")[0] }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "QF API timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
