# TAPSO — Claude Desktop / Claude Code Ultimate Handoff Prompt

Copy everything from `BEGIN PROMPT` through `END PROMPT` into a new Claude Desktop or Claude Code session. Open the repository folder below as the working folder before starting.

---

## BEGIN PROMPT

You are taking over a real, partially completed production-oriented iOS repository named **TAPSO (탑서)**. Work directly in the existing repository; do not start over, create a replacement app, or merely describe next steps.

### Repository

- Absolute path: `/Users/seonjaekim/Documents/Codex/2026-08-20/new-chat`
- GitHub: `https://github.com/lucanomics/tapso`
- Expected branch at handoff: `main`
- Expected clean HEAD: `94b7505` (`Merge pull request #4 from lucanomics/codex/testflight-account-blocker`)
- Existing merged PRs:
  - #1: Dynamic Island primary ride surface
  - #2: Jeju Dynamic Island visual polish
  - #3: TestFlight demo readiness
  - #4: verified TestFlight account blockers

First run `git status --short --branch`, `git log --oneline -6`, and `git remote -v`. Preserve unrelated user work. For changes, create a branch prefixed with `codex/` or `claude/`, run verification, review the diff and secret exposure, then commit, push, open a PR, wait for CI, and merge only when checks pass and permissions allow.

### Mandatory project guidance

Read these files before modifying code or release settings:

1. `AGENTS.md`
2. `.agent/PLANS.md`
3. `docs/HANDOFF.md`
4. `docs/TESTFLIGHT.md`
5. `docs/KNOWN_ISSUES.md`
6. `docs/DEVICE_TEST_PLAN.md`
7. `docs/exec-plans/INITIAL_BUILD.md`
8. `apps/ios/project.yml`

Treat the active ExecPlan as a living document. Keep documentation truthful and aligned with verified behavior.

### Product goal

TAPSO is an iPhone-first Jeju bus companion. A rider starts a trip, TAPSO matches the physical bus, tracks the vehicle rather than continuously tracking the passenger, and keeps remaining stops visible through ActivityKit, Dynamic Island, and the Lock Screen. Dynamic Island is a primary product surface.

The current user request is to finish the **internal TestFlight demo release**, not to redesign the app again. Preserve the original, cute Jeju visual identity already implemented: basalt buddy, tangerine accents, sea-foam motion, compact remaining-stop gauge, route badge, and the 8 → 2 → 1 → 0 escalation. Do not copy proprietary Jihaseom assets or styling.

### What is already implemented

- Native SwiftUI iOS app, ActivityKit Live Activity, and WidgetKit extension.
- Framework-independent Swift transit core with destination progress, journey state, freshness handling, and explainable vehicle matching.
- Deterministic demo journey through 8 → 0 stops.
- Dynamic Island compact, minimal, expanded, and Lock Screen layouts.
- Fail-closed checking state for inconsistent phase/count/freshness data.
- One-shot 2/1/0 alert policy, duplicate-activity cleanup, and relaunch reattachment.
- TypeScript API/provider/APNs abstractions and deterministic tests.
- Original TAPSO app icon in the asset catalog.
- Release metadata and TestFlight instructions.

Important release values:

- App name: `TAPSO`
- Platform: iOS
- Primary language: Korean
- Version: `0.1.0`
- Build: `1` — increment before retrying an upload that Apple has already received
- App bundle ID: `com.lucanomics.tapso`
- Live Activity extension bundle ID: `com.lucanomics.tapso.LiveActivity`
- SKU: `tapso-ios-demo-2026`
- Privacy URL: `https://github.com/lucanomics/tapso/blob/main/docs/PRIVACY.md`
- `ITSAppUsesNonExemptEncryption = false`
- Automatic signing is enabled.

### Verified build and test state

Before this handoff, the following passed:

- Swift transit-core: 38 tests.
- TypeScript API: 5 tests.
- iOS Simulator suite: 8 tests.
- iPhone 17 Pro Simulator build, install, launch, and visual inspection.
- Unsigned generic-device Release archive.
- GitHub CI on the merged release-readiness and account-blocker PRs.

The last unsigned archive may still exist at:

`/tmp/TapsoTestFlightReadiness-2.xcarchive`

It contains app version `0.1.0 (1)`, the 1024×1024 icon, the app bundle, and the Live Activity extension. It is intentionally unsigned and cannot be uploaded.

Use these verification commands after relevant changes:

```bash
swift test --package-path packages/transit-core
npm --prefix services/api test
xcodegen generate --spec apps/ios/project.yml --project apps/ios
xcodebuild -project apps/ios/Tapso.xcodeproj -scheme Tapso \
  -destination 'platform=iOS Simulator,name=iPhone 17' build test
```

If the exact simulator name is unavailable, discover a valid installed simulator and document the substitution. Because the repository is in a FileProvider-managed location, keep sources downloaded and put DerivedData/archive output under `/tmp`.

### Critical Apple account ambiguity — do not guess

The user has explicitly clarified: **“Luca Kim is the owner; the Luca Kim / michael account is my account.”** Do not tell the user to log into the separate account that appeared in the organization user list, and do not request or use someone else's credentials.

However, the observed Apple UI is internally inconsistent with the user's understanding and must be reconciled safely:

- App Store Connect account menu showed the current user as `Luca Kim`.
- The selected App Store Connect account/team was named `Gaeul Park`.
- Under `Users and Access`, Luca Kim's row was shown as `Marketing`.
- A separate row was shown as `Account Holder, Admin`.
- Xcode showed two teams: `Gaeul Park, Marketing` and `Personal Team`.
- The only valid local signing identity was an Apple Development certificate whose subject `OU`/Team ID is `89CGFQ24U5`.
- Xcode cached `89CGFQ24U5` as `Luca Kim (Personal Team)`.
- The project currently uses `DEVELOPMENT_TEAM = 89CGFQ24U5`.
- Automatic device signing reached Apple but failed because the Personal Team had no registered device and no provisioning profiles for the app or extension.
- The Developer account page reached with the Luca login showed a normal/free developer profile rather than paid-team Certificates, Identifiers & Profiles access.
- App Store Connect displayed a pending updated Apple Developer Program License Agreement for the selected organization.
- The in-app App Store Connect session was logged out at the end of the prior session.

Interpretation: Luca may own the Apple ID and Personal Team while only holding Marketing access in a different organization, or Apple may be showing the wrong selected provider/team. This is an unresolved team-selection/membership issue, not evidence that the user does not own their Apple account.

Required safe handling:

1. Ask the user to log in themselves when credentials or 2FA are required.
2. After login, identify the active provider/team and membership type using read-only checks.
3. Verify whether Luca has an active paid Apple Developer Program membership of their own or authorized access to a paid organization team.
4. Do not create TAPSO under `Gaeul Park` unless the user explicitly confirms that team is authorized for this product.
5. Do not accept legal agreements, buy/renew membership, change account ownership, create API keys, or alter user roles on the user's behalf without action-time confirmation; legal and financial acceptance must be performed by the user.
6. Never treat the parenthetical code in a certificate display name as the Team ID. Inspect the certificate subject `OU`; the currently verified personal Team ID is `89CGFQ24U5`.
7. Do not overwrite the project Team ID until the correct paid team is positively identified.

### Immediate objective

Resume from the account/signing boundary and take the work as far as safely possible:

1. Confirm `main` is clean and synced.
2. Re-read the handoff and release docs.
3. Have the user authenticate the Luca account in the browser/Xcode when prompted.
4. Determine the correct paid team/provider and its Team ID without changing project files yet.
5. Confirm the latest Apple Developer Program agreement is accepted for that exact team.
6. Confirm the account has permission to create App IDs, provisioning profiles, app records, and upload builds.
7. Register these identifiers under the verified paid team if they do not already exist:
   - `com.lucanomics.tapso`
   - `com.lucanomics.tapso.LiveActivity`
8. Create the App Store Connect app record using the prepared metadata only after showing the final values to the user and receiving action-time confirmation.
9. Create a release branch, update `DEVELOPMENT_TEAM` only if necessary, regenerate the Xcode project, and review the diff.
10. Produce a signed App Store archive and run Apple's validation.
11. Upload build `0.1.0 (1)` if it has never reached Apple; otherwise increment `CURRENT_PROJECT_VERSION` first.
12. Wait for App Store Connect processing and resolve export-compliance questions truthfully.
13. Add the processed build to an internal TestFlight group. Do not invite external testers or transmit private email addresses without explicit confirmation.
14. Run a physical Dynamic Island device pass if a compatible registered iPhone is available; otherwise retain the `REQUIRES_PHYSICAL_DEVICE` label.
15. Update the ExecPlan, TestFlight docs, handoff, and known issues with only what was actually verified.
16. Commit, push, open a PR, wait for CI, and merge once the work is truly complete.

### Archive guidance

Use a fresh DerivedData and archive path under `/tmp`. A typical starting point after the correct paid team is selected is:

```bash
xcodegen generate --spec apps/ios/project.yml --project apps/ios

xcodebuild \
  -project apps/ios/Tapso.xcodeproj \
  -scheme Tapso \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath /tmp/Tapso-TestFlight.xcarchive \
  -derivedDataPath /tmp/Tapso-TestFlight-DerivedData \
  -allowProvisioningUpdates \
  archive
```

Do not assume this command will sign correctly. Inspect the resulting archive, embedded provisioning profiles, entitlements, Team ID, bundle IDs, version/build, and signing identities before validation or upload. Prefer Xcode Organizer for the final validation/upload if command-line credentials or export options are unclear.

### Reality boundaries that remain

- The shipped demo uses deterministic synthetic transit data; it does not claim live Jeju bus data.
- The Live Activity updates locally. It does not automatically advance indefinitely while the app is suspended or terminated.
- Production APNs, push-to-start/update infrastructure, official transit credentials, durable ride workers, and real Jeju field calibration remain separate follow-up work.
- Physical-device Dynamic Island, notification, haptic, battery, and accessibility behavior is not verified unless you actually run the device test plan.
- Do not weaken matching/freshness safeguards or fabricate success to make the demo appear more complete.

### Interaction rules

- Lead with evidence when the Apple UI conflicts with the user's description.
- Do not ask the user for passwords or 2FA codes; let them enter those directly.
- Pause at legal, financial, permission-changing, app-record submission, tester invitation, and irreversible external actions for explicit confirmation.
- Do not upload or distribute under an organization that the user has not clearly authorized.
- Preserve the current Jeju design unless a verified defect requires a change.
- Do not expose Apple IDs, private emails, tokens, provisioning profiles, or signing material in Git, logs, screenshots, PR text, or documentation.
- Never claim TestFlight success until the build appears as processed in App Store Connect and is assigned to the intended testing group.

### Definition of completion for this continuation

Report exact evidence for each state:

- correct paid team identified
- app and extension IDs registered
- signed archive produced
- Apple validation passed
- build uploaded
- build processed
- internal TestFlight group assigned
- physical-device checks passed or explicitly still required
- Git branch/commit/PR/CI/merge state

If a paid membership, authorized organization role, legal agreement, registered device, or user confirmation is unavailable, stop only at that exact external blocker. Leave the repository clean, update the truthful handoff, and give the user the smallest precise action needed to resume.

Begin now by inspecting the repository and reading the mandatory project guidance. Do not redo completed design work.

## END PROMPT
