/**
 * Backend validation. The browser also validates, but only for UX — every
 * constraint that matters is re-checked here.
 */

import { RIDER_TYPES, type RiderType, type WaitlistRequest } from "./contract.ts";

export const MAX_EMAIL_LENGTH = 254;

/**
 * Deliberately not an RFC 5322 parser. It rejects the shapes that are
 * definitely wrong and lets the mail provider adjudicate the rest.
 */
const EMAIL_PATTERN = /^[^\s@,;:<>"'\\]+@[^\s@.,;:<>"'\\]+(\.[^\s@.,;:<>"'\\]+)+$/;

export type ValidationFailure = {
  ok: false;
  field: "email" | "riderType" | "privacyConsent" | "body";
};

export type ValidationSuccess = {
  ok: true;
  value: {
    email: string;
    emailNormalized: string;
    riderType: RiderType;
    formRenderedAt: number;
    honeypotFilled: boolean;
  };
};

/**
 * Casing carries no routing meaning at any mail provider TAPSO will meet, so
 * the normalized form is the lowercase whole address. Sub-addressing is left
 * intact: `a+jeju@x.com` is a different mailbox the visitor chose on purpose.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (email.length < 3 || email.length > MAX_EMAIL_LENGTH) return false;
  if (email.includes("..")) return false;
  return EMAIL_PATTERN.test(email);
}

export function isRiderType(value: unknown): value is RiderType {
  return typeof value === "string" && (RIDER_TYPES as readonly string[]).includes(value);
}

/** Parses an untrusted body into a `WaitlistRequest`, or names the bad field. */
export function parseWaitlistRequest(body: unknown): ValidationSuccess | ValidationFailure {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, field: "body" };
  const input = body as Partial<Record<keyof WaitlistRequest, unknown>>;

  if (typeof input.email !== "string") return { ok: false, field: "email" };
  const email = input.email.trim();
  if (!isValidEmail(email)) return { ok: false, field: "email" };

  if (!isRiderType(input.riderType)) return { ok: false, field: "riderType" };

  // Consent is required, so only the literal `true` is acceptable. A missing or
  // truthy-but-not-true value is a bug or a forged request, never agreement.
  if (input.privacyConsent !== true) return { ok: false, field: "privacyConsent" };

  const formRenderedAt =
    typeof input.formRenderedAt === "number" && Number.isFinite(input.formRenderedAt)
      ? input.formRenderedAt
      : 0;

  const honeypotFilled = typeof input.company === "string" && input.company.trim().length > 0;

  return {
    ok: true,
    value: {
      email,
      emailNormalized: normalizeEmail(email),
      riderType: input.riderType,
      formRenderedAt,
      honeypotFilled,
    },
  };
}

/** KRW has no minor unit, so an amount must be a whole number of won. */
export function parseSupportAmount(
  value: unknown,
  policy: { minAmount: number; maxAmount: number },
): number | undefined {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return undefined;
  if (value < policy.minAmount || value > policy.maxAmount) return undefined;
  return value;
}
