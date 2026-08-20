# Device test plan

## Matrix

- Dynamic Island iPhone on the minimum supported iOS and current stable iOS.
- Non-Island iPhone for Lock Screen-only behavior.
- Korean and English; largest accessibility text; light/dark mode; VoiceOver; Reduce Motion.
- Wi-Fi, cellular, offline, background, locked, Low Power Mode, app termination, and device restart.

## Ride cases

1. Start at 8 stops and verify request success, route/destination, and initial freshness.
2. Drive 8 → 3; ensure monotonic count and compact/minimal/expanded layouts.
3. Verify two-stop prepare, one-stop next destination, arrival, and activity end/dismissal.
4. Inject duplicate, out-of-order, stale, missing, wrong-direction, ambiguous, and disappearance inputs.
5. Disable Live Activities and confirm honest in-app fallback.
6. Rotate push token and confirm the server replaces it without logging full token data.
7. Measure update latency, dropped pushes, CPU, network bytes, and battery during a full representative ride.

## Pass criteria

- No false confident arrival or silent vehicle switch.
- State is understandable without color and all actionable controls have meaningful VoiceOver output.
- Dynamic Island regions do not truncate the critical number/destination at supported text sizes.
- APNs and local updates are idempotent; stale data is visible within the configured threshold.

Current result: simulator app build and launch are verified; this physical-device matrix is `UNVERIFIED`.
