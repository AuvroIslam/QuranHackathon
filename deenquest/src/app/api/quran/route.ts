import { NextRequest, NextResponse } from "next/server";
import { getQFContentToken, getQFHeaders } from "@/lib/qf-auth";

const PUBLIC_API = "https://api.quran.com/api/v4";
const AUTH_API = "https://apis.quran.foundation/content/api/v4";

// Only allow safe path segments — no traversal, no external redirects
const SAFE_PATH = /^[a-zA-Z0-9_\-/.:]+$/;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const path = searchParams.get("path");

  if (!path || !SAFE_PATH.test(path) || path.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const downstreamParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== "path") downstreamParams.set(key, value);
  });
  const query = downstreamParams.toString() ? `?${downstreamParams.toString()}` : "";

  // Try authenticated QF Content API; fall back to public api.quran.com
  const token = await getQFContentToken();

  if (token) {
    try {
      const res = await fetch(`${AUTH_API}/${path}${query}`, { headers: getQFHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 200 });
      }
    } catch {
      // fall through to public API
    }
  }

  try {
    const res = await fetch(`${PUBLIC_API}/${path}${query}`, { headers: { Accept: "application/json" } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to reach Quran API" }, { status: 502 });
  }
}
