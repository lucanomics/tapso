import test from "node:test";
import assert from "node:assert/strict";
import { createBurstLimiter, enforceRateLimit } from "../api/_lib/rateLimit.ts";
import type { RateLimitStore } from "../api/_lib/store.ts";

const check = {
  bucket: "waitlist:203.0.113.7",
  burst: { limit: 2, windowSeconds: 60 },
  sustained: { limit: 5, windowSeconds: 3600 },
};

const noop = () => {};

test("the burst window allows exactly the configured number of hits", () => {
  const limiter = createBurstLimiter(2, 60);
  const base = 1_700_000_000_000;

  assert.equal(limiter.consume("a", base).allowed, true);
  assert.equal(limiter.consume("a", base + 10).allowed, true);
  assert.equal(limiter.consume("a", base + 20).allowed, false);
  // A different bucket keeps its own budget.
  assert.equal(limiter.consume("b", base + 20).allowed, true);
});

test("the counter resets when the window rolls over", () => {
  const limiter = createBurstLimiter(1, 60);
  const base = 1_700_000_040_000;

  assert.equal(limiter.consume("a", base).allowed, true);
  assert.equal(limiter.consume("a", base + 1000).allowed, false);
  assert.equal(limiter.consume("a", base + 60_000).allowed, true);
});

test("retryAfter counts down to the end of the current window", () => {
  const limiter = createBurstLimiter(1, 60);
  const windowStart = 1_700_000_040_000;

  limiter.consume("a", windowStart);
  const blocked = limiter.consume("a", windowStart + 20_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 40);
});

test("the durable limiter is not consulted once the burst gate rejects", async () => {
  const limiter = createBurstLimiter(1, 60);
  let calls = 0;
  const store: RateLimitStore = {
    async consume() {
      calls += 1;
      return { allowed: true, retryAfterSeconds: 60 };
    },
  };

  await enforceRateLimit(check, limiter, store, noop);
  const blocked = await enforceRateLimit(check, limiter, store, noop);

  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) assert.equal(blocked.layer, "burst");
  assert.equal(calls, 1);
});

test("the durable limiter can reject on its own", async () => {
  const store: RateLimitStore = {
    async consume() {
      return { allowed: false, retryAfterSeconds: 1800 };
    },
  };

  const decision = await enforceRateLimit(check, createBurstLimiter(10, 60), store, noop);
  assert.equal(decision.allowed, false);
  if (!decision.allowed) {
    assert.equal(decision.layer, "sustained");
    assert.equal(decision.retryAfterSeconds, 1800);
  }
});

test("the durable bucket carries its window so two windows cannot collide", async () => {
  const seen: string[] = [];
  const store: RateLimitStore = {
    async consume(bucket) {
      seen.push(bucket);
      return { allowed: true, retryAfterSeconds: 60 };
    },
  };

  await enforceRateLimit(check, createBurstLimiter(10, 60), store, noop);
  assert.deepEqual(seen, ["waitlist:203.0.113.7:3600"]);
});

test("a limiter outage fails open and is reported", async () => {
  const messages: string[] = [];
  const store: RateLimitStore = {
    async consume() {
      throw new Error("rpc unavailable");
    },
  };

  const decision = await enforceRateLimit(check, createBurstLimiter(10, 60), store, (message) =>
    messages.push(message),
  );

  assert.equal(decision.allowed, true);
  assert.deepEqual(messages, ["rpc unavailable"]);
});

test("without a durable store only the burst gate applies", async () => {
  const decision = await enforceRateLimit(check, createBurstLimiter(10, 60), undefined, noop);
  assert.equal(decision.allowed, true);
});
