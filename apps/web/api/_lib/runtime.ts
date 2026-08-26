/**
 * Wires configuration into the use cases.
 *
 * Limiters are module-scope so a warm serverless instance keeps its burst
 * counters across invocations. Everything else is rebuilt per request, which is
 * cheap because none of it opens a connection.
 */

import { webcrypto } from "node:crypto";
import {
  readEmailConfig,
  readPrivacyConsentVersion,
  readRateLimitPolicy,
  readStoreConfig,
  readSupportAmountPolicy,
  readTossConfig,
} from "./env.ts";
import { createResendTransport, type EmailTransport } from "./email.ts";
import { createBurstLimiter } from "./rateLimit.ts";
import { createSupabaseStore, type TapsoStore } from "./store.ts";
import { createTossProvider } from "./support/toss.ts";
import type { SupportDependencies } from "./support/service.ts";
import type { RegisterDependencies } from "./waitlist.ts";

const waitlistPolicy = readRateLimitPolicy();

export const waitlistBurstLimiter = createBurstLimiter(
  waitlistPolicy.burstLimit,
  waitlistPolicy.burstWindowSeconds,
);
export const supportBurstLimiter = createBurstLimiter(5, 60);

export function randomBytes(size: number): Uint8Array {
  return webcrypto.getRandomValues(new Uint8Array(size));
}

export function buildStore(): TapsoStore | undefined {
  const config = readStoreConfig();
  return config ? createSupabaseStore(config) : undefined;
}

export function buildEmailTransport(): EmailTransport | undefined {
  const config = readEmailConfig();
  return config ? createResendTransport(config) : undefined;
}

export function waitlistDependencies(clientIp: string): RegisterDependencies {
  return {
    store: buildStore(),
    email: buildEmailTransport(),
    burstLimiter: waitlistBurstLimiter,
    policy: readRateLimitPolicy(),
    privacyConsentVersion: readPrivacyConsentVersion(),
    clientIp,
    source: "web",
  };
}

export function supportDependencies(clientIp: string): SupportDependencies {
  const toss = readTossConfig();
  const store = toss ? buildStore() : undefined;
  return {
    store,
    provider: toss ? createTossProvider(toss) : undefined,
    clientKey: toss?.clientKey,
    policy: readSupportAmountPolicy(),
    burstLimiter: supportBurstLimiter,
    clientIp,
    randomBytes,
  };
}

export function supportWebhookToken(): string | undefined {
  return readTossConfig()?.webhookToken;
}
