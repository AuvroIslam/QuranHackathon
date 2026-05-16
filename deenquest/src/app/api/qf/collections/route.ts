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

// POST — three actions (distinguished by body shape):
//
//   { name }
//     → create a new named collection
//
//   { collectionId, chapterNumber, verseNumber }
//     → add a verse directly into a collection (verse info sent to QF collection endpoint)
//
//   { bookmarkId, collectionId }   (legacy / fallback)
//     → add an existing bookmark by ID to a collection
export async function POST(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });

  const token = req.headers.get("x-qf-token");
  if (!token) return NextResponse.json({ error: "No QF token" }, { status: 401 });

  const body = await req.json().catch(() => null);

  // ── Create new collection ──────────────────────────────────────────────────
  if (body?.name && !body?.bookmarkId && !body?.collectionId) {
    const name = String(body.name).trim().slice(0, 64);
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    try {
      const res = await qfFetch(`${QF_API}/auth/v1/collections`, {
        method: "POST",
        headers: qfHeaders(token, clientId),
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.ok ? 200 : res.status });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json({ error: "QF API timeout" }, { status: 504 });
      }
      return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
    }
  }

  // ── Add verse directly to a collection ────────────────────────────────────
  // Preferred path — avoids relying on bookmark-creation response having an `id`.
  if (body?.collectionId && body?.chapterNumber && body?.verseNumber) {
    const collectionId = String(body.collectionId);
    const chapter = Number(body.chapterNumber);
    const verse = Number(body.verseNumber);

    if (!/^[\w-]{1,64}$/.test(collectionId)) {
      return NextResponse.json({ error: "Invalid collectionId" }, { status: 400 });
    }
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114 ||
        !Number.isInteger(verse)   || verse   < 1 || verse   > 286) {
      return NextResponse.json({ error: "Invalid chapter/verse" }, { status: 400 });
    }

    try {
      const res = await qfFetch(`${QF_API}/auth/v1/collections/${collectionId}/bookmarks`, {
        method: "POST",
        headers: qfHeaders(token, clientId),
        body: JSON.stringify({ key: chapter, verseNumber: verse, type: "ayah", mushaf: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.ok ? 200 : res.status });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json({ error: "QF API timeout" }, { status: 504 });
      }
      return NextResponse.json({ error: "QF API unreachable" }, { status: 502 });
    }
  }

  // ── Legacy: add existing bookmark by ID ───────────────────────────────────
  const bookmarkId = body?.bookmarkId;
  const rawCollectionId = body?.collectionId ?? "__default__";

  if (!bookmarkId || typeof bookmarkId !== "string" || !/^[\w-]{1,64}$/.test(bookmarkId)) {
    return NextResponse.json({ error: "Invalid bookmarkId" }, { status: 400 });
  }
  if (!/^[\w-]{1,64}$/.test(String(rawCollectionId)) && rawCollectionId !== "__default__") {
    return NextResponse.json({ error: "Invalid collectionId" }, { status: 400 });
  }

  try {
    const res = await qfFetch(`${QF_API}/auth/v1/collections/${rawCollectionId}/bookmarks`, {
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
