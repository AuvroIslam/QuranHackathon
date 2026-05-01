import { NextRequest, NextResponse } from "next/server";

const QF_AUTH = process.env.QF_AUTH_BASE_URL ?? "https://auth.quran.foundation";
const MUSHAF_ID = 4;

function qfHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// GET — fetch current streak
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${QF_AUTH}/v1/streaks`, {
      headers: qfHeaders(token),
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

// POST — record activity day with ranges + seconds (updates streak + goal progress)
// Body: { ranges: string[], seconds: number, date?: string }
// ranges format: ["2:1-2:5"] — surah:verse-surah:verse
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ranges: string[] = Array.isArray(body?.ranges) ? body.ranges : [];
  const seconds = Math.max(1, Math.round(Number(body?.seconds) || 1));
  const date = body?.date ?? new Date().toISOString().split("T")[0];
  const timezone = body?.timezone ?? "UTC";

  if (ranges.length === 0) {
    return NextResponse.json({ error: "ranges array is required" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${QF_AUTH}/v1/activity-days`, {
      method: "POST",
      headers: { ...qfHeaders(token), "x-timezone": timezone },
      body: JSON.stringify({ type: "QURAN", seconds, ranges, mushafId: MUSHAF_ID, date }),
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
