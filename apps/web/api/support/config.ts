/**
 * GET /api/support/config
 *
 * Tells the browser whether support payment is actually live and, if so, which
 * amounts and publishable key to use. The client never decides this: a UI flag
 * cannot make an unconfigured merchant account able to take money.
 */

import type { SupportConfigResponse } from "../_lib/contract.ts";
import { clientIp, guarded, json, methodNotAllowed } from "../_lib/http.ts";
import { isSupportLive } from "../_lib/support/service.ts";
import { supportDependencies } from "../_lib/runtime.ts";

export const GET = guarded("support_config", async (request: Request) => {
  const deps = supportDependencies(clientIp(request));
  const live = isSupportLive(deps);

  const response: SupportConfigResponse = {
    mode: live ? "live" : "unavailable",
    currency: deps.policy.currency,
    presetAmounts: deps.policy.presetAmounts,
    minAmount: deps.policy.minAmount,
    maxAmount: deps.policy.maxAmount,
    // Publishable by design; it is useless without the server-side secret key.
    ...(live ? { clientKey: deps.clientKey } : {}),
  };
  return json(response, 200);
});

export function POST(): Response {
  return methodNotAllowed("GET");
}
