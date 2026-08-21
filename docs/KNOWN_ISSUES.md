# Known issues

- `BLOCKED_BY_CREDENTIALS`: no credentialed live response has verified Jeju coverage, IDs, direction, route variants, or cadence.
- `BLOCKED_BY_CREDENTIALS`: APNs remote Live Activity updates need an Apple developer team, bundle identifiers, signing key, and device token flow.
- `BLOCKED_BY_ACCOUNT_ROLE`: App Store Connect confirms that the current uploader has the `Marketing` role only. The organization Account Holder must accept the pending Apple Developer Program License Agreement and grant an `Admin`, `App Manager`, or `Developer` role with Certificates, Identifiers & Profiles access. The locally available Personal Team is development-only, has no registered device, and cannot distribute through TestFlight.
- `UNVERIFIED`: physical-device Lock Screen, Dynamic Island, haptic, battery, and accessibility behavior.
- Backend matching mirrors core policy but is not generated from a shared cross-language specification; drift tests are needed.
- The app currently exposes the deterministic demo, not full stop/route search or vehicle-confirmation screens.
- Demo haptics occur only while the app is executing; no unsupported background haptic guarantee is made.
- Polling/caching and a durable ride-session worker are designed but not implemented.
- Local workspace folders managed by iCloud/FileProvider can introduce extended attributes or offloaded files that interfere with simulator signing; keep sources downloaded and use DerivedData outside the synced tree.
