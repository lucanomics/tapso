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

## Marketing-site backend as co-located Vercel Functions

**Decision:** the waitlist and support endpoints live in `apps/web/api` and
deploy with the marketing site.

`services/api` binds to `127.0.0.1`, declares no dependencies, and has no host,
Dockerfile, or deployment pipeline. Deploying it to serve one public form would
have meant choosing a host, a runtime, a release process, and a CORS boundary
for a feature the existing Vercel project can already serve. Revisit this if the
iOS client ever needs the same endpoints; until then, one deployment is the
smaller system.

The handlers use the Web Handler signature (`export async function POST(request:
Request)`), which gives exact raw-body access for webhook verification and lets
every endpoint be unit-tested with a plain `Request`.

## No SDKs at the marketing-site provider boundaries

**Decision:** reach Supabase through PostgREST and Resend through its REST API
with `fetch`.

Four HTTP calls do not justify two SDKs and their transitive trees, and
injecting `fetch` makes each boundary testable without a network. This matches
`services/api`, which also ships zero dependencies.

## Toss Payments for KRW support

**Decision:** implement support payment behind a `SupportPaymentProvider`
interface with a Toss Payments adapter, and keep it disabled until a merchant
account exists.

Toss covers the Korean payment methods TAPSO's riders actually use; Stripe does
not. Toss sends no signature on `PAYMENT_STATUS_CHANGED`, so the webhook handler
treats the request body as a notification and re-reads the payment from the Toss
API before recording anything. The amount is whatever the server stored when the
intent was created; a value supplied by the browser is only ever compared.
