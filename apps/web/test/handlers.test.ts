import test from "node:test";
import assert from "node:assert/strict";
import { clientIp, guarded, readJsonBody, MAX_BODY_BYTES } from "../api/_lib/http.ts";
import { POST as waitlistPost, GET as waitlistGet } from "../api/waitlist.ts";
import { GET as supportConfigGet, POST as supportConfigPost } from "../api/support/config.ts";
import { POST as supportIntentPost } from "../api/support/intent.ts";
import { POST as supportConfirmPost } from "../api/support/confirm.ts";
import { POST as supportWebhookPost } from "../api/support/webhook.ts";

/**
 * These exercise the deployed handlers with real `Request` objects. No provider
 * environment variables are set here, which is exactly the state a fresh
 * deployment is in, so every endpoint must fail closed rather than pretend.
 */

function post(url: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  email: "rider@example.com",
  riderType: "resident",
  privacyConsent: true,
  formRenderedAt: Date.now() - 10_000,
};

test("a body without a JSON content type is rejected", async () => {
  const request = new Request("https://tapso.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify(validBody),
  });
  const result = await readJsonBody(request);
  assert.deepEqual(result, { ok: false, reason: "malformed" });
});

test("an oversized body is rejected before it is parsed", async () => {
  const huge = JSON.stringify({ email: "a".repeat(MAX_BODY_BYTES + 100) });
  const result = await readJsonBody(post("https://tapso.test/api/waitlist", huge));
  assert.deepEqual(result, { ok: false, reason: "too_large" });
});

test("invalid JSON is rejected", async () => {
  const result = await readJsonBody(post("https://tapso.test/api/waitlist", "{not json"));
  assert.deepEqual(result, { ok: false, reason: "malformed" });
});

test("the client address prefers x-real-ip and falls back to the first forwarded hop", () => {
  const headers = (init: Record<string, string>) =>
    new Request("https://tapso.test/api/waitlist", { headers: init });

  assert.equal(clientIp(headers({ "x-real-ip": "203.0.113.7" })), "203.0.113.7");
  assert.equal(
    clientIp(headers({ "x-forwarded-for": "203.0.113.7, 70.41.3.18" })),
    "203.0.113.7",
  );
  assert.equal(clientIp(headers({})), "unknown");
});

test("an unexpected throw becomes a generic 500 with no internal detail", async () => {
  const handler = guarded("test", async () => {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY=super-secret is invalid");
  });

  const response = await handler(new Request("https://tapso.test/x"));
  const body = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 500);
  assert.deepEqual(body, { status: "internal_error" });
});

test("GET /api/waitlist is not allowed", async () => {
  const response = waitlistGet();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

test("POST /api/waitlist fails closed when no database is provisioned", async () => {
  const response = await waitlistPost(
    post("https://tapso.test/api/waitlist", validBody, { "x-real-ip": "198.51.100.1" }),
  );
  const body = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 503);
  assert.deepEqual(body, { status: "unavailable" });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("POST /api/waitlist rejects a bad payload with 400 and names the field", async () => {
  const response = await waitlistPost(
    post(
      "https://tapso.test/api/waitlist",
      { ...validBody, email: "nope" },
      { "x-real-ip": "198.51.100.2" },
    ),
  );
  const body = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 400);
  assert.deepEqual(body, { status: "invalid_request", field: "email" });
});

test("POST /api/waitlist rejects an oversized body with 413", async () => {
  const response = await waitlistPost(
    post("https://tapso.test/api/waitlist", "x".repeat(MAX_BODY_BYTES + 10)),
  );
  assert.equal(response.status, 413);
});

test("GET /api/support/config reports unavailable and withholds any client key", async () => {
  const response = await supportConfigGet(new Request("https://tapso.test/api/support/config"));
  const body = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 200);
  assert.equal(body.mode, "unavailable");
  assert.equal(body.clientKey, undefined);
  assert.equal(body.currency, "KRW");
  assert.deepEqual(body.presetAmounts, [3000, 5000, 10000]);
});

test("POST /api/support/config is not allowed", () => {
  assert.equal(supportConfigPost().status, 405);
});

test("support endpoints refuse to act while payment is unconfigured", async () => {
  const intent = await supportIntentPost(post("https://tapso.test/api/support/intent", { amount: 5000 }));
  assert.equal(intent.status, 503);
  assert.deepEqual(await intent.json(), { status: "unavailable" });

  const confirm = await supportConfirmPost(
    post("https://tapso.test/api/support/confirm", { orderId: "o", paymentKey: "k", amount: 5000 }),
  );
  assert.equal(confirm.status, 503);

  const webhook = await supportWebhookPost(
    post("https://tapso.test/api/support/webhook", {
      eventType: "PAYMENT_STATUS_CHANGED",
      data: { paymentKey: "pay_abc", status: "DONE" },
    }),
  );
  assert.equal(webhook.status, 503);
  assert.deepEqual(await webhook.json(), { received: false });
});
