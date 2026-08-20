export type Direction = "outbound" | "inbound";

export interface RouteRequest {
  routeId: string;
  standardRegionCode: string;
}

export interface StopOnRoute {
  stopId: string;
  name: string;
  sequence: number;
  directionCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface VehicleObservation {
  vehicleId: string;
  routeId: string;
  observedAt: string;
  stopSequence?: number;
  directionCode?: string;
  latitude?: number;
  longitude?: number;
  speedKph?: number;
  eventCode?: string;
}

export interface MatchRequest {
  routeId: string;
  boardingStopSequence: number;
  directionCode?: string;
  now: string;
  candidates: VehicleObservation[];
}

export interface RankedCandidate {
  vehicleId: string;
  score: number;
  evidence: string[];
  rejectedReasons: string[];
}

export interface MatchResult {
  status: "matched" | "ambiguous" | "unavailable";
  confidence: "high" | "medium" | "low" | "unknown";
  selectedVehicleId?: string;
  ranked: RankedCandidate[];
  explanation: string;
}
