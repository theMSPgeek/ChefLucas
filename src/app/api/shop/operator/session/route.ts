import {
  guardStateChangingPost,
  isResponse,
  jsonResponse,
  readJsonObject,
} from "@/lib/request-guards";
import {
  issueOperatorSession,
  operatorClearCookie,
  operatorSecretMatches,
  operatorSetCookie,
  readOperatorAuth,
  requestIsHttps,
} from "@/lib/shop-auth";

export const runtime = "nodejs";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  const { authorized } = readOperatorAuth(request);
  return jsonResponse(200, { ok: true, signedIn: authorized });
}

export async function POST(request: Request) {
  const blocked = guardStateChangingPost(request, {
    bucket: "operator-login",
    limit: LOGIN_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });
  if (blocked) return blocked;

  const body = await readJsonObject(request);
  if (isResponse(body)) return body;

  const secret = typeof body.secret === "string" ? body.secret : "";
  if (!secret || !operatorSecretMatches(secret)) {
    console.error("[shop/operator] rejected sign-in");
    return jsonResponse(401, { error: "Unauthorized." });
  }

  const token = issueOperatorSession();
  if (!token) {
    console.error("[shop/operator] rejected sign-in");
    return jsonResponse(401, { error: "Unauthorized." });
  }

  return jsonResponse(
    200,
    { ok: true },
    { "Set-Cookie": operatorSetCookie(token, requestIsHttps(request)) },
  );
}

export async function DELETE(request: Request) {
  const blocked = guardStateChangingPost(request, {
    bucket: "operator-logout",
    limit: LOGIN_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
    json: false,
  });
  if (blocked) return blocked;
  return jsonResponse(200, { ok: true }, {
    "Set-Cookie": operatorClearCookie(requestIsHttps(request)),
  });
}
