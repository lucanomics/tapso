import type { RouteRequest, StopOnRoute, VehicleObservation } from "./domain.ts";
import type { TransitProvider } from "./provider.ts";

export class MockTransitProvider implements TransitProvider {
  constructor(
    private readonly stopFixtures: StopOnRoute[],
    private readonly vehicleFixtures: VehicleObservation[],
  ) {}

  async stops(_request: RouteRequest): Promise<StopOnRoute[]> {
    return structuredClone(this.stopFixtures);
  }

  async vehicles(request: RouteRequest): Promise<VehicleObservation[]> {
    return structuredClone(this.vehicleFixtures.filter((vehicle) => vehicle.routeId === request.routeId));
  }
}
