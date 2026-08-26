/**
 * POST /api/support/webhook
 *
 * Provider notification endpoint. The body is a hint, never proof — see
 * `_lib/support/service.ts` for why Toss `PAYMENT_STATUS_CHANGED` events carry
 * no signature and what the server does instead.
 *
 * Register the URL with the secret token appended:
 *   https://<domain>/api/support/webhook?t=<SUPPORT_WEBHOOK_TOKEN>
 */

import { clientIp, guarded, json, methodNotAllowed } from "../_lib/http.ts";
import { MAX_BODY_BYTES } from "../_lib/http.ts";
import { handleSupportWebhook } from "../_lib/support/service.ts";
import { supportDependencies, supportWebhookToken } from "../_lib/runtime.ts";

export const POST = guarded("support_webhook", async (request: Request) => {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return json({ received: false }, 413);
  }

  const suppliedToken = new URL(request.url).searchParams.get("t") ?? undefined;
  const result = await handleSupportWebhook(
    raw,
    suppliedToken,
    supportWebhookToken(),
    supportDependencies(clientIp(request)),
  );

  // Toss expects a 2xx within ten seconds; anything else is a retry request.
  return json({ received: result.httpStatus === 200 }, result.httpStatus);
});

export function GET(): Response {
  return methodNotAllowed("POST");
}
