# TAPSO initial vertical slice

Status: IMPLEMENTED_WITH_EXTERNAL_BLOCKERS
Started: 2026-08-20 (Asia/Seoul)

## Objective

Build and verify the smallest end-to-end native TAPSO architecture: conservative physical-vehicle matching, stop progress, journey state, a Dynamic-Island-first 8 → 0 ActivityKit demo, a server-side official provider boundary, and a distributable internal TestFlight demo.

## Non-goals

General map navigation, accounts, payments, tourism content, Android, production hosting, and claiming live Jeju or physical-device behavior without evidence.

## Milestones

- [x] Inspect local Apple, Swift, Node, Git, browser, and simulator capabilities.
- [x] Verify current Apple ActivityKit constraints and official transit Swagger contract.
- [x] Implement and unit-test the framework-independent Swift transit core.
- [x] Generate a native SwiftUI app and WidgetKit Live Activity target.
- [x] Build, sign, install, launch, and inspect the simulator application.
- [x] Research 지하섬's public App Store experience and current primary-source ActivityKit behavior.
- [x] Implement and visually verify state-adaptive compact, minimal, expanded, and Lock Screen surfaces at 8/2/1/0 stops.
- [x] Add stale/relevance policy, one-shot important alerts, duplicate-activity cleanup, and relaunch reattachment.
- [x] Fail closed on inconsistent phase/count/freshness signals, add deterministic suppression tests, and surface a distinct checking state.
- [x] Refine app and Island proportions with compact route badges, scaled rounded numerals, friendly squircle glyphs, and a connectivity/match-confidence trust strip.
- [x] Add an original Jeju visual layer to every Island size: a state-reactive basalt buddy, tangerine route/destination markers, sea-foam waves, and warm 제주-breeze copy.
- [x] Make the unexpanded Island a complete glanceable experience with a mini journey gauge, basalt route companion, action-state pills, and a discoverable touch-and-hold accessibility hint.
- [x] Add TypeScript provider, matching, APNs boundaries, fixtures, and tests.
- [x] Write product, architecture, evidence, risk, device, and handoff docs.
- [x] Add the final app icon, coherent release versioning, and distribution metadata.
- [ ] Produce and validate a signed App Store archive.
- [ ] Upload the processed build and distribute it to an internal TestFlight group.
- [ ] Validate real Jeju observations (`BLOCKED_BY_CREDENTIALS`).
- [ ] Validate remote ActivityKit pushes and physical devices (`BLOCKED_BY_CREDENTIALS`).

## Verified constraints

- Xcode 26.3, Swift 6.2.4, Node 24.14, and iOS simulators are present.
- Official resource 15157601 describes nationwide route, ordered-stop, and realtime vehicle-location data; authenticated Jeju behavior is still unknown.
- ActivityKit is available from iOS 16.1; this project chooses iOS 17 for a stable modern baseline.
- iOS 26.3 iPhone 17 Pro Simulator renders the compact 8/2/1/0 states, expanded Island, and Lock Screen card. Eight iOS tests pass, including fail-closed phase/freshness behavior and the 4 KB payload guard.
- The workspace is FileProvider-managed, so sources must remain downloaded and signing output must use an unsynced DerivedData directory.
- An unsigned generic-device Release archive succeeds and embeds the Live Activity extension. App Store signing and upload remain unverified until Apple account access is established.
- The TestFlight-ready archive compiles as version `0.1.0 (1)`, contains the 1024×1024 AppIcon rendition, uses `com.lucanomics.tapso`, and embeds `com.lucanomics.tapso.LiveActivity`.

## Decisions

- Swift package is the client domain source of truth.
- Official DTOs stay server-side.
- Ambiguity fails closed and requests user confirmation.
- Synthetic fixtures are labeled; they are never claimed as captured Jeju data.
- No hosting/database choice before cadence and load evidence.
- Dynamic Island is the primary in-ride surface. Public reference research informs information hierarchy and milestone escalation only; TAPSO retains independent copy, styling, and composition.
- Alert configuration is emitted once per 2/1/0 milestone so duplicate observations cannot repeatedly notify the rider.
- A 2/1/0 alert requires an exact phase/count pair and fresh-enough data. Inconsistent or unknown signals show checking; aging or stale signals show delayed.

## Unexpected findings

- The simulator presents a separate Live Activities permission sheet after the first request. Compact content appeared only after granting it, so the demo instructions now call this out.
- FileProvider placeholders can interfere with Xcode output; verification uses a content-only temporary copy and DerivedData under `/tmp`.
- App Store Connect authentication succeeds for the current uploader account, but it has the `Marketing` role only. The Apps page exposes app-bundle creation rather than the new-app record workflow, and Xcode does not grant this account access to the organization's Certificates, Identifiers & Profiles resources.
- App Store Connect reports an updated Apple Developer Program License Agreement. The organization Account Holder must review and accept it before new apps or updates can be submitted; this legal acceptance cannot be delegated to the uploader.
- The installed signing certificate's parenthetical identifier is a user identifier; its `OU=89CGFQ24U5` value is the actual Team ID. Automatic provisioning reaches Apple with that correction, but the available Personal Team has no registered device and cannot complete the TestFlight distribution path.

## Verification

```bash
swift test --package-path packages/transit-core
npm test --prefix services/api
xcodegen generate --spec apps/ios/project.yml --project apps/ios
xcodebuild -project apps/ios/Tapso.xcodeproj -scheme Tapso \
  -destination 'platform=iOS Simulator,name=iPhone 17' build test
```

## Risks

The largest risk is a confident wrong-vehicle selection caused by stale, branched, opposite-direction, or incomplete observations. Matching therefore rejects incompatibility and withholds selection when the top evidence margin is small. Important-update sound/banner behavior is still a signed physical-device claim and remains unverified.

## Exact next action

Have the organization Account Holder accept the updated Apple Developer Program License Agreement and grant the uploader an `Admin`, `App Manager`, or `Developer` role with Certificates, Identifiers & Profiles access. Then register both bundle identifiers, create the TAPSO app record, select the paid team in Xcode, validate a signed archive, and upload build `0.1.0 (1)`.
