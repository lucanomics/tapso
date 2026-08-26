/**
 * Waitlist registration use case.
 *
 * Framework-free on purpose: the Vercel Function is a thin adapter and every
 * branch below is exercised by `test/waitlist.test.ts` against fakes.
 */

import type { WaitlistResponse } from "./contract.ts";
import type { RateLimitPolicy } from "./env.ts";
import type { EmailTransport } from "./email.ts";
import { buildConfirmationEmail } from "./email.ts";
import { log, maskEmail, maskIp } from "./log.ts";
import { enforceRateLimit, type BurstLimiter } from "./rateLimit.ts";
import type { RateLimitStore, WaitlistStore } from "./store.ts";
import { parseWaitlistRequest } from "./validation.ts";

export type RegisterDependencies = {
  /** Absent when the operator has not provisioned Supabase yet. */
  store?: WaitlistStore & RateLimitStore;
  /** Absent when the operator has not provisioned Resend yet. */
  email?: EmailTransport;
  burstLimiter: BurstLimiter;
  policy: RateLimitPolicy;
  privacyConsentVersion: string;
  clientIp: string;
  source: string;
  now?: () => Date;
};

export async function registerWaitlistEntry(
  body: unknown,
  deps: RegisterDependencies,
): Promise<{ response: WaitlistResponse; httpStatus: number }> {
  const now = deps.now ?? (() => new Date());

  const parsed = parseWaitlistRequest(body);
  if (!parsed.ok) {
    log("info", "waitlist_invalid_request", { field: parsed.field });
    return { response: { status: "invalid_request", field: parsed.field }, httpStatus: 400 };
  }

  const { email, emailNormalized, riderType, formRenderedAt, honeypotFilled } = parsed.value;
  const elapsedMs = formRenderedAt > 0 ? now().getTime() - formRenderedAt : Number.MAX_SAFE_INTEGER;
  const tooFast = elapsedMs < deps.policy.minimumFillMilliseconds;

  // A filled honeypot or an instant submission is refused, not silently
  // accepted. Pretending to succeed would put a lie in front of a human on the
  // rare occasion the heuristic is wrong.
  if (honeypotFilled || tooFast) {
    log("warn", "waitlist_rejected_automation", {
      reason: honeypotFilled ? "honeypot" : "too_fast",
      ip: maskIp(deps.clientIp),
    });
    return { response: { status: "rate_limited", retryAfterSeconds: 30 }, httpStatus: 429 };
  }

  const decision = await enforceRateLimit(
    {
      bucket: `waitlist:${deps.clientIp}`,
      burst: { limit: deps.policy.burstLimit, windowSeconds: deps.policy.burstWindowSeconds },
      sustained: {
        limit: deps.policy.sustainedLimit,
        windowSeconds: deps.policy.sustainedWindowSeconds,
      },
    },
    deps.burstLimiter,
    deps.store,
    (message) => log("warn", "waitlist_rate_limit_degraded", { message }),
  );

  if (!decision.allowed) {
    log("warn", "waitlist_rate_limited", { layer: decision.layer, ip: maskIp(deps.clientIp) });
    return {
      response: { status: "rate_limited", retryAfterSeconds: decision.retryAfterSeconds },
      httpStatus: 429,
    };
  }

  if (!deps.store) {
    log("error", "waitlist_store_unconfigured", {});
    return { response: { status: "unavailable" }, httpStatus: 503 };
  }

  let inserted;
  try {
    inserted = await deps.store.insertEntry({
      email,
      emailNormalized,
      riderType,
      source: deps.source,
      privacyConsentVersion: deps.privacyConsentVersion,
      privacyConsentAt: now().toISOString(),
    });
  } catch (error) {
    log("error", "waitlist_store_failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return { response: { status: "unavailable" }, httpStatus: 503 };
  }

  if (inserted.outcome === "duplicate") {
    log("info", "waitlist_duplicate", { email: maskEmail(emailNormalized) });
    // Not an error. The address is already on the list and will be told.
    return { response: { status: "already_registered" }, httpStatus: 200 };
  }

  log("info", "waitlist_registered", { email: maskEmail(emailNormalized), riderType });

  // From here the registration is durable. Email delivery is reported honestly
  // but can no longer change the outcome of the registration itself.
  if (!deps.email) {
    log("warn", "waitlist_email_unconfigured", { id: inserted.id });
    await recordEmailFailure(deps, inserted.id, "email_transport_unconfigured");
    return { response: { status: "created", emailDelivery: "deferred" }, httpStatus: 201 };
  }

  const result = await deps.email.send(buildConfirmationEmail(email, riderType));
  if (!result.delivered) {
    log("error", "waitlist_email_failed", { id: inserted.id, reason: result.reason });
    await recordEmailFailure(deps, inserted.id, result.reason);
    return { response: { status: "created", emailDelivery: "deferred" }, httpStatus: 201 };
  }

  try {
    await deps.store.recordConfirmationSent(inserted.id);
  } catch (error) {
    // The message really was sent; only the bookkeeping failed.
    log("warn", "waitlist_email_state_write_failed", {
      id: inserted.id,
      message: error instanceof Error ? error.message : "unknown error",
    });
  }

  return { response: { status: "created", emailDelivery: "sent" }, httpStatus: 201 };
}

async function recordEmailFailure(
  deps: RegisterDependencies,
  id: string,
  reason: string,
): Promise<void> {
  if (!deps.store) return;
  try {
    await deps.store.recordConfirmationFailed(id, reason);
  } catch (error) {
    log("warn", "waitlist_email_state_write_failed", {
      id,
      message: error instanceof Error ? error.message : "unknown error",
    });
  }
}
