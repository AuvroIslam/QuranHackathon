import { NextRequest, NextResponse } from "next/server";

// Proxy search requests to Quran Foundation Search API
// Usage: /api/quran/search?query=patience&size=10
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing 'query' parameter" }, { status: 400 });
  }

  const apiUrl = process.env.QF_API_URL || "https://api.quran.com/api/v4";

  const downstreamParams = new URLSearchParams();
  downstreamParams.set("q", query);
  downstreamParams.set("size", searchParams.get("size") || "10");
  downstreamParams.set("language", "en");
  if (searchParams.get("page")) {
    downstreamParams.set("page", searchParams.get("page")!);
  }

  const qfUrl = `${apiUrl}/search?${downstreamParams.toString()}`;

  try {
    const res = await fetch(qfUrl, {
      headers: { Accept: "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reach Quran Foundation Search API" },
      { status: 502 }
    );
  }
}
