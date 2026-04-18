import { NextRequest, NextResponse } from "next/server";

const QF_API = process.env.QF_USER_API_BASE_URL ?? "https://apis.quran.foundation";
const MAX_CHAPTER = 114;
const MAX_VERSE = 286;

function qfHeaders(token: string, clientId: string): Record<string, string> {
  return {
    "Authorization": `Bearer ${token}`,
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

// GET — fetch user's ayah bookmarks
export async function GET(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  try {
    const res = await qfFetch(
      `${QF_API}/auth/v1/bookmarks?mushafId=1&type=ayah&first=20`,
      { headers: qfHeaders(token, clientId) }
    );
    const data = await res.json().catch(() => ({ data: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

// POST — add an ayah bookmark
export async function POST(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const chapter = Number(body?.chapterNumber);
  const verse = Number(body?.verseNumber);

  if (
    !Number.isInteger(chapter) || chapter < 1 || chapter > MAX_CHAPTER ||
    !Number.isInteger(verse) || verse < 1 || verse > MAX_VERSE
  ) {
    return NextResponse.json(
      { error: "chapterNumber must be 1–114, verseNumber must be 1–286" },
      { status: 400 }
    );
  }

  try {
    const res = await qfFetch(`${QF_API}/auth/v1/bookmarks`, {
      method: "POST",
      headers: qfHeaders(token, clientId),
      body: JSON.stringify({ key: chapter, verseNumber: verse, type: "ayah", mushaf: 1 }),
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

// DELETE — remove a bookmark by chapter/verse
export async function DELETE(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const chapter = Number(body?.chapterNumber);
  const verse = Number(body?.verseNumber);

  if (
    !Number.isInteger(chapter) || chapter < 1 || chapter > MAX_CHAPTER ||
    !Number.isInteger(verse) || verse < 1 || verse > MAX_VERSE
  ) {
    return NextResponse.json({ error: "Invalid chapter/verse" }, { status: 400 });
  }

  try {
    const res = await qfFetch(`${QF_API}/auth/v1/bookmarks`, {
      method: "DELETE",
      headers: qfHeaders(token, clientId),
      body: JSON.stringify({ key: chapter, verseNumber: verse, type: "ayah", mushaf: 1 }),
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
