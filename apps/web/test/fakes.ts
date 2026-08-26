/**
 * Test doubles for the provider boundaries.
 *
 * No test may reach a real database, mail provider, or payment provider, so
 * every outbound edge is represented here.
 */

import type { EmailTransport, OutgoingEmail } from "../api/_lib/email.ts";
import type {
  NewWaitlistEntry,
  RateLimitVerdict,
  TapsoStore,
  WaitlistInsert,
} from "../api/_lib/store.ts";
import type {
  ProviderResult,
  SupportPaymentProvider,
  SupportPaymentRecord,
  SupportPaymentStatus,
} from "../api/_lib/support/types.ts";

export type FakeStore = TapsoStore & {
  entries: Map<string, NewWaitlistEntry & { id: string; emailState: string; emailError?: string }>;
  payments: Map<string, SupportPaymentRecord>;
  webhookEvents: Set<string>;
  rateLimitCalls: Array<{ bucket: string; windowSeconds: number; limit: number }>;
  failNextInsert?: string;
  failRateLimit?: string;
};

export function createFakeStore(options: { rateLimit?: RateLimitVerdict } = {}): FakeStore {
  const entries: FakeStore["entries"] = new Map();
  const payments = new Map<string, SupportPaymentRecord>();
  const webhookEvents = new Set<string>();
  const rateLimitCalls: FakeStore["rateLimitCalls"] = [];
  let nextId = 1;

  const store: FakeStore = {
    entries,
    payments,
    webhookEvents,
    rateLimitCalls,

    async insertEntry(entry: NewWaitlistEntry): Promise<WaitlistInsert> {
      if (store.failNextInsert) throw new Error(store.failNextInsert);
      if (entries.has(entry.emailNormalized)) return { outcome: "duplicate" };
      const id = `entry-${nextId++}`;
      entries.set(entry.emailNormalized, { ...entry, id, emailState: "pending" });
      return { outcome: "created", id };
    },

    async recordConfirmationSent(id) {
      for (const entry of entries.values()) if (entry.id === id) entry.emailState = "sent";
    },

    async recordConfirmationFailed(id, reason) {
      for (const entry of entries.values()) {
        if (entry.id === id) {
          entry.emailState = "failed";
          entry.emailError = reason;
        }
      }
    },

    async consume(bucket, windowSeconds, limit) {
      if (store.failRateLimit) throw new Error(store.failRateLimit);
      rateLimitCalls.push({ bucket, windowSeconds, limit });
      return options.rateLimit ?? { allowed: true, retryAfterSeconds: 60 };
    },

    async createPayment(payment) {
      payments.set(payment.orderId, {
        orderId: payment.orderId,
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency,
        status: "pending",
      });
    },

    async findPaymentByOrderId(orderId) {
      return payments.get(orderId);
    },

    async updatePayment(orderId, patch) {
      const existing = payments.get(orderId);
      if (!existing) throw new Error("payment not found");
      payments.set(orderId, {
        ...existing,
        status: patch.status,
        providerPaymentId: patch.providerPaymentId ?? existing.providerPaymentId,
        confirmedAt: patch.confirmedAt ?? existing.confirmedAt,
      });
    },

    async recordWebhookEvent(provider, eventId) {
      const key = `${provider}:${eventId}`;
      if (webhookEvents.has(key)) return "duplicate";
      webhookEvents.add(key);
      return "recorded";
    },
  };

  return store;
}

export type FakeEmail = EmailTransport & { sent: OutgoingEmail[]; failWith?: string };

export function createFakeEmail(): FakeEmail {
  const transport: FakeEmail = {
    sent: [],
    async send(message) {
      if (transport.failWith) return { delivered: false, reason: transport.failWith };
      transport.sent.push(message);
      return { delivered: true };
    },
  };
  return transport;
}

export type FakeProvider = SupportPaymentProvider & {
  confirmCalls: Array<{ paymentKey: string; orderId: string; amount: number }>;
  fetchCalls: string[];
  confirmResult: ProviderResult;
  fetchResult: ProviderResult;
};

export function paymentView(overrides: {
  orderId: string;
  amount: number;
  status?: SupportPaymentStatus;
  paymentKey?: string;
}): ProviderResult {
  return {
    ok: true,
    payment: {
      providerPaymentId: overrides.paymentKey ?? "pay_test_123",
      orderId: overrides.orderId,
      amount: overrides.amount,
      currency: "KRW",
      status: overrides.status ?? "paid",
      approvedAt: "2026-08-26T01:00:00.000Z",
    },
  };
}

export function createFakeProvider(initial: ProviderResult): FakeProvider {
  const provider: FakeProvider = {
    name: "fake_provider",
    confirmCalls: [],
    fetchCalls: [],
    confirmResult: initial,
    fetchResult: initial,
    async confirm(input) {
      provider.confirmCalls.push(input);
      return provider.confirmResult;
    },
    async fetch(paymentKey) {
      provider.fetchCalls.push(paymentKey);
      return provider.fetchResult;
    },
  };
  return provider;
}

/** Deterministic byte source so order ids are stable inside a test. */
export function fixedRandomBytes(seed = 7): (size: number) => Uint8Array {
  return (size) => Uint8Array.from({ length: size }, (_unused, index) => (seed + index) % 256);
}
