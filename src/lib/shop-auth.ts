import { createHmac } from "node:crypto";
import { timingSafeStringEqual } from "./secrets";

export const OPERATOR_COOKIE = "fkit_operator";
export const OPERATOR_SESSION_SECONDS = 60 * 60 * 8;

const UNSET_SECRET_PLACEHOLDER = "shop-operator-secret-is-not-configured";

/** Exact string `true` only. Unset, empty, `false`, and `TRUE` all stay off. */
export function inventoryWritesEnabled() {
  return process.env.GHL_INVENTORY_WRITES_ENABLED === "true";
}

export function inventoryWritePermitted(authorized: boolean) {
  return inventoryWritesEnabled() && authorized;
}

function operatorSecret() {
  return process.env.SHOP_OPERATOR_SECRET?.trim() || "";
}

export function operatorSecretMatches(provided: string) {
  const expected = operatorSecret();
  if (!expected) {
    timingSafeStringEqual(provided, UNSET_SECRET_PLACEHOLDER);
    return false;
  }
  return timingSafeStringEqual(provided, expected);
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    return part.slice(separator + 1).trim();
  }
  return null;
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueOperatorSession(now = Date.now()) {
  const secret = operatorSecret();
  if (!secret) return null;
  const exp = Math.floor(now / 1000) + OPERATOR_SESSION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ role: "operator", exp }), "utf8").toString(
    "base64url",
  );
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyOperatorSession(token: string, now = Date.now()) {
  const secret = operatorSecret();
  if (!secret) {
    timingSafeStringEqual(token, UNSET_SECRET_PLACEHOLDER);
    return false;
  }
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const [payload, signature] = parts;
  const expected = signPayload(payload, secret);
  if (!timingSafeStringEqual(signature, expected)) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  if (!parsed || typeof parsed !== "object") return false;
  const record = parsed as { role?: unknown; exp?: unknown };
  if (record.role !== "operator") return false;
  if (typeof record.exp !== "number" || !Number.isFinite(record.exp)) return false;
  return record.exp * 1000 > now;
}

export type OperatorAuth = {
  authorized: boolean;
  attempted: boolean;
};

export function readOperatorAuth(request: Request, now = Date.now()): OperatorAuth {
  const bearer = bearerToken(request);
  const cookie = readCookie(request, OPERATOR_COOKIE);
  const bearerOk = bearer !== null && operatorSecretMatches(bearer);
  const cookieOk = cookie !== null && verifyOperatorSession(cookie, now);
  return {
    authorized: bearerOk || cookieOk,
    attempted: bearer !== null || cookie !== null,
  };
}

export function requestIsHttps(request: Request) {
  try {
    if (new URL(request.url).protocol === "https:") return true;
  } catch {
    /* fall through */
  }
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return forwarded === "https";
}

export function operatorSetCookie(token: string, secure: boolean) {
  const parts = [
    `${OPERATOR_COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${OPERATOR_SESSION_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function operatorClearCookie(secure: boolean) {
  const parts = [
    `${OPERATOR_COOKIE}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
