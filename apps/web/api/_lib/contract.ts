/**
 * The wire contract between `apps/web/api` and the browser.
 *
 * This file is the one module that both the serverless handlers and `src/`
 * import. It must stay free of secrets, Node built-ins, and DOM types.
 */

/** Stable machine codes. The Korean labels live in the UI, not the database. */
export const RIDER_TYPES = ["resident", "visitor", "enthusiast", "supporter"] as const;

export type RiderType = (typeof RIDER_TYPES)[number];

export type WaitlistRequest = {
  email: string;
  riderType: RiderType;
  privacyConsent: true;
  /** `Date.now()` when the form mounted. Used to reject instant submissions. */
  formRenderedAt: number;
  /** Honeypot. A real person never fills a field they cannot see. */
  company?: string;
};

/** Reported only on `created`, so the UI can be honest about email delivery. */
export type EmailDelivery = "sent" | "deferred";

export type WaitlistResponse =
  | { status: "created"; emailDelivery: EmailDelivery }
  | { status: "already_registered" }
  | { status: "invalid_request"; field?: "email" | "riderType" | "privacyConsent" | "body" }
  | { status: "rate_limited"; retryAfterSeconds: number }
  | { status: "unavailable" }
  | { status: "internal_error" };

export type SupportAvailability = "live" | "unavailable";

export type SupportConfigResponse = {
  mode: SupportAvailability;
  currency: "KRW";
  presetAmounts: number[];
  minAmount: number;
  maxAmount: number;
  /** Publishable merchant key. Present only when `mode` is `live`. */
  clientKey?: string;
};

export type SupportIntentResponse =
  | { status: "created"; orderId: string; amount: number; currency: "KRW"; clientKey: string }
  | { status: "invalid_request"; field?: "amount" }
  | { status: "rate_limited"; retryAfterSeconds: number }
  | { status: "unavailable" }
  | { status: "internal_error" };

export type SupportConfirmResponse =
  | { status: "paid"; orderId: string; amount: number }
  | { status: "pending"; orderId: string }
  | { status: "failed"; orderId: string; reason: string }
  | { status: "invalid_request"; field?: "orderId" | "paymentKey" | "amount" }
  | { status: "unavailable" }
  | { status: "internal_error" };

export const WAITLIST_ENDPOINT = "/api/waitlist";
export const SUPPORT_CONFIG_ENDPOINT = "/api/support/config";
export const SUPPORT_INTENT_ENDPOINT = "/api/support/intent";
export const SUPPORT_CONFIRM_ENDPOINT = "/api/support/confirm";
