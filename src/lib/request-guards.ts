const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 5000;

export function resetRateLimits() {
  buckets.clear();
}

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp ? realIp.slice(0, 80) : "unknown";
}

/**
 * Best-effort per-isolate limiter. A full bucket returns false.
 * Map growth is capped so a flood of keys cannot exhaust memory.
 */
export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  if (buckets.size > MAX_BUCKETS) buckets.clear();
  const hits = (buckets.get(key) || []).filter((stamp) => now - stamp < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

function requestHost(request: Request) {
  try {
    const host = new URL(request.url).host.toLowerCase();
    if (host) return host;
  } catch {
    /* relative URL — fall through to the Host header */
  }
  return request.headers.get("host")?.split(",")[0]?.trim().toLowerCase() || "";
}

/**
 * Reject cross-origin state changes. Origin is compared to the host on the
 * server request URL, not to a client-supplied `x-forwarded-host` or Host
 * override. Non-browser clients that omit Origin, Referer, and Sec-Fetch-Site
 * are allowed so an operator script can call the authorized path.
 */
export function isSameOriginRequest(request: Request) {
  const expectedHost = requestHost(request);
  if (!expectedHost) return false;

  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site" || fetchSite === "same-site") return false;

  const origin = request.headers.get("origin");
  if (origin) {
    if (origin === "null") return false;
    try {
      return new URL(origin).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  if (fetchSite && fetchSite !== "none" && fetchSite !== "same-origin") return false;
  return true;
}

export function isJsonContentType(request: Request) {
  const value = request.headers.get("content-type") || "";
  return value.split(";")[0]?.trim().toLowerCase() === "application/json";
}

export function jsonResponse(status: number, body: Record<string, unknown>, extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { status, headers });
}

export function guardStateChangingPost(
  request: Request,
  options: { bucket: string; limit: number; windowMs: number; json?: boolean },
) {
  const limited = !consumeRateLimit(
    `${options.bucket}:${clientAddress(request)}`,
    options.limit,
    options.windowMs,
  );
  if (!isSameOriginRequest(request)) {
    return jsonResponse(403, { error: "Cross-origin requests are not allowed." });
  }
  if (limited) {
    return jsonResponse(
      429,
      { error: "Too many requests. Please wait and try again." },
      { "Retry-After": "60" },
    );
  }
  if (options.json !== false && !isJsonContentType(request)) {
    return jsonResponse(415, { error: "Unsupported content type." });
  }
  return null;
}

export async function readJsonObject(request: Request, maxChars = 20_000) {
  let text = "";
  try {
    text = await request.text();
  } catch {
    return jsonResponse(400, { error: "Invalid request." });
  }
  if (text.length > maxChars) {
    return jsonResponse(413, { error: "Request is too large." });
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse(400, { error: "Invalid request." });
    }
    return parsed as Record<string, unknown>;
  } catch {
    return jsonResponse(400, { error: "Invalid request." });
  }
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}
