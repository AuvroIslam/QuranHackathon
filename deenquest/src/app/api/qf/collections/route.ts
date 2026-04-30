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

// GET — list user's collections
export async function GET(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  try {
    const res = await qfFetch(`${QF_API}/auth/v1/collections`, {
      headers: qfHeaders(token, clientId),
    });
    const data = await res.json().catch(() => ({ data: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

// POST — add a bookmark to the default collection
export async function POST(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const bookmarkId = body?.bookmarkId;
  const rawCollectionId = body?.collectionId ?? "__default__";

  if (!bookmarkId || typeof bookmarkId !== "string" || !/^[\w-]{1,64}$/.test(bookmarkId)) {
    return NextResponse.json({ error: "Invalid bookmarkId" }, { status: 400 });
  }
  if (!/^[\w-]{1,64}$/.test(String(rawCollectionId)) && rawCollectionId !== "__default__") {
    return NextResponse.json({ error: "Invalid collectionId" }, { status: 400 });
  }
  const collectionId = rawCollectionId as string;

  try {
    const res = await qfFetch(`${QF_API}/auth/v1/collections/${collectionId}/bookmarks`, {
      method: "POST",
      headers: qfHeaders(token, clientId),
      body: JSON.stringify({ bookmarkId }),
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
