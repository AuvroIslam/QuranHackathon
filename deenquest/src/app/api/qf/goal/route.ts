import { NextRequest, NextResponse } from "next/server";

const QF_AUTH = process.env.QF_AUTH_BASE_URL ?? "https://auth.quran.foundation";
const MUSHAF_ID = 4;

// Maps user time preference to daily pages target
const PAGES: Record<number, number> = { 3: 1, 5: 2, 10: 4 };

export async function POST(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID ?? "";
  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const timePerDay = Number(body?.timePerDay);
  if (![3, 5, 10].includes(timePerDay)) {
    return NextResponse.json({ error: "timePerDay must be 3, 5, or 10" }, { status: 400 });
  }

  const pages = PAGES[timePerDay];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${QF_AUTH}/v1/goals?mushafId=${MUSHAF_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-auth-token": token,
        "x-client-id": clientId,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ type: "PAGES", pages }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "QF API timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
