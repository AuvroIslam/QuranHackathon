/**
 * Simple in-memory sliding-window rate limiter.
 * Works per serverless instance — sufficient for a hackathon / small-scale deployment.
 */

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Prune stale entries every 5 minutes to avoid unbounded memory growth
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 5 * 60_000);

/**
 * Returns true if the request is within the allowed rate.
 * Returns false (= should be blocked) if the limit is exceeded.
 *
 * @param ip      — client IP address
 * @param route   — logical key to namespace limits per route
 * @param limit   — max requests per window
 * @param windowMs — window duration in milliseconds (default: 60 000 = 1 min)
 */
export function checkRateLimit(
  ip: string,
  route: string,
  limit: number,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const key = `${route}:${ip}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const resetInMs = windowMs - (now - entry.timestamps[0]);
    store.set(key, entry);
    return { allowed: false, remaining: 0, resetInMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true, remaining: limit - entry.timestamps.length, resetInMs: 0 };
}

/**
 * Extracts the client IP from a Next.js App Router request.
 * Falls back to "unknown" if no IP header is present.
 */
export function getClientIp(req: { headers: { get: (name: string) => string | null } }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
