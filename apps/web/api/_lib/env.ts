import type { SupportMode } from "./support/types.ts";

export const MILLION_SUPPORT_AMOUNT = 1_000_000;
const DEFAULT_PRESET_AMOUNTS = [3000, 5000, 10000, MILLION_SUPPORT_AMOUNT];

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function required(name: string): string {
  const value = read(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalUrl(name: string): string | undefined {
  const raw = read(name);
  if (!raw) return undefined;
  try {
    return new URL(raw).toString();
  } catch {
    throw new Error(`${name} must be an absolute URL.`);
  }
}

function positiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePresetAmounts(raw: string | undefined): number[] {
  if (!raw) return DEFAULT_PRESET_AMOUNTS;
  const values = raw
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isSafeInteger(value) && value > 0);
  return values.length ? values : DEFAULT_PRESET_AMOUNTS;
}

export interface PublicRuntimeConfig {
  appOrigin: string;
  supportMode: SupportMode;
}

export function readPublicRuntimeConfig(): PublicRuntimeConfig {
  return {
    appOrigin: optionalUrl("PUBLIC_APP_ORIGIN") ?? "http://localhost:5173/",
    supportMode: read("SUPPORT_MODE") === "live" ? "live" : "disabled",
  };
}

export interface SupabaseEnv {
  url: string;
  serviceRoleKey: string;
}

export function readSupabaseEnv(): SupabaseEnv {
  return {
    url: required("SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export interface ResendEnv {
  apiKey: string;
  from: string;
  replyTo?: string;
}

export function readResendEnv(): ResendEnv {
  return {
    apiKey: required("RESEND_API_KEY"),
    from: required("RESEND_FROM"),
    replyTo: read("RESEND_REPLY_TO"),
  };
}

export interface TossEnv {
  clientKey: string;
  secretKey: string;
  webhookSecret: string;
  apiBaseUrl: string;
}

export function readTossEnv(): TossEnv {
  return {
    clientKey: required("TOSS_CLIENT_KEY"),
    secretKey: required("TOSS_SECRET_KEY"),
    webhookSecret: required("TOSS_WEBHOOK_SECRET"),
    apiBaseUrl: optionalUrl("TOSS_API_BASE_URL") ?? "https://api.tosspayments.com/",
  };
}

export interface SupportAmountPolicy {
  currency: "KRW";
  presetAmounts: number[];
  minAmount: number;
  maxAmount: number;
}

export function readSupportAmountPolicy(): SupportAmountPolicy {
  const configuredPresets = parsePresetAmounts(read("SUPPORT_PRESET_AMOUNTS"));
  // The million-won choice is a deliberate product easter egg, not an
  // operator-only environment toggle. Keep it available even when an older
  // environment still contains the pre-feature preset list or 100k max.
  const presetAmounts = Array.from(new Set([...configuredPresets, MILLION_SUPPORT_AMOUNT])).sort(
    (a, b) => a - b,
  );
  const configuredMax = positiveInt(read("SUPPORT_MAX_AMOUNT"), MILLION_SUPPORT_AMOUNT);

  return {
    currency: "KRW",
    presetAmounts,
    minAmount: positiveInt(read("SUPPORT_MIN_AMOUNT"), 1000),
    maxAmount: Math.max(configuredMax, MILLION_SUPPORT_AMOUNT),
  };
}

export interface RateLimitEnv {
  windowMs: number;
  waitlistMax: number;
  supportIntentMax: number;
}

export function readRateLimitEnv(): RateLimitEnv {
  return {
    windowMs: positiveInt(read("RATE_LIMIT_WINDOW_MS"), 60_000),
    waitlistMax: positiveInt(read("WAITLIST_RATE_LIMIT_MAX"), 5),
    supportIntentMax: positiveInt(read("SUPPORT_RATE_LIMIT_MAX"), 8),
  };
}

export const envForTests = {
  read,
  optionalUrl,
  positiveInt,
  parsePresetAmounts,
};
