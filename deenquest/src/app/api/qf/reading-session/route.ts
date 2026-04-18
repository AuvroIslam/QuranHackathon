import { NextRequest, NextResponse } from "next/server";

const QF_API = "https://apis.quran.foundation";
const MAX_CHAPTER = 114;
const MAX_VERSE = 286; // longest surah (Al-Baqarah)

export async function POST(req: NextRequest) {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "QF_CLIENT_ID not configured" }, { status: 503 });
  }

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${QF_API}/auth/v1/reading-sessions`, {
      method: "POST",
      headers: {
        "x-auth-token": token,
        "x-client-id": clientId,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ chapterNumber: chapter, verseNumber: verse }),
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
