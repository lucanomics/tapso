# Product requirements

## Outcome

TAPSO helps a passenger board a chosen bus and get off at the intended stop without continuously watching a phone. The promise is deliberately narrow: **타고. 앱을 닫고. 제때 내리세요.**

## MVP journey

1. Passenger chooses boarding stop, route, and destination stop.
2. TAPSO ranks currently observed physical vehicles and explains its evidence.
3. A confident result begins tracking; ambiguity requires confirmation instead of a guess.
4. The main app may close. Lock Screen and Dynamic Island show route, destination, freshness, and remaining stops.
5. At two stops, one stop, and arrival the information hierarchy becomes progressively stronger.
6. Arrival or an explicit finish ends the session and Live Activity.

## Functional requirements

- Native iOS app using SwiftUI, ActivityKit, and WidgetKit.
- UI-independent transit core with stable identifiers and deterministic tests.
- Explainable matching that fails closed on wrong route/direction, stale data, or ambiguity.
- Remaining-stop calculation based on route order and the tracked vehicle.
- Journey states for setup, matching, confirmation, active, approaching, next stop, arrived, degraded, and ended.
- Korean and English localization resources.
- Deterministic 8 → 0 demo using real production paths.
- Server boundary protecting government and APNs secrets.

## Non-goals for the first slice

- General navigation or map replacement.
- Continuous passenger GPS tracking.
- Full place-to-place trip planning, payments, social features, accounts, or a large settings surface.
- Claims of live Jeju reliability before credentialed, repeated field validation.

## Success measures

- A user can understand route, destination, remaining stops, and data freshness at a glance.
- No automatic vehicle selection occurs when the best two candidates lack a safe evidence margin.
- The same state models drive the in-app view and Live Activity.
- All deterministic tests and a simulator build pass.
- Real-data and credential blockers are visibly distinguished from completed work.
