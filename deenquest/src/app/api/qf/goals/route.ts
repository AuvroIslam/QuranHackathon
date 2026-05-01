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

async function qfFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// Try a request against two base URLs, return first success
async function tryBoth(
  path: string,
  options: RequestInit
): Promise<{ res: Response; data: unknown } | null> {
  for (const base of [QF_AUTH, QF_API + "/auth"]) {
    try {
      const res = await qfFetch(`${base}${path}`, options);
      const data = await res.json().catch(() => ({}));
      if (res.ok) return { res, data };
      // Log which URL failed for debugging
      console.warn(`[QF goals] ${base}${path} → ${res.status}`, data);
    } catch {
      console.warn(`[QF goals] ${base}${path} → network error`);
    }
  }
  return null;
}

// GET — today's goal progress
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-qf-token");
  const clientId = process.env.QF_CLIENT_ID ?? "";
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") ?? "QURAN_TIME";
  const headers = qfHeaders(token, clientId);

  const result = await tryBoth(
    `/v1/goals/get-todays-plan?type=${type}&mushafId=${MUSHAF_ID}`,
    { headers }
  );

  if (result) return NextResponse.json(result.data, { status: 200 });
  return NextResponse.json({ success: false, data: { hasGoal: false } }, { status: 200 });
}

// POST — create/update goal
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-qf-token");
  const clientId = process.env.QF_CLIENT_ID ?? "";
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

  const headers = qfHeaders(token, clientId);
  const result = await tryBoth(`/v1/goals?mushafId=${MUSHAF_ID}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (result) return NextResponse.json(result.data, { status: 200 });
  return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
}

// DELETE — remove goal by id
export async function DELETE(req: NextRequest) {
  const token = req.headers.get("x-qf-token");
  const clientId = process.env.QF_CLIENT_ID ?? "";
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const goalId = searchParams.get("goalId");
  if (!goalId) return NextResponse.json({ error: "goalId is required" }, { status: 400 });

  const headers = qfHeaders(token, clientId);

  // Try path variants — QF may or may not require mushafId on DELETE
  const paths = [
    `/v1/goals/${goalId}`,
    `/v1/goals/${goalId}?mushafId=${MUSHAF_ID}`,
  ];

  for (const path of paths) {
    for (const base of [QF_AUTH, QF_API + "/auth"]) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let res: Response;
        try {
          res = await fetch(`${base}${path}`, { method: "DELETE", headers, signal: controller.signal });
        } finally {
          clearTimeout(timeout);
        }
        // Some DELETE endpoints return 204 No Content (no body)
        const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
        console.log(`[QF goals DELETE] ${base}${path} → ${res.status}`, data);
        if (res.ok) return NextResponse.json(data, { status: 200 });
      } catch (e) {
        console.warn(`[QF goals DELETE] ${base}${path} → network error`, e);
      }
    }
  }

  return NextResponse.json({ error: "QF API unreachable — check Vercel logs for QF status" }, { status: 502 });
}
