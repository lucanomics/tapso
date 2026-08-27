import assert from "node:assert/strict";
import test from "node:test";

import {
  MILLION_SUPPORT_AMOUNT,
  readSupportAmountPolicy,
} from "../api/_lib/env.ts";

test("support policy includes the million-won easter egg by default", () => {
  const policy = readSupportAmountPolicy({});

  assert.deepEqual(policy.presetAmounts, [3000, 5000, 10000, MILLION_SUPPORT_AMOUNT]);
  assert.equal(policy.maxAmount, MILLION_SUPPORT_AMOUNT);
});

test("legacy preset and max env values cannot make the million-won button invalid", () => {
  const policy = readSupportAmountPolicy({
    SUPPORT_PRESET_AMOUNTS: "3000,5000,10000",
    SUPPORT_MAX_AMOUNT: "100000",
  });

  assert.deepEqual(policy.presetAmounts, [3000, 5000, 10000, MILLION_SUPPORT_AMOUNT]);
  assert.equal(policy.maxAmount, MILLION_SUPPORT_AMOUNT);
});

test("an operator can still raise the maximum above the easter-egg amount", () => {
  const policy = readSupportAmountPolicy({
    SUPPORT_PRESET_AMOUNTS: "5000,3000000",
    SUPPORT_MAX_AMOUNT: "3000000",
  });

  assert.deepEqual(policy.presetAmounts, [5000, MILLION_SUPPORT_AMOUNT, 3000000]);
  assert.equal(policy.maxAmount, 3000000);
});
