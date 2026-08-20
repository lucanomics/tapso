import test from "node:test";
import assert from "node:assert/strict";
import { PublicDataUltraPrecisionProvider } from "../src/publicDataProvider.ts";
import { ProviderConfigurationError } from "../src/provider.ts";

test("requires credentials before making a live request", async () => {
  const provider = new PublicDataUltraPrecisionProvider({ serviceKey: "" });
  await assert.rejects(
    provider.vehicles({ routeId: "route-201", standardRegionCode: "50110" }),
    ProviderConfigurationError,
  );
});

test("normalizes an official-schema realtime item", async () => {
  const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({
    response: {
      header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
      body: { items: { item: [{
        vhclNo: "JEJU-123", rteId: "route-201", gthrDt: "20260820120000",
        lat: "33.499", lot: "126.531", oprDrct: "1", oprSpd: "31", evtCd: "1",
      }] } },
    },
  }), { status: 200 });
  const provider = new PublicDataUltraPrecisionProvider({ serviceKey: "test-key", fetchImplementation: fakeFetch });
  const vehicles = await provider.vehicles({ routeId: "route-201", standardRegionCode: "50110" });
  assert.equal(vehicles[0].vehicleId, "JEJU-123");
  assert.equal(vehicles[0].latitude, 33.499);
  assert.equal(vehicles[0].observedAt, "2026-08-20T12:00:00+09:00");
});
