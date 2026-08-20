import type { MatchRequest, MatchResult, RankedCandidate, VehicleObservation } from "./domain.ts";

const MAX_AGE_SECONDS = 90;
const AMBIGUITY_MARGIN = 12;

export function matchVehicle(request: MatchRequest): MatchResult {
  const now = new Date(request.now).valueOf();
  const ranked = request.candidates
    .map((candidate) => rank(candidate, request, now))
    .sort((left, right) => right.score - left.score);
  const eligible = ranked.filter((candidate) => candidate.rejectedReasons.length === 0);

  if (eligible.length === 0) {
    return {
      status: "unavailable",
      confidence: "unknown",
      ranked,
      explanation: "No fresh candidate agrees with route, direction, and boarding position.",
    };
  }

  const best = eligible[0];
  const runnerUp = eligible[1];
  if (runnerUp && best.score - runnerUp.score < AMBIGUITY_MARGIN) {
    return {
      status: "ambiguous",
      confidence: "low",
      ranked,
      explanation: "The leading candidates are too close; automatic tracking is withheld.",
    };
  }

  return {
    status: "matched",
    confidence: best.score >= 75 ? "high" : "medium",
    selectedVehicleId: best.vehicleId,
    ranked,
    explanation: "A single fresh candidate has a sufficient evidence margin.",
  };
}

function rank(candidate: VehicleObservation, request: MatchRequest, now: number): RankedCandidate {
  let score = 0;
  const evidence: string[] = [];
  const rejectedReasons: string[] = [];
  if (candidate.routeId !== request.routeId) rejectedReasons.push("wrong_route");
  else {
    score += 30;
    evidence.push("route_id");
  }

  if (request.directionCode && candidate.directionCode !== request.directionCode) {
    rejectedReasons.push("wrong_direction");
  } else if (request.directionCode) {
    score += 25;
    evidence.push("direction");
  }

  const ageSeconds = (now - new Date(candidate.observedAt).valueOf()) / 1_000;
  if (!Number.isFinite(ageSeconds) || ageSeconds < -10 || ageSeconds > MAX_AGE_SECONDS) {
    rejectedReasons.push("stale_or_invalid_timestamp");
  } else {
    score += Math.max(0, 25 - ageSeconds / 6);
    evidence.push("fresh_observation");
  }

  if (candidate.stopSequence === undefined) {
    evidence.push("position_missing");
  } else {
    const distance = Math.abs(candidate.stopSequence - request.boardingStopSequence);
    score += Math.max(0, 20 - distance * 5);
    evidence.push(`boarding_distance_${distance}`);
    if (distance > 4) rejectedReasons.push("implausible_boarding_position");
  }

  return { vehicleId: candidate.vehicleId, score: Math.round(score * 10) / 10, evidence, rejectedReasons };
}
