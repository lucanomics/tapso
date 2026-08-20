# Live Activity specification

## Model

Static attributes hold route ID/number, boarding and destination stops, and the trip's total stop count. Dynamic content holds remaining stops, current and next stop, phase, freshness, and observation time. An iOS test encodes both objects together and enforces Apple's 4 KB update-payload limit.

## Surfaces

- Lock Screen: route, live-data status, phase instruction, destination, strong remaining-stop number, and a state-tinted progress rail with a moving bus marker.
- Dynamic Island compact leading: bus symbol and route number, tinted for the current milestone.
- Compact trailing: normal remaining count, `준비 2`, `다음 하차`, `내려요`, or an explicit delayed-data warning.
- Minimal: count, arrival walk symbol, or stale-data warning when another activity also needs the Island.
- Expanded leading/trailing: route and count.
- Expanded center: state instruction.
- Expanded bottom: a softly tinted milestone card containing destination, data status, and the moving-marker progress rail.

At 2 stops the surface changes from mint to amber and says prepare; at 1 stop it changes to coral with a bell and next-stop instruction; at 0 it shows a walk symbol and get-off instruction. Delayed data is explicit text and iconography, not color alone. This escalation is derived from the reference product's public user problem—remaining useful while other apps are open—without copying its brand assets, illustration, or composition.

## Update policy

- Normal updates use relevance score `50`; stale/aging data uses `75`; prepare uses `85`; next stop uses `95`; arrival uses `100`.
- Nonterminal content becomes stale two minutes after its observation time. Terminal content has no stale date.
- The first 2-stop, 1-stop, and arrival transitions each attach one `AlertConfiguration` with localized title/body and the default system sound. Repeated observations in the same milestone do not alert again. On supported systems an important update can briefly present the expanded Island (or a banner on devices without it).
- Starting a trip ends any existing TAPSO activity before requesting the new one, preventing duplicate Islands. Launching the app reattaches to the first active or stale TAPSO activity.
- Ending a completed ride preserves the final arrival state for the one-minute dismissal window.

## Lifecycle and constraints

The app starts, locally updates, and ends an ActivityKit activity. The extension performs no network or location work. Per current [Apple ActivityKit documentation](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities), compact leading and trailing content form one cohesive Island, the minimal region is used when multiple activities compete, and touch-and-hold opens the expanded presentation. Remote updates use APNs, `apns-push-type: liveactivity`, the live-activity topic, timestamps, stale dates, and push tokens that can rotate. Priority and frequency must respect system budgets; frequent updates require the appropriate plist capability and product justification.

Production APNs is `BLOCKED_BY_CREDENTIALS`. The interface exists, but no push success is claimed. Background haptics are also not promised: the app uses local haptic feedback while active, and a future push alert must follow ActivityKit notification rules.
