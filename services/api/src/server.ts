import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { matchVehicle } from "./matching.ts";
import type { MatchRequest } from "./domain.ts";
import { PublicDataUltraPrecisionProvider } from "./publicDataProvider.ts";
import { logEvent } from "./observability.ts";

const provider = new PublicDataUltraPrecisionProvider();
const port = Number(process.env.PORT ?? 8787);

export const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      return json(response, 200, { ok: true, liveTransitConfigured: Boolean(process.env.PUBLIC_DATA_SERVICE_KEY) });
    }
    if (request.method === "POST" && request.url === "/v1/matches") {
      const payload = parseMatchRequest(await readJSON(request));
      logEvent("vehicle_candidates_found", { routeId: payload.routeId, candidateCount: payload.candidates.length });
      const result = matchVehicle(payload);
      const matchEvent = result.status !== "matched"
        ? "vehicle_match_confirmation_required"
        : result.confidence === "high" ? "vehicle_match_high_confidence" : "vehicle_match_selected";
      logEvent(
        matchEvent,
        {
          routeId: payload.routeId,
          status: result.status,
          confidence: result.confidence,
          selectedVehicleId: result.selectedVehicleId,
        },
      );
      return json(response, 200, result);
    }
    if (request.method === "GET" && request.url?.startsWith("/v1/vehicles")) {
      const url = new URL(request.url, "http://localhost");
      const routeId = url.searchParams.get("routeId");
      const standardRegionCode = url.searchParams.get("stdgCd");
      if (!routeId || !standardRegionCode) return json(response, 400, { error: "routeId and stdgCd are required" });
      return json(response, 200, { items: await provider.vehicles({ routeId, standardRegionCode }) });
    }
    return json(response, 404, { error: "not_found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "INTERNAL_ERROR";
    const status = code === "BLOCKED_BY_CREDENTIALS" ? 503 : code === "INVALID_INPUT" ? 400 : 500;
    return json(response, status, { error: code, message });
  }
});

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJSON(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (chunks.reduce((sum, chunk) => sum + chunk.length, 0) > 64 * 1024) throw new Error("request_too_large");
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function parseMatchRequest(value: unknown): MatchRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalidInput("JSON object required");
  const input = value as Record<string, unknown>;
  if (typeof input.routeId !== "string" || !input.routeId.trim()) throw invalidInput("routeId is required");
  if (typeof input.boardingStopSequence !== "number" || !Number.isInteger(input.boardingStopSequence)) {
    throw invalidInput("boardingStopSequence must be an integer");
  }
  if (typeof input.now !== "string" || Number.isNaN(new Date(input.now).valueOf())) throw invalidInput("now must be an ISO timestamp");
  if (!Array.isArray(input.candidates) || input.candidates.length > 500) throw invalidInput("candidates must be an array of at most 500 items");
  for (const candidate of input.candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw invalidInput("candidate must be an object");
    const record = candidate as Record<string, unknown>;
    if (typeof record.vehicleId !== "string" || typeof record.routeId !== "string" || typeof record.observedAt !== "string") {
      throw invalidInput("candidate vehicleId, routeId, and observedAt are required");
    }
  }
  return input as unknown as MatchRequest;
}

function invalidInput(message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code: "INVALID_INPUT" });
}

if (process.env.NODE_ENV !== "test") {
  server.listen(port, "127.0.0.1", () => console.info(`TAPSO API listening on http://127.0.0.1:${port}`));
}
