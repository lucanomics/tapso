/**
 * Request and response helpers for the Vercel Functions in `apps/web/api`.
 *
 * Handlers use the Web Handler signature, so everything here works against
 * standard `Request` and `Response` objects and is directly unit-testable.
 */

import { log } from "./log.ts";

export const MAX_BODY_BYTES = 8 * 1024;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  // These endpoints are read by TAPSO's own page and by nothing else.
  "cache-control": "no-store",
} as const;

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...headers } });
}

export type BodyResult<T> = { ok: true; value: T } | { ok: false; reason: "too_large" | "malformed" };

/**
 * Reads a JSON body with a hard size cap. `Content-Length` is a hint from the
 * caller, so the decoded text is measured too rather than trusted.
 */
export async function readJsonBody(request: Request): Promise<BodyResult<unknown>> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return { ok: false, reason: "too_large" };

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return { ok: false, reason: "malformed" };

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { ok: false, reason: "too_large" };

  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

/**
 * The client address as Vercel reports it. `x-forwarded-for` is only
 * trustworthy because Vercel's proxy rewrites it; never treat it as
 * authoritative behind an unknown proxy.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

/**
 * Wraps a handler so an unexpected throw becomes a generic 500. Provider and
 * database messages stay in the server log and never reach the browser.
 */
export function guarded(
  event: string,
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      log("error", `${event}_unhandled`, {
        message: error instanceof Error ? error.message : "unknown error",
      });
      return json({ status: "internal_error" }, 500);
    }
  };
}

export function methodNotAllowed(allow: string): Response {
  return json({ status: "invalid_request" }, 405, { allow });
}
