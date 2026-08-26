import test from "node:test";
import assert from "node:assert/strict";
import { registerWaitlistEntry, type RegisterDependencies } from "../api/_lib/waitlist.ts";
import { createBurstLimiter } from "../api/_lib/rateLimit.ts";
import { createFakeEmail, createFakeStore, type FakeEmail, type FakeStore } from "./fakes.ts";

const NOW = new Date("2026-08-26T01:00:00.000Z");

const policy = {
  burstLimit: 3,
  burstWindowSeconds: 60,
  sustainedLimit: 8,
  sustainedWindowSeconds: 3600,
  minimumFillMilliseconds: 1200,
};

function body(overrides: Record<string, unknown> = {}) {
  return {
    email: "Rider@Example.com",
    riderType: "resident",
    privacyConsent: true,
    formRenderedAt: NOW.getTime() - 5000,
    ...overrides,
  };
}

function deps(store?: FakeStore, email?: FakeEmail, ip = "203.0.113.7"): RegisterDependencies {
  return {
    store,
    email,
    burstLimiter: createBurstLimiter(policy.burstLimit, policy.burstWindowSeconds),
    policy,
    privacyConsentVersion: "2026-08-26",
    clientIp: ip,
    source: "web",
    now: () => NOW,
  };
}

test("a valid registration is persisted and confirmed", async () => {
  const store = createFakeStore();
  const email = createFakeEmail();
  const result = await registerWaitlistEntry(body(), deps(store, email));

  assert.deepEqual(result.response, { status: "created", emailDelivery: "sent" });
  assert.equal(result.httpStatus, 201);

  const stored = store.entries.get("rider@example.com");
  assert.ok(stored, "row must exist under the normalized address");
  assert.equal(stored.email, "Rider@Example.com");
  assert.equal(stored.riderType, "resident");
  assert.equal(stored.privacyConsentVersion, "2026-08-26");
  assert.equal(stored.privacyConsentAt, NOW.toISOString());
  assert.equal(stored.emailState, "sent");
  assert.equal(email.sent.length, 1);
  assert.equal(email.sent[0]?.to, "Rider@Example.com");
});

test("a duplicate address is reported kindly and inserts nothing new", async () => {
  const store = createFakeStore();
  const email = createFakeEmail();
  await registerWaitlistEntry(body(), deps(store, email));

  // Different casing and whitespace, same mailbox.
  const second = await registerWaitlistEntry(
    body({ email: "  RIDER@example.com " }),
    deps(store, email),
  );

  assert.deepEqual(second.response, { status: "already_registered" });
  assert.equal(second.httpStatus, 200);
  assert.equal(store.entries.size, 1);
  assert.equal(email.sent.length, 1, "a duplicate must not resend the confirmation");
});

test("a malformed email is rejected before any storage call", async () => {
  const store = createFakeStore();
  const result = await registerWaitlistEntry(body({ email: "not-an-email" }), deps(store));

  assert.deepEqual(result.response, { status: "invalid_request", field: "email" });
  assert.equal(result.httpStatus, 400);
  assert.equal(store.entries.size, 0);
  assert.equal(store.rateLimitCalls.length, 0);
});

test("an unknown rider type is rejected", async () => {
  const result = await registerWaitlistEntry(
    body({ riderType: "helicopter" }),
    deps(createFakeStore()),
  );
  assert.deepEqual(result.response, { status: "invalid_request", field: "riderType" });
});

test("missing consent is rejected", async () => {
  const result = await registerWaitlistEntry(
    body({ privacyConsent: undefined }),
    deps(createFakeStore()),
  );
  assert.deepEqual(result.response, { status: "invalid_request", field: "privacyConsent" });
});

test("a filled honeypot is refused, never silently accepted", async () => {
  const store = createFakeStore();
  const result = await registerWaitlistEntry(body({ company: "Acme" }), deps(store));

  assert.equal(result.response.status, "rate_limited");
  assert.equal(result.httpStatus, 429);
  assert.equal(store.entries.size, 0);
});

test("an instant submission is refused", async () => {
  const store = createFakeStore();
  const result = await registerWaitlistEntry(
    body({ formRenderedAt: NOW.getTime() - 100 }),
    deps(store),
  );

  assert.equal(result.response.status, "rate_limited");
  assert.equal(store.entries.size, 0);
});

test("the in-process burst limiter stops a loop from one address", async () => {
  const store = createFakeStore();
  const shared = deps(store, createFakeEmail());

  for (let attempt = 0; attempt < policy.burstLimit; attempt += 1) {
    const allowed = await registerWaitlistEntry(body({ email: `a${attempt}@example.com` }), shared);
    assert.equal(allowed.response.status, "created", `attempt ${attempt}`);
  }

  const blocked = await registerWaitlistEntry(body({ email: "over@example.com" }), shared);
  assert.equal(blocked.response.status, "rate_limited");
  assert.equal(blocked.httpStatus, 429);
  if (blocked.response.status === "rate_limited") {
    assert.ok(blocked.response.retryAfterSeconds > 0);
  }
});

test("the durable limiter can reject even when the burst gate passes", async () => {
  const store = createFakeStore({ rateLimit: { allowed: false, retryAfterSeconds: 900 } });
  const result = await registerWaitlistEntry(body(), deps(store, createFakeEmail()));

  assert.deepEqual(result.response, { status: "rate_limited", retryAfterSeconds: 900 });
  assert.equal(store.entries.size, 0);
});

test("a rate-limiter outage does not take the waitlist down with it", async () => {
  const store = createFakeStore();
  store.failRateLimit = "rpc unavailable";

  const result = await registerWaitlistEntry(body(), deps(store, createFakeEmail()));
  assert.equal(result.response.status, "created");
});

test("a storage failure reports unavailable and never claims success", async () => {
  const store = createFakeStore();
  store.failNextInsert = "connection refused";

  const result = await registerWaitlistEntry(body(), deps(store, createFakeEmail()));
  assert.deepEqual(result.response, { status: "unavailable" });
  assert.equal(result.httpStatus, 503);
});

test("an unprovisioned store fails closed", async () => {
  const result = await registerWaitlistEntry(body(), deps(undefined, createFakeEmail()));
  assert.deepEqual(result.response, { status: "unavailable" });
  assert.equal(result.httpStatus, 503);
});

test("an email failure keeps the registration and downgrades to deferred", async () => {
  const store = createFakeStore();
  const email = createFakeEmail();
  email.failWith = "resend_http_429";

  const result = await registerWaitlistEntry(body(), deps(store, email));

  assert.deepEqual(result.response, { status: "created", emailDelivery: "deferred" });
  assert.equal(result.httpStatus, 201);

  const stored = store.entries.get("rider@example.com");
  assert.ok(stored, "the row must survive an email outage");
  assert.equal(stored.emailState, "failed");
  assert.equal(stored.emailError, "resend_http_429");
});

test("an unconfigured email transport still registers the visitor", async () => {
  const store = createFakeStore();
  const result = await registerWaitlistEntry(body(), deps(store, undefined));

  assert.deepEqual(result.response, { status: "created", emailDelivery: "deferred" });
  assert.equal(store.entries.get("rider@example.com")?.emailState, "failed");
});

test("a retry after a successful insert does not create a second row", async () => {
  const store = createFakeStore();
  const email = createFakeEmail();
  const shared = deps(store, email);

  const first = await registerWaitlistEntry(body(), shared);
  const retry = await registerWaitlistEntry(body(), shared);

  assert.equal(first.response.status, "created");
  assert.equal(retry.response.status, "already_registered");
  assert.equal(store.entries.size, 1);
});
