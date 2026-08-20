# Live Activity specification

## Model

Static attributes hold route ID/number, destination stop, and session ID. Dynamic content holds remaining stops, current and next stop, phase, freshness, observation time, and whether data is delayed. Keep the encoded combined payload below Apple's 4 KB limit.

## Surfaces

- Lock Screen: route, strong remaining-stop number, phase instruction, destination, and freshness.
- Dynamic Island compact leading: route number.
- Compact trailing: remaining count.
- Minimal: remaining count with bus symbol context.
- Expanded leading/trailing: route and count.
- Expanded center: state instruction.
- Expanded bottom: destination and data status.

At 2 stops the copy says prepare; at 1 stop it says the next stop is the destination; at 0 it says get off. Delayed data is explicit text and iconography, not color alone.

## Lifecycle and constraints

The app starts, locally updates, and ends an ActivityKit activity. The extension performs no network or location work. Per current [Apple ActivityKit documentation](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities), a Live Activity can remain active for up to eight hours and may remain on the Lock Screen for up to four additional hours. Remote updates use APNs, `apns-push-type: liveactivity`, the live-activity topic, timestamps, stale dates, and push tokens that can rotate. Priority and frequency must respect system budgets; frequent updates require the appropriate plist capability and product justification.

Production APNs is `BLOCKED_BY_CREDENTIALS`. The interface exists, but no push success is claimed. Background haptics are also not promised: the app uses local haptic feedback while active, and a future push alert must follow ActivityKit notification rules.
