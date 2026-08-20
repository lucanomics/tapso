# Data sources

## Official nationwide ultra-precision bus API

Primary candidate: [Public Data Portal resource 15157601](https://www.data.go.kr/data/15157601/openapi.do). The portal describes JSON/XML bus route, route-stop, and real-time vehicle-location data, an automatic approval flow, and a development quota of 5,000 calls. The embedded Swagger inspected on 2026-08-20 exposes:

- Host: `https://apis.data.go.kr/B551982/rte`
- `GET /mst_info`: route master information.
- `GET /ps_info`: stops on a route.
- `GET /rtm_loc_info`: real-time vehicle locations.
- Common inputs: `serviceKey`, `pageNo`, `numOfRows`, `type`, `stdgCd`; route queries use `rteId`.
- Observed schema names include `rteId`, `rteNo`, `stopSeq` variants, `drcGbnCd`, `vhclNo`, `gthrDt`, `lat`, `lot`, `oprDrct`, `oprSpd`, `evtCd`, `evtType`, and `totDt`.

Calling without a key returns `SERVICE_KEY_IS_NULL` / reason code 20. Therefore actual Jeju coverage, stable identifiers, branch semantics, ordering accuracy, event meaning, update cadence, and disappearance behavior remain `BLOCKED_BY_CREDENTIALS` or `UNVERIFIED`.

## Jeju BIS

[Jeju Bus Information System](https://bus.jeju.go.kr/) visibly provides route search and real-time vehicle-location experiences. It is useful corroborating evidence of public passenger information, but no undocumented site endpoint is treated as a supported product API.

## Product reference

The Korean app Jihaseom was inspected only for the product principle of tracking transit vehicles without continuous passenger GPS and surfacing remaining stops on Lock Screen/Dynamic Island. TAPSO does not copy its branding, assets, layout, or implementation.

## Rules

- Government-specific DTOs stop at `services/api/src/publicDataProvider.ts`.
- Fixture files in this repository are synthetic and say so in-band.
- Capture provenance, time, request parameters, and schema version before storing any future sanitized real fixture.
- Never commit service keys or raw data that contains unnecessary identifiers.
