import { NextRequest, NextResponse } from "next/server";

// auth.quran.foundation is the correct base for goals and activity-days per QF OpenAPI spec
const QF_AUTH = process.env.QF_AUTH_BASE_URL ?? "https://auth.quran.foundation";
const MUSHAF_ID = 4; // UthmaniHafs

function qfHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
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

// GET — fetch today's goal plan (progress toward goal)
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") ?? "QURAN_TIME";

  try {
    const res = await qfFetch(
      `${QF_AUTH}/v1/goals/get-todays-plan?type=${type}&mushafId=${MUSHAF_ID}`,
      { headers: qfHeaders(token) }
    );
    const data = await res.json().catch(() => ({ success: false, data: { hasGoal: false } }));
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ success: false, data: { hasGoal: false } }, { status: 200 });
  }
}

// POST — create/update a goal on Quran.com
// Body: { type: "QURAN_TIME" | "QURAN_PAGES", amount: number, duration?: number }
// QURAN_TIME: amount = seconds (e.g. 600 = 10 min)
// QURAN_PAGES: amount = pages (e.g. 1)
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const type = body?.type;
  const amount = Number(body?.amount);

  const validTypes = ["QURAN_TIME", "QURAN_PAGES", "QURAN_RANGE"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "type must be QURAN_TIME, QURAN_PAGES, or QURAN_RANGE" }, { status: 400 });
  }
  if (!amount || amount < 1) {
    return NextResponse.json({ error: "amount must be >= 1" }, { status: 400 });
  }

  const payload: Record<string, unknown> = { type, amount, category: "QURAN" };
  if (body?.duration) payload.duration = Number(body.duration);

  try {
    const res = await qfFetch(`${QF_AUTH}/v1/goals?mushafId=${MUSHAF_ID}`, {
      method: "POST",
      headers: qfHeaders(token),
      body: JSON.stringify(payload),
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
