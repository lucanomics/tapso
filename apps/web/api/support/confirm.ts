/**
 * POST /api/support/confirm
 *
 * Called when the provider redirects the browser back with a payment key. The
 * redirect itself is not evidence: this handler asks the provider to capture
 * and only then records the result.
 */

import { clientIp, guarded, json, methodNotAllowed, readJsonBody } from "../_lib/http.ts";
import { confirmSupportPayment } from "../_lib/support/service.ts";
import { supportDependencies } from "../_lib/runtime.ts";

export const POST = guarded("support_confirm", async (request: Request) => {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return json({ status: "invalid_request" }, body.reason === "too_large" ? 413 : 400);
  }

  const { response, httpStatus } = await confirmSupportPayment(
    body.value,
    supportDependencies(clientIp(request)),
  );
  return json(response, httpStatus);
});

export function GET(): Response {
  return methodNotAllowed("POST");
}
