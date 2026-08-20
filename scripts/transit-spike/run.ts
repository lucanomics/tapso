import { PublicDataUltraPrecisionProvider } from "../../services/api/src/publicDataProvider.ts";

const routeId = process.argv[2];
const standardRegionCode = process.argv[3] ?? "50110";
if (!routeId) {
  console.error("Usage: node --experimental-strip-types scripts/transit-spike/run.ts <routeId> [stdgCd]");
  process.exit(2);
}

try {
  const provider = new PublicDataUltraPrecisionProvider();
  const [stops, vehicles] = await Promise.all([
    provider.stops({ routeId, standardRegionCode }),
    provider.vehicles({ routeId, standardRegionCode }),
  ]);
  console.log(JSON.stringify({ capturedAt: new Date().toISOString(), routeId, standardRegionCode, stops, vehicles }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
