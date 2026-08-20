import type { RouteRequest, StopOnRoute, VehicleObservation } from "./domain.ts";

export interface TransitProvider {
  stops(request: RouteRequest): Promise<StopOnRoute[]>;
  vehicles(request: RouteRequest): Promise<VehicleObservation[]>;
}

export class ProviderConfigurationError extends Error {
  readonly code = "BLOCKED_BY_CREDENTIALS";
}

export class ProviderResponseError extends Error {
  readonly code = "PROVIDER_RESPONSE_INVALID";
}
