import test from "node:test";
import assert from "node:assert/strict";
import { matchVehicle } from "../src/matching.ts";

const now = "2026-08-20T03:00:00.000Z";

test("selects one fresh route and direction candidate", () => {
  const result = matchVehicle({
    routeId: "route-201",
    boardingStopSequence: 10,
    directionCode: "1",
    now,
    candidates: [
      { vehicleId: "correct", routeId: "route-201", directionCode: "1", stopSequence: 10, observedAt: now },
      { vehicleId: "wrong", routeId: "route-201", directionCode: "2", stopSequence: 10, observedAt: now },
    ],
  });
  assert.equal(result.status, "matched");
  assert.equal(result.selectedVehicleId, "correct");
});

test("fails closed when candidates are tied", () => {
  const candidates = ["bus-a", "bus-b"].map((vehicleId) => ({
    vehicleId, routeId: "route-201", directionCode: "1", stopSequence: 10, observedAt: now,
  }));
  const result = matchVehicle({ routeId: "route-201", boardingStopSequence: 10, directionCode: "1", now, candidates });
  assert.equal(result.status, "ambiguous");
  assert.equal(result.selectedVehicleId, undefined);
});

test("rejects stale candidates", () => {
  const result = matchVehicle({
    routeId: "route-201",
    boardingStopSequence: 10,
    directionCode: "1",
    now,
    candidates: [{
      vehicleId: "stale", routeId: "route-201", directionCode: "1", stopSequence: 10,
      observedAt: "2026-08-20T02:55:00.000Z",
    }],
  });
  assert.equal(result.status, "unavailable");
  assert.deepEqual(result.ranked[0].rejectedReasons, ["stale_or_invalid_timestamp"]);
});
