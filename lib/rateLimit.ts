import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60;

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * Get the client IP from the request.
 * Handles X-Forwarded-For (Vercel/Next.js) and falls back to connection IP.
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  // Fallback — in local dev this is 127.0.0.1
  return "127.0.0.1";
}

/**
 * Check rate limit for a given IP.
 * Returns null if allowed, or a 429 NextResponse if exceeded.
 */
export function checkRateLimit(
  req: NextRequest
): NextResponse | null {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${retryAfter}s.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
