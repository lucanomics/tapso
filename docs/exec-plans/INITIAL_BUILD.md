# TAPSO initial vertical slice

Status: IMPLEMENTED_WITH_EXTERNAL_BLOCKERS
Started: 2026-08-20 (Asia/Seoul)

## Objective

Build and verify the smallest end-to-end native TAPSO architecture: conservative physical-vehicle matching, stop progress, journey state, an 8 → 0 ActivityKit demo, and a server-side official provider boundary.

## Non-goals

General map navigation, accounts, payments, tourism content, Android, production hosting, and claiming live Jeju or physical-device behavior without evidence.

## Milestones

- [x] Inspect local Apple, Swift, Node, Git, browser, and simulator capabilities.
- [x] Verify current Apple ActivityKit constraints and official transit Swagger contract.
- [x] Implement and unit-test the framework-independent Swift transit core.
- [x] Generate a native SwiftUI app and WidgetKit Live Activity target.
- [x] Build, sign, install, launch, and inspect the simulator application.
- [x] Add TypeScript provider, matching, APNs boundaries, fixtures, and tests.
- [x] Write product, architecture, evidence, risk, device, and handoff docs.
- [ ] Validate real Jeju observations (`BLOCKED_BY_CREDENTIALS`).
- [ ] Validate remote ActivityKit pushes and physical devices (`BLOCKED_BY_CREDENTIALS`).

## Verified constraints

- Xcode 26.3, Swift 6.2.4, Node 24.14, and iOS simulators are present.
- Official resource 15157601 describes nationwide route, ordered-stop, and realtime vehicle-location data; authenticated Jeju behavior is still unknown.
- ActivityKit is available from iOS 16.1; this project chooses iOS 17 for a stable modern baseline.
- The workspace is FileProvider-managed, so sources must remain downloaded and signing output must use an unsynced DerivedData directory.

## Decisions

- Swift package is the client domain source of truth.
- Official DTOs stay server-side.
- Ambiguity fails closed and requests user confirmation.
- Synthetic fixtures are labeled; they are never claimed as captured Jeju data.
- No hosting/database choice before cadence and load evidence.

## Verification

```bash
swift test --package-path packages/transit-core
npm test --prefix services/api
xcodegen generate --spec apps/ios/project.yml --project apps/ios
xcodebuild -project apps/ios/Tapso.xcodeproj -scheme Tapso \
  -destination 'platform=iOS Simulator,name=iPhone 17' build test
```

## Risks

The largest risk is a confident wrong-vehicle selection caused by stale, branched, opposite-direction, or incomplete observations. Matching therefore rejects incompatibility and withholds selection when the top evidence margin is small.

## Exact next action

Obtain a public-data service key, select official Jeju route IDs, and collect a quota-respecting multi-poll trace with `scripts/transit-spike/run.ts`.
