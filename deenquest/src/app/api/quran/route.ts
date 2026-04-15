import { NextRequest, NextResponse } from "next/server";

// Proxy GET requests to Quran Foundation Content API v4
// Usage: /api/quran?path=verses/random&fields=text_uthmani&translations=131
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 });
  }

  const apiUrl = process.env.QF_API_URL || "https://api.quran.com/api/v4";

  const downstreamParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== "path") {
      downstreamParams.set(key, value);
    }
  });

  const qfUrl = `${apiUrl}/${path}${downstreamParams.toString() ? "?" + downstreamParams.toString() : ""}`;

  try {
    const res = await fetch(qfUrl, {
      headers: { Accept: "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reach Quran Foundation API" },
      { status: 502 }
    );
  }
}
