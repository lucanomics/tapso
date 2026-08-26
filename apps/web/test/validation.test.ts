import test from "node:test";
import assert from "node:assert/strict";
import {
  isRiderType,
  isValidEmail,
  normalizeEmail,
  parseSupportAmount,
  parseWaitlistRequest,
} from "../api/_lib/validation.ts";

const valid = {
  email: "Hello@Example.com",
  riderType: "resident",
  privacyConsent: true,
  formRenderedAt: 1_700_000_000_000,
};

test("normalizes case but preserves sub-addressing", () => {
  assert.equal(normalizeEmail("  Hello@Example.COM "), "hello@example.com");
  assert.equal(normalizeEmail("rider+jeju@example.com"), "rider+jeju@example.com");
});

test("accepts ordinary addresses", () => {
  for (const email of ["a@b.co", "rider.kim@mail.example.com", "rider+365@example.co.kr"]) {
    assert.equal(isValidEmail(email), true, email);
  }
});

test("rejects malformed addresses", () => {
  for (const email of ["", "rider", "rider@", "@example.com", "a b@example.com", "a@example", "a@@b.com", "a@b..com"]) {
    assert.equal(isValidEmail(email), false, email);
  }
});

test("rejects an address past the 254 character limit", () => {
  assert.equal(isValidEmail(`${"a".repeat(250)}@example.com`), false);
});

test("rider type is an allowlist, not any string", () => {
  assert.equal(isRiderType("resident"), true);
  assert.equal(isRiderType("제주 도민"), false);
  assert.equal(isRiderType("__proto__"), false);
  assert.equal(isRiderType(undefined), false);
});

test("parses a well formed request", () => {
  const result = parseWaitlistRequest(valid);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.emailNormalized, "hello@example.com");
  assert.equal(result.value.email, "Hello@Example.com");
  assert.equal(result.value.honeypotFilled, false);
});

test("names the offending field", () => {
  assert.deepEqual(parseWaitlistRequest(null), { ok: false, field: "body" });
  assert.deepEqual(parseWaitlistRequest([valid]), { ok: false, field: "body" });
  assert.deepEqual(parseWaitlistRequest({ ...valid, email: "nope" }), { ok: false, field: "email" });
  assert.deepEqual(parseWaitlistRequest({ ...valid, riderType: "pilot" }), {
    ok: false,
    field: "riderType",
  });
});

test("consent must be literally true", () => {
  for (const consent of [undefined, false, "true", 1, "yes"]) {
    assert.deepEqual(parseWaitlistRequest({ ...valid, privacyConsent: consent }), {
      ok: false,
      field: "privacyConsent",
    });
  }
});

test("reports a filled honeypot", () => {
  const result = parseWaitlistRequest({ ...valid, company: "Acme" });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.honeypotFilled, true);
});

test("unexpected properties are dropped rather than stored", () => {
  const result = parseWaitlistRequest({ ...valid, status: "admin", id: "1", isAdmin: true });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(Object.keys(result.value).sort(), [
    "email",
    "emailNormalized",
    "formRenderedAt",
    "honeypotFilled",
    "riderType",
  ]);
});

test("support amount must be a whole number inside the policy range", () => {
  const policy = { minAmount: 1000, maxAmount: 100000 };
  assert.equal(parseSupportAmount(5000, policy), 5000);
  assert.equal(parseSupportAmount(999, policy), undefined);
  assert.equal(parseSupportAmount(100001, policy), undefined);
  assert.equal(parseSupportAmount(1500.5, policy), undefined);
  assert.equal(parseSupportAmount("5000", policy), undefined);
  assert.equal(parseSupportAmount(-5000, policy), undefined);
  assert.equal(parseSupportAmount(Number.NaN, policy), undefined);
});
