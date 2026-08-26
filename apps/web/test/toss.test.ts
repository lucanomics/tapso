import test from "node:test";
import assert from "node:assert/strict";
import { createTossProvider, mapTossStatus } from "../api/_lib/support/toss.ts";
import type { TossConfig } from "../api/_lib/env.ts";

const config: TossConfig = {
  secretKey: "test_sk_example",
  clientKey: "test_ck_example",
  apiBaseUrl: "https://api.example.test",
};

type Capture = { url: string; init: RequestInit };

function stubFetch(response: Response, capture: Capture[]): typeof fetch {
  return (async (url: string, init: RequestInit) => {
    capture.push({ url, init });
    return response;
  }) as unknown as typeof fetch;
}

const donePayment = {
  paymentKey: "pay_abc",
  orderId: "tapso_support_1",
  totalAmount: 5000,
  currency: "KRW",
  status: "DONE",
  approvedAt: "2026-08-26T01:00:00+09:00",
};

test("every documented Toss status maps to a TAPSO status", () => {
  assert.equal(mapTossStatus("READY"), "pending");
  assert.equal(mapTossStatus("IN_PROGRESS"), "pending");
  assert.equal(mapTossStatus("WAITING_FOR_DEPOSIT"), "awaiting_deposit");
  assert.equal(mapTossStatus("DONE"), "paid");
  assert.equal(mapTossStatus("CANCELED"), "cancelled");
  assert.equal(mapTossStatus("PARTIAL_CANCELED"), "refunded");
  assert.equal(mapTossStatus("ABORTED"), "failed");
  assert.equal(mapTossStatus("EXPIRED"), "failed");
});

test("an unknown status is never optimistically treated as paid", () => {
  assert.equal(mapTossStatus("SOMETHING_NEW"), undefined);
  assert.equal(mapTossStatus(undefined), undefined);
});

test("confirm posts the documented body with basic auth and an idempotency key", async () => {
  const capture: Capture[] = [];
  const provider = createTossProvider(
    config,
    stubFetch(new Response(JSON.stringify(donePayment), { status: 200 }), capture),
  );

  const result = await provider.confirm({
    paymentKey: "pay_abc",
    orderId: "tapso_support_1",
    amount: 5000,
  });

  assert.equal(capture[0]?.url, "https://api.example.test/v1/payments/confirm");
  assert.equal(capture[0]?.init.method, "POST");
  const headers = capture[0]?.init.headers as Record<string, string>;
  // Basic auth is `secretKey + ":"` base64-encoded, per the Toss reference.
  assert.equal(headers.authorization, `Basic ${Buffer.from("test_sk_example:").toString("base64")}`);
  assert.equal(headers["idempotency-key"], "tapso_support_1");
  assert.deepEqual(JSON.parse(String(capture[0]?.init.body)), {
    paymentKey: "pay_abc",
    orderId: "tapso_support_1",
    amount: 5000,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.payment.status, "paid");
  assert.equal(result.payment.amount, 5000);
  assert.equal(result.payment.providerPaymentId, "pay_abc");
});

test("fetch reads the payment by key", async () => {
  const capture: Capture[] = [];
  const provider = createTossProvider(
    config,
    stubFetch(new Response(JSON.stringify(donePayment), { status: 200 }), capture),
  );

  await provider.fetch("pay/abc");
  assert.equal(capture[0]?.url, "https://api.example.test/v1/payments/pay%2Fabc");
  assert.equal(capture[0]?.init.method, "GET");
});

test("a provider error carries its code without exposing the raw body", async () => {
  const provider = createTossProvider(
    config,
    stubFetch(
      new Response(JSON.stringify({ code: "NOT_FOUND_PAYMENT", message: "없는 결제" }), {
        status: 404,
      }),
      [],
    ),
  );

  const result = await provider.fetch("pay_missing");
  assert.deepEqual(result, { ok: false, code: "NOT_FOUND_PAYMENT", message: "없는 결제" });
});

test("an incomplete payment payload is refused rather than half-read", async () => {
  const provider = createTossProvider(
    config,
    stubFetch(new Response(JSON.stringify({ paymentKey: "pay_abc" }), { status: 200 }), []),
  );

  const result = await provider.fetch("pay_abc");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "INVALID_RESPONSE");
});

test("an unreachable provider is reported, not thrown", async () => {
  const provider = createTossProvider(config, (async () => {
    throw new Error("socket hang up");
  }) as unknown as typeof fetch);

  const result = await provider.confirm({ paymentKey: "k", orderId: "o", amount: 1000 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "PROVIDER_UNREACHABLE");
});
