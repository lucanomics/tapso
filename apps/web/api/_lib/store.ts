/**
 * Persistence boundary.
 *
 * Supabase is reached over PostgREST with `fetch` rather than through
 * `@supabase/supabase-js`. Four HTTP calls do not justify an SDK and its
 * transitive tree, and `services/api` sets the same zero-dependency precedent.
 *
 * Everything below runs with the service role key, which bypasses RLS. It must
 * never be imported from `src/`.
 */

import type { StoreConfig } from "./env.ts";
import type { RiderType } from "./contract.ts";
import type { SupportPaymentRecord, SupportPaymentStatus } from "./support/types.ts";

const REQUEST_TIMEOUT_MS = 8000;

/** Postgres `unique_violation`. PostgREST forwards it verbatim. */
const UNIQUE_VIOLATION = "23505";

export type NewWaitlistEntry = {
  email: string;
  emailNormalized: string;
  riderType: RiderType;
  source: string;
  privacyConsentVersion: string;
  privacyConsentAt: string;
};

export type WaitlistInsert =
  | { outcome: "created"; id: string }
  | { outcome: "duplicate" };

export type RateLimitVerdict = { allowed: boolean; retryAfterSeconds: number };

export type WaitlistStore = {
  insertEntry(entry: NewWaitlistEntry): Promise<WaitlistInsert>;
  recordConfirmationSent(id: string): Promise<void>;
  recordConfirmationFailed(id: string, reason: string): Promise<void>;
};

export type RateLimitStore = {
  consume(bucket: string, windowSeconds: number, limit: number): Promise<RateLimitVerdict>;
};

export type SupportStore = {
  createPayment(payment: {
    provider: string;
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<void>;
  findPaymentByOrderId(orderId: string): Promise<SupportPaymentRecord | undefined>;
  updatePayment(
    orderId: string,
    patch: {
      status: SupportPaymentStatus;
      providerPaymentId?: string;
      failureCode?: string;
      confirmedAt?: string;
    },
  ): Promise<void>;
  /** `duplicate` means this provider event was already applied. */
  recordWebhookEvent(
    provider: string,
    eventId: string,
    eventType?: string,
  ): Promise<"recorded" | "duplicate">;
};

export type TapsoStore = WaitlistStore & RateLimitStore & SupportStore;

export function storeError(message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code: "STORE_ERROR" });
}

type PostgrestRow = Record<string, unknown>;

function toPaymentRecord(row: PostgrestRow): SupportPaymentRecord {
  return {
    orderId: String(row.order_id),
    provider: String(row.provider),
    providerPaymentId: typeof row.provider_payment_id === "string" ? row.provider_payment_id : undefined,
    amount: Number(row.amount),
    currency: String(row.currency),
    status: String(row.status) as SupportPaymentStatus,
    confirmedAt: typeof row.confirmed_at === "string" ? row.confirmed_at : undefined,
  };
}

export function createSupabaseStore(config: StoreConfig, fetchImpl: typeof fetch = fetch): TapsoStore {
  const base = `${config.url}/rest/v1`;

  const call = async (
    path: string,
    init: { method: string; body?: unknown; prefer?: string },
  ): Promise<{ status: number; body: unknown }> => {
    const headers: Record<string, string> = {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      accept: "application/json",
    };
    if (init.body !== undefined) headers["content-type"] = "application/json";
    if (init.prefer) headers.prefer = init.prefer;

    let response: Response;
    try {
      response = await fetchImpl(`${base}${path}`, {
        method: init.method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw storeError(error instanceof Error ? error.message : "request failed");
    }

    const text = await response.text();
    let body: unknown = undefined;
    if (text.length > 0) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = undefined;
      }
    }
    return { status: response.status, body };
  };

  const expectOk = (result: { status: number; body: unknown }, what: string): void => {
    if (result.status >= 200 && result.status < 300) return;
    const code =
      result.body && typeof result.body === "object" && "code" in result.body
        ? String((result.body as PostgrestRow).code)
        : String(result.status);
    throw storeError(`${what} failed (${code})`);
  };

  const isUniqueViolation = (result: { status: number; body: unknown }): boolean =>
    result.status === 409 &&
    Boolean(result.body) &&
    typeof result.body === "object" &&
    (result.body as PostgrestRow).code === UNIQUE_VIOLATION;

  return {
    async insertEntry(entry) {
      const result = await call("/waitlist_entries", {
        method: "POST",
        prefer: "return=representation",
        body: {
          email: entry.email,
          email_normalized: entry.emailNormalized,
          rider_type: entry.riderType,
          source: entry.source,
          privacy_consent_version: entry.privacyConsentVersion,
          privacy_consent_at: entry.privacyConsentAt,
        },
      });

      // The unique index on `email_normalized` is the duplicate check. The
      // browser is never trusted to decide whether an address is already known.
      if (isUniqueViolation(result)) return { outcome: "duplicate" };
      expectOk(result, "waitlist insert");

      const rows = Array.isArray(result.body) ? (result.body as PostgrestRow[]) : [];
      const id = rows[0]?.id;
      if (typeof id !== "string") throw storeError("waitlist insert returned no id");
      return { outcome: "created", id };
    },

    async recordConfirmationSent(id) {
      expectOk(
        await call(`/waitlist_entries?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          prefer: "return=minimal",
          body: {
            confirmation_email_status: "sent",
            confirmation_sent_at: new Date().toISOString(),
            confirmation_error: null,
            updated_at: new Date().toISOString(),
          },
        }),
        "confirmation sent update",
      );
    },

    async recordConfirmationFailed(id, reason) {
      expectOk(
        await call(`/waitlist_entries?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          prefer: "return=minimal",
          body: {
            confirmation_email_status: "failed",
            confirmation_error: reason.slice(0, 500),
            updated_at: new Date().toISOString(),
          },
        }),
        "confirmation failure update",
      );
    },

    async consume(bucket, windowSeconds, limit) {
      const result = await call("/rpc/consume_rate_limit", {
        method: "POST",
        body: { p_bucket: bucket, p_window_seconds: windowSeconds, p_limit: limit },
      });
      expectOk(result, "rate limit");
      const rows = Array.isArray(result.body) ? (result.body as PostgrestRow[]) : [];
      const row = rows[0];
      if (!row) throw storeError("rate limit returned no row");
      return {
        allowed: row.allowed === true,
        retryAfterSeconds: Number(row.retry_after_seconds) || windowSeconds,
      };
    },

    async createPayment(payment) {
      expectOk(
        await call("/support_payments", {
          method: "POST",
          prefer: "return=minimal",
          body: {
            provider: payment.provider,
            order_id: payment.orderId,
            amount: payment.amount,
            currency: payment.currency,
            status: "pending",
          },
        }),
        "support payment insert",
      );
    },

    async findPaymentByOrderId(orderId) {
      const result = await call(
        `/support_payments?order_id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`,
        { method: "GET" },
      );
      expectOk(result, "support payment lookup");
      const rows = Array.isArray(result.body) ? (result.body as PostgrestRow[]) : [];
      const first = rows[0];
      return first ? toPaymentRecord(first) : undefined;
    },

    async updatePayment(orderId, patch) {
      const body: PostgrestRow = { status: patch.status, updated_at: new Date().toISOString() };
      if (patch.providerPaymentId !== undefined) body.provider_payment_id = patch.providerPaymentId;
      if (patch.failureCode !== undefined) body.failure_code = patch.failureCode;
      if (patch.confirmedAt !== undefined) body.confirmed_at = patch.confirmedAt;
      expectOk(
        await call(`/support_payments?order_id=eq.${encodeURIComponent(orderId)}`, {
          method: "PATCH",
          prefer: "return=minimal",
          body,
        }),
        "support payment update",
      );
    },

    async recordWebhookEvent(provider, eventId, eventType) {
      const result = await call("/support_webhook_events", {
        method: "POST",
        prefer: "return=minimal",
        body: { provider, event_id: eventId, event_type: eventType ?? null },
      });
      if (isUniqueViolation(result)) return "duplicate";
      expectOk(result, "webhook event insert");
      return "recorded";
    },
  };
}
