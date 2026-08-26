/**
 * Toss Payments adapter.
 *
 * Chosen over Stripe because TAPSO charges KRW to Korean riders and Toss covers
 * the local payment methods those riders actually use.
 *
 * Verified against the Toss developer documentation:
 *  - `POST {base}/v1/payments/confirm` with `{ paymentKey, orderId, amount }`
 *  - HTTP Basic auth whose username is the secret key and whose password is
 *    empty, i.e. base64 of `secretKey + ":"`
 *  - `GET {base}/v1/payments/{paymentKey}` returns the same Payment object
 *  - Payment `status` is one of READY, IN_PROGRESS, WAITING_FOR_DEPOSIT, DONE,
 *    CANCELED, PARTIAL_CANCELED, ABORTED, EXPIRED
 *
 * REALITY LABEL `BLOCKED_BY_CREDENTIALS`: no merchant account exists, so this
 * adapter has never run against the live API. Its behavior is covered by
 * `test/support.test.ts` with an injected `fetch`.
 */

import type { TossConfig } from "../env.ts";
import { log } from "../log.ts";
import type { ProviderResult, SupportPaymentProvider, SupportPaymentStatus } from "./types.ts";

const REQUEST_TIMEOUT_MS = 8000;

export const TOSS_PROVIDER_NAME = "toss_payments";

const STATUS_BY_TOSS_STATUS: Record<string, SupportPaymentStatus> = {
  READY: "pending",
  IN_PROGRESS: "pending",
  WAITING_FOR_DEPOSIT: "awaiting_deposit",
  DONE: "paid",
  CANCELED: "cancelled",
  PARTIAL_CANCELED: "refunded",
  ABORTED: "failed",
  EXPIRED: "failed",
};

/** Unknown statuses are never optimistically treated as paid. */
export function mapTossStatus(status: unknown): SupportPaymentStatus | undefined {
  return typeof status === "string" ? STATUS_BY_TOSS_STATUS[status] : undefined;
}

function basicAuth(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`, "utf8").toString("base64")}`;
}

function readPayment(body: unknown): ProviderResult {
  if (!body || typeof body !== "object") {
    return { ok: false, code: "INVALID_RESPONSE", message: "payment payload was not an object" };
  }
  const payment = body as Record<string, unknown>;
  const status = mapTossStatus(payment.status);
  if (
    typeof payment.paymentKey !== "string" ||
    typeof payment.orderId !== "string" ||
    typeof payment.totalAmount !== "number" ||
    status === undefined
  ) {
    return { ok: false, code: "INVALID_RESPONSE", message: "payment payload was incomplete" };
  }

  return {
    ok: true,
    payment: {
      providerPaymentId: payment.paymentKey,
      orderId: payment.orderId,
      amount: payment.totalAmount,
      currency: typeof payment.currency === "string" ? payment.currency : "KRW",
      status,
      failureCode:
        payment.failure && typeof payment.failure === "object"
          ? String((payment.failure as Record<string, unknown>).code ?? "")
          : undefined,
      approvedAt: typeof payment.approvedAt === "string" ? payment.approvedAt : undefined,
    },
  };
}

export function createTossProvider(
  config: TossConfig,
  fetchImpl: typeof fetch = fetch,
): SupportPaymentProvider {
  const request = async (
    path: string,
    init: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string },
  ): Promise<ProviderResult> => {
    const headers: Record<string, string> = { authorization: basicAuth(config.secretKey) };
    if (init.body !== undefined) headers["content-type"] = "application/json";
    // Toss honours `Idempotency-Key`, so a retried confirm cannot double-charge.
    if (init.idempotencyKey) headers["idempotency-key"] = init.idempotencyKey;

    let response: Response;
    try {
      response = await fetchImpl(`${config.apiBaseUrl}${path}`, {
        method: init.method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      return {
        ok: false,
        code: "PROVIDER_UNREACHABLE",
        message: error instanceof Error ? error.message : "request failed",
      };
    }

    let body: unknown;
    try {
      body = (await response.json()) as unknown;
    } catch {
      body = undefined;
    }

    if (!response.ok) {
      const error = (body ?? {}) as Record<string, unknown>;
      const code = typeof error.code === "string" ? error.code : `HTTP_${response.status}`;
      const message = typeof error.message === "string" ? error.message : "payment request failed";
      log("warn", "support_provider_error", { code, httpStatus: response.status });
      return { ok: false, code, message };
    }

    return readPayment(body);
  };

  return {
    name: TOSS_PROVIDER_NAME,

    confirm({ paymentKey, orderId, amount }) {
      return request("/v1/payments/confirm", {
        method: "POST",
        body: { paymentKey, orderId, amount },
        idempotencyKey: orderId,
      });
    },

    fetch(paymentKey) {
      return request(`/v1/payments/${encodeURIComponent(paymentKey)}`, { method: "GET" });
    },
  };
}
