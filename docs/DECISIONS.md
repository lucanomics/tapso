# Architecture decisions

## Native SwiftUI client

**Decision:** SwiftUI + ActivityKit + WidgetKit. Dynamic Island is central and a wrapper framework adds no value.

## iOS 17 minimum

**Decision:** target iOS 17. ActivityKit began on iOS 16.1, but iOS 17 provides a stable modern baseline for the chosen SwiftUI APIs and avoids maintaining a short-lived iOS 16 compatibility branch. No beta-only iOS 26 API is required.

## Framework-independent Swift core

**Decision:** keep matching, route progress, freshness, and transitions in a Swift package with Foundation only. Views and ActivityKit are adapters.

## XcodeGen plus checked-in project

**Decision:** `project.yml` is the maintainable source and the generated `.xcodeproj` is retained so the repository opens immediately. Regenerate after target/resource changes.

## TypeScript service without a framework

**Decision:** Node's HTTP and test modules are enough for the first provider boundary. Choose hosting, persistence, queueing, and a web framework only after measuring the credentialed API and pilot load.

## No passenger GPS by default

**Decision:** identify the bus from vehicle observations and ride intent. Optional one-shot location may become supporting evidence, never a hidden continuous tracker.
