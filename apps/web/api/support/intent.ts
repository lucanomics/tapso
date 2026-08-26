/**
 * POST /api/support/intent
 *
 * Records the amount TAPSO intends to charge before the payment window opens.
 * That stored amount is the only one the confirm step will ever send to the
 * provider.
 */

import { clientIp, guarded, json, methodNotAllowed, readJsonBody } from "../_lib/http.ts";
import { createSupportIntent } from "../_lib/support/service.ts";
import { supportDependencies } from "../_lib/runtime.ts";

export const POST = guarded("support_intent", async (request: Request) => {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return json({ status: "invalid_request" }, body.reason === "too_large" ? 413 : 400);
  }

  const { response, httpStatus } = await createSupportIntent(
    body.value,
    supportDependencies(clientIp(request)),
  );

  const headers: Record<string, string> =
    response.status === "rate_limited" ? { "retry-after": String(response.retryAfterSeconds) } : {};
  return json(response, httpStatus, headers);
});

export function GET(): Response {
  return methodNotAllowed("POST");
}
