import { NextRequest, NextResponse } from "next/server";

const QF_AUTH = process.env.QF_AUTH_BASE_URL ?? "https://auth.quran.foundation";
const QF_API = process.env.QF_USER_API_BASE_URL ?? "https://apis.quran.foundation";
const MUSHAF_ID = 4;

function qfHeaders(token: string, clientId: string) {
  return {
    Authorization: `Bearer ${token}`,
    "x-auth-token": token,
    "x-client-id": clientId,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function tryBoth(path: string, options: RequestInit): Promise<{ res: Response; data: unknown } | null> {
  for (const base of [QF_AUTH, QF_API + "/auth"]) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      let res: Response;
      try {
        res = await fetch(`${base}${path}`, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok) return { res, data };
      console.warn(`[QF streak] ${base}${path} → ${res.status}`);
    } catch {
      console.warn(`[QF streak] ${base}${path} → network error`);
    }
  }
  return null;
}

// GET — fetch current streak
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-qf-token");
  const clientId = process.env.QF_CLIENT_ID ?? "";
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const result = await tryBoth("/v1/streaks", { headers: qfHeaders(token, clientId) });
  if (result) return NextResponse.json(result.data, { status: 200 });
  return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
}

// POST — report activity (ranges + seconds) → updates streak + goal progress
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-qf-token");
  const clientId = process.env.QF_CLIENT_ID ?? "";
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ranges: string[] = Array.isArray(body?.ranges) ? body.ranges : [];
  const seconds = Math.max(1, Math.round(Number(body?.seconds) || 1));
  const date = body?.date ?? new Date().toISOString().split("T")[0];
  const timezone = typeof body?.timezone === "string" ? body.timezone : "UTC";

  if (ranges.length === 0) {
    return NextResponse.json({ error: "ranges array is required" }, { status: 400 });
  }

  const payload = { type: "QURAN", seconds, ranges, mushafId: MUSHAF_ID, date };
  const headers = { ...qfHeaders(token, clientId), "x-timezone": timezone };

  const result = await tryBoth("/v1/activity-days", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (result) return NextResponse.json(result.data, { status: 200 });
  return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
}
