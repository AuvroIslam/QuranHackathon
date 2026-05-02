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

  console.log("[QF DEBUG] token obtained:", !!token);
  if (token) {
    try {
      const res = await fetch(`${AUTH_API}/${path}${query}`, { headers: getQFHeaders(token) });
      console.log("[QF DEBUG] content API status:", res.status, "url:", `${AUTH_API}/${path}${query}`);
      if (res.ok) {
        const data = await res.json();
        console.log("[QF DEBUG] content API response keys:", Object.keys(data));
        if (data.verses?.[0]?.translations) {
          console.log("[QF DEBUG] verse[0] translation resource_ids:", data.verses[0].translations.map((t: {resource_id: number}) => t.resource_id));
        }
        return NextResponse.json(data, { status: 200 });
      } else {
        const errText = await res.text();
        console.log("[QF DEBUG] content API error body:", errText.slice(0, 300));
      }
    } catch (e) {
      console.log("[QF DEBUG] content API exception:", e);
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
