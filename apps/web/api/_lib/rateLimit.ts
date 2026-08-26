/**
 * Anti-abuse for the public waitlist endpoint.
 *
 * Two layers, because neither is sufficient alone:
 *  - an in-process burst counter, which is free but only sees one warm
 *    serverless instance;
 *  - a Postgres fixed-window counter, which every instance shares.
 *
 * Client-side throttling is not part of this. It is a courtesy, not a control.
 */

import type { RateLimitStore, RateLimitVerdict } from "./store.ts";

export type BurstLimiter = {
  consume(bucket: string, now?: number): RateLimitVerdict;
};

/**
 * A fixed window keyed by bucket. Entries are pruned opportunistically so a
 * long-lived instance cannot grow without bound.
 */
export function createBurstLimiter(limit: number, windowSeconds: number): BurstLimiter {
  const windowMs = windowSeconds * 1000;
  const windows = new Map<string, { windowStart: number; hits: number }>();

  return {
    consume(bucket, now = Date.now()) {
      const windowStart = Math.floor(now / windowMs) * windowMs;

      if (windows.size > 4096) {
        for (const [key, entry] of windows) {
          if (entry.windowStart !== windowStart) windows.delete(key);
        }
      }

      const existing = windows.get(bucket);
      const entry =
        existing && existing.windowStart === windowStart ? existing : { windowStart, hits: 0 };
      entry.hits += 1;
      windows.set(bucket, entry);

      const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
      return { allowed: entry.hits <= limit, retryAfterSeconds };
    },
  };
}

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; layer: "burst" | "sustained" };

export type RateLimitCheck = {
  bucket: string;
  burst: { limit: number; windowSeconds: number };
  sustained: { limit: number; windowSeconds: number };
};

/**
 * Runs the burst gate first so an abusive loop is rejected without touching the
 * database. A durable-limiter outage fails open: dropping real registrations to
 * punish a hypothetical script would be the worse trade.
 */
export async function enforceRateLimit(
  check: RateLimitCheck,
  burstLimiter: BurstLimiter,
  store: RateLimitStore | undefined,
  onStoreError: (message: string) => void,
): Promise<RateLimitDecision> {
  const burst = burstLimiter.consume(check.bucket);
  if (!burst.allowed) {
    return { allowed: false, retryAfterSeconds: burst.retryAfterSeconds, layer: "burst" };
  }

  if (!store) return { allowed: true };

  let sustained: RateLimitVerdict;
  try {
    sustained = await store.consume(
      `${check.bucket}:${check.sustained.windowSeconds}`,
      check.sustained.windowSeconds,
      check.sustained.limit,
    );
  } catch (error) {
    onStoreError(error instanceof Error ? error.message : "rate limit unavailable");
    return { allowed: true };
  }

  if (!sustained.allowed) {
    return { allowed: false, retryAfterSeconds: sustained.retryAfterSeconds, layer: "sustained" };
  }
  return { allowed: true };
}
