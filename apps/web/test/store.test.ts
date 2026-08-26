import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseStore } from "../api/_lib/store.ts";

const config = { url: "https://project.supabase.co", serviceRoleKey: "service-role-key" };

type Capture = { url: string; init: RequestInit };

function stub(responses: Response[], capture: Capture[] = []): typeof fetch {
  let index = 0;
  return (async (url: string, init: RequestInit) => {
    capture.push({ url, init });
    const response = responses[index];
    index += 1;
    if (!response) throw new Error("unexpected extra request");
    return response;
  }) as unknown as typeof fetch;
}

const entry = {
  email: "Rider@Example.com",
  emailNormalized: "rider@example.com",
  riderType: "resident" as const,
  source: "web",
  privacyConsentVersion: "2026-08-26",
  privacyConsentAt: "2026-08-26T01:00:00.000Z",
};

test("an insert sends the service role key and snake_case columns", async () => {
  const capture: Capture[] = [];
  const store = createSupabaseStore(
    config,
    stub([new Response(JSON.stringify([{ id: "row-1" }]), { status: 201 })], capture),
  );

  const result = await store.insertEntry(entry);

  assert.deepEqual(result, { outcome: "created", id: "row-1" });
  assert.equal(capture[0]?.url, "https://project.supabase.co/rest/v1/waitlist_entries");
  const headers = capture[0]?.init.headers as Record<string, string>;
  assert.equal(headers.apikey, "service-role-key");
  assert.equal(headers.authorization, "Bearer service-role-key");
  assert.deepEqual(JSON.parse(String(capture[0]?.init.body)), {
    email: "Rider@Example.com",
    email_normalized: "rider@example.com",
    rider_type: "resident",
    source: "web",
    privacy_consent_version: "2026-08-26",
    privacy_consent_at: "2026-08-26T01:00:00.000Z",
  });
});

test("a Postgres unique violation is read as a duplicate, not an error", async () => {
  const store = createSupabaseStore(
    config,
    stub([
      new Response(JSON.stringify({ code: "23505", message: "duplicate key value" }), {
        status: 409,
      }),
    ]),
  );

  assert.deepEqual(await store.insertEntry(entry), { outcome: "duplicate" });
});

test("any other database error throws rather than being mistaken for a duplicate", async () => {
  const store = createSupabaseStore(
    config,
    stub([new Response(JSON.stringify({ code: "42P01" }), { status: 400 })]),
  );

  await assert.rejects(() => store.insertEntry(entry), /waitlist insert failed \(42P01\)/);
});

test("a paused project surfaces as a store error", async () => {
  const store = createSupabaseStore(config, (async () => {
    throw new Error("fetch failed");
  }) as unknown as typeof fetch);

  await assert.rejects(() => store.insertEntry(entry), /fetch failed/);
});

test("the rate limit RPC is called with the documented arguments", async () => {
  const capture: Capture[] = [];
  const store = createSupabaseStore(
    config,
    stub(
      [
        new Response(JSON.stringify([{ allowed: false, hits: 9, retry_after_seconds: 1200 }]), {
          status: 200,
        }),
      ],
      capture,
    ),
  );

  const verdict = await store.consume("waitlist:1.2.3.4", 3600, 8);

  assert.deepEqual(verdict, { allowed: false, retryAfterSeconds: 1200 });
  assert.equal(capture[0]?.url, "https://project.supabase.co/rest/v1/rpc/consume_rate_limit");
  assert.deepEqual(JSON.parse(String(capture[0]?.init.body)), {
    p_bucket: "waitlist:1.2.3.4",
    p_window_seconds: 3600,
    p_limit: 8,
  });
});

test("a payment lookup maps the row into the domain shape", async () => {
  const store = createSupabaseStore(
    config,
    stub([
      new Response(
        JSON.stringify([
          {
            order_id: "tapso_support_1",
            provider: "toss_payments",
            provider_payment_id: "pay_abc",
            amount: 5000,
            currency: "KRW",
            status: "paid",
            confirmed_at: "2026-08-26T01:00:00.000Z",
          },
        ]),
        { status: 200 },
      ),
    ]),
  );

  assert.deepEqual(await store.findPaymentByOrderId("tapso_support_1"), {
    orderId: "tapso_support_1",
    provider: "toss_payments",
    providerPaymentId: "pay_abc",
    amount: 5000,
    currency: "KRW",
    status: "paid",
    confirmedAt: "2026-08-26T01:00:00.000Z",
  });
});

test("a missing payment resolves to undefined", async () => {
  const store = createSupabaseStore(config, stub([new Response("[]", { status: 200 })]));
  assert.equal(await store.findPaymentByOrderId("nope"), undefined);
});

test("a replayed webhook event insert reports duplicate", async () => {
  const store = createSupabaseStore(
    config,
    stub([new Response(JSON.stringify({ code: "23505" }), { status: 409 })]),
  );

  assert.equal(await store.recordWebhookEvent("toss_payments", "evt-1"), "duplicate");
});

test("an order id is escaped into the filter", async () => {
  const capture: Capture[] = [];
  const store = createSupabaseStore(
    config,
    stub([new Response(null, { status: 204 })], capture),
  );

  await store.updatePayment("a b&c", { status: "paid" });
  assert.match(capture[0]?.url ?? "", /order_id=eq\.a%20b%26c$/);
});
