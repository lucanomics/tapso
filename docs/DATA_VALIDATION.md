# Transit data validation

## Current evidence

| Question | Result |
|---|---|
| Official base URL and route/stop/realtime paths | `VERIFIED_FROM_SWAGGER` |
| API rejects a missing service key | `VERIFIED` |
| Jeju standard region code accepted in live calls | `UNVERIFIED` |
| Jeju routes and stops returned | `BLOCKED_BY_CREDENTIALS` |
| Vehicle ID stable across observations | `UNVERIFIED` |
| Stop ordering and opposite direction distinguishable | `UNVERIFIED` |
| Branch/variant semantics | `UNVERIFIED` |
| Real polling cadence and dropout distribution | `UNVERIFIED` |
| Enough evidence for automatic vehicle matching | `UNVERIFIED` |

## Credentialed spike procedure

1. Obtain an approved key for resource 15157601 and keep it only in the environment.
2. Choose at least three Jeju routes: simple bidirectional, high-frequency, and a branch/variant if one exists.
3. Run `scripts/transit-spike/run.ts` every few seconds for at least a complete trip, while respecting quota and terms.
4. Record raw collection time separately from provider `gthrDt`.
5. Measure identifier continuity, position monotonicity, stop sequence, direction, event codes, timestamp skew, cadence, duplicates, and missing intervals.
6. Corroborate route order against the official Jeju passenger interface and an actual ride.
7. Redact and add only representative, legally permitted fixtures; label provenance accurately.

## Acceptance gate for real mode

Do not enable automatic matching for passengers until at least 30 observed boardings across multiple routes demonstrate a clear candidate margin, no silent direction reversal, and bounded stale-data behavior. Any unknown event code or route variant must fail closed.
