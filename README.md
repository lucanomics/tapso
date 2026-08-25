# TAPSO

TAPSO is an iPhone-first Jeju bus ride companion: choose a route and destination, identify the physical bus, close the app, and get a glanceable warning before the destination. The primary surface during a ride is a native ActivityKit Live Activity and Dynamic Island, not a map.

This repository contains a production-shaped first vertical slice. Its deterministic demo runs the same vehicle matching, remaining-stop, journey-state, and ActivityKit paths intended for real data.

## Current status

| Area | Status | Evidence |
|---|---|---|
| Swift transit core | `VERIFIED` | 38 Swift tests cover matching, progress, freshness, journey transitions, and debug evidence |
| Native iOS app | `VERIFIED` | Xcode simulator build includes the app and WidgetKit extension |
| Local 8 → 0 demo | `IMPLEMENTED` | 1×, 5×, 10×, and manual stepping use production domain types |
| Lock Screen / Dynamic Island | `VERIFIED` | iOS 26.3 iPhone 17 Pro Simulator: compact 8/2/1/0, expanded, Lock Screen, request/update/end; 4 iOS tests |
| TypeScript API scaffold | `VERIFIED` | Native Node tests cover matching and official-schema normalization |
| Marketing website | `IMPLEMENTED` | React + Vite site under `apps/web`; responsive browser QA and Vercel deployment workflow |
| Official API contract | `VERIFIED` | Swagger paths and fields inspected from data.go.kr resource 15157601 |
| Live Jeju response quality | `BLOCKED_BY_CREDENTIALS` | No public-data service key was available; no live response is claimed |
| Remote APNs updates | `BLOCKED_BY_CREDENTIALS` | Requires Apple team, bundle, and APNs signing credentials |
| Physical-device validation | `UNVERIFIED` | Requires a signed device build and real Dynamic Island hardware |

## Quick start

Prerequisites: macOS, Xcode 26 or another stable Xcode supporting iOS 17, Swift 6, XcodeGen, and Node 22.18+.

```bash
swift test --package-path packages/transit-core
npm test --prefix services/api
xcodegen generate --spec apps/ios/project.yml --project apps/ios
xcodebuild -project apps/ios/Tapso.xcodeproj -scheme Tapso \
  -destination 'platform=iOS Simulator,name=iPhone 17' build
```

Open `apps/ios/Tapso.xcodeproj`, run the `Tapso` scheme, then choose **Start demo ride** and allow Live Activities when iOS asks. The demo begins at eight stops remaining and supports accelerated or manual progression. Press Home to inspect compact mode and touch and hold the Island for the expanded journey surface.

To probe live official data, copy `.env.example` to `.env`, provide the decoded service key only in your local environment, and run:

```bash
PUBLIC_DATA_SERVICE_KEY='…' node --experimental-strip-types \
  scripts/transit-spike/run.ts '<official-route-id>' 50110
```

Never put the government key in the iOS target or commit `.env`.

To run the public product website locally:

```bash
npm install --prefix apps/web
npm run build --prefix apps/web
npm run dev --prefix apps/web
```

## Repository map

- `apps/ios`: SwiftUI app, Live Activity extension, localized resources, and iOS tests.
- `apps/web`: Korean-first responsive product website and interactive Dynamic Island story.
- `packages/transit-core`: UI-independent Swift domain, matching, progress, and state machine.
- `services/api`: TypeScript normalization, matching endpoint, provider and APNs boundaries.
- `fixtures/transit`: explicitly synthetic deterministic data.
- `scripts/transit-spike`: credential-gated official API probe.
- `docs`: product, architecture, evidence, risk, device plan, and handoff material.

Read [ARCHITECTURE.md](docs/ARCHITECTURE.md), [DATA_VALIDATION.md](docs/DATA_VALIDATION.md), and [HANDOFF.md](docs/HANDOFF.md) before connecting real data.
