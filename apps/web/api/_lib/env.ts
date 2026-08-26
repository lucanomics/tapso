/**
 * Server-side configuration.
 *
 * Nothing in this module may be imported from `src/`. These values are secrets
 * and are only ever read inside a Vercel Function.
 */

import type { SupportAmountPolicy } from "./support/types.ts";

export type StoreConfig = {
  url: string;
  serviceRoleKey: string;
};

export type EmailConfig = {
  apiKey: string;
  from: string;
  replyTo?: string;
};

export type RateLimitPolicy = {
  burstLimit: number;
  burstWindowSeconds: number;
  sustainedLimit: number;
  sustainedWindowSeconds: number;
  /** A form completed faster than this is not being completed by a person. */
  minimumFillMilliseconds: number;
};

export type TossConfig = {
  secretKey: string;
  clientKey: string;
  apiBaseUrl: string;
  webhookToken?: string;
};

export type ServerEnv = NodeJS.ProcessEnv | Record<string, string | undefined>;

const DEFAULT_PRESET_AMOUNTS = [3000, 5000, 10000];

function trimmed(env: ServerEnv, key: string): string | undefined {
  const value = env[key];
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function positiveInt(env: ServerEnv, key: string, fallback: number): number {
  const raw = trimmed(env, key);
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** `undefined` means the waitlist is not provisioned and must fail closed. */
export function readStoreConfig(env: ServerEnv = process.env): StoreConfig | undefined {
  const url = trimmed(env, "SUPABASE_URL");
  const serviceRoleKey = trimmed(env, "SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return undefined;
  return { url: url.replace(/\/+$/, ""), serviceRoleKey };
}

/** `undefined` means confirmation email is unconfigured; registration still works. */
export function readEmailConfig(env: ServerEnv = process.env): EmailConfig | undefined {
  const apiKey = trimmed(env, "RESEND_API_KEY");
  const from = trimmed(env, "WAITLIST_FROM_EMAIL");
  if (!apiKey || !from) return undefined;
  return { apiKey, from, replyTo: trimmed(env, "WAITLIST_REPLY_TO") };
}

/**
 * The consent text version the visitor actually agreed to. Recording it means a
 * later policy change does not silently rewrite what past visitors accepted.
 */
export function readPrivacyConsentVersion(env: ServerEnv = process.env): string {
  return trimmed(env, "PRIVACY_CONSENT_VERSION") ?? "2026-08-26";
}

export function readRateLimitPolicy(env: ServerEnv = process.env): RateLimitPolicy {
  return {
    burstLimit: positiveInt(env, "WAITLIST_BURST_LIMIT", 3),
    burstWindowSeconds: positiveInt(env, "WAITLIST_BURST_WINDOW_SECONDS", 60),
    sustainedLimit: positiveInt(env, "WAITLIST_RATE_LIMIT", 8),
    sustainedWindowSeconds: positiveInt(env, "WAITLIST_RATE_LIMIT_WINDOW_SECONDS", 3600),
    minimumFillMilliseconds: positiveInt(env, "WAITLIST_MIN_FILL_MS", 1200),
  };
}

/**
 * Support payment is off unless the operator both flips the switch and supplies
 * merchant credentials. Neither alone is enough: a half-configured payment path
 * is worse than a disabled one.
 */
export function readTossConfig(env: ServerEnv = process.env): TossConfig | undefined {
  if (trimmed(env, "SUPPORT_ENABLED") !== "true") return undefined;
  const secretKey = trimmed(env, "TOSS_SECRET_KEY");
  const clientKey = trimmed(env, "TOSS_CLIENT_KEY");
  if (!secretKey || !clientKey) return undefined;
  return {
    secretKey,
    clientKey,
    apiBaseUrl: trimmed(env, "TOSS_API_BASE_URL") ?? "https://api.tosspayments.com",
    webhookToken: trimmed(env, "SUPPORT_WEBHOOK_TOKEN"),
  };
}

export function readSupportAmountPolicy(env: ServerEnv = process.env): SupportAmountPolicy {
  const raw = trimmed(env, "SUPPORT_PRESET_AMOUNTS");
  const presets = raw
    ? raw
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((value) => Number.isSafeInteger(value) && value > 0)
    : [];
  return {
    currency: "KRW",
    presetAmounts: presets.length > 0 ? presets : DEFAULT_PRESET_AMOUNTS,
    minAmount: positiveInt(env, "SUPPORT_MIN_AMOUNT", 1000),
    maxAmount: positiveInt(env, "SUPPORT_MAX_AMOUNT", 100000),
  };
}
