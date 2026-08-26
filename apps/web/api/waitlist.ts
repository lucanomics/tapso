/**
 * POST /api/waitlist
 *
 * Replaces the previous `mailto:` handoff. A submission now becomes a row in
 * `waitlist_entries` and a transactional confirmation email; the visitor's mail
 * app is never involved.
 */

import { clientIp, guarded, json, methodNotAllowed, readJsonBody } from "./_lib/http.ts";
import { registerWaitlistEntry } from "./_lib/waitlist.ts";
import { waitlistDependencies } from "./_lib/runtime.ts";

export const POST = guarded("waitlist", async (request: Request) => {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return json({ status: "invalid_request", field: "body" }, body.reason === "too_large" ? 413 : 400);
  }

  const { response, httpStatus } = await registerWaitlistEntry(
    body.value,
    waitlistDependencies(clientIp(request)),
  );

  const headers: Record<string, string> =
    response.status === "rate_limited" ? { "retry-after": String(response.retryAfterSeconds) } : {};
  return json(response, httpStatus, headers);
});

export function GET(): Response {
  return methodNotAllowed("POST");
}
