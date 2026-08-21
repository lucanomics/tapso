# TestFlight demo release

## App record

- App name: `TAPSO`
- Platform: iOS
- Primary language: Korean
- Bundle ID: `com.lucanomics.tapso`
- Live Activity extension: `com.lucanomics.tapso.LiveActivity`
- SKU: `tapso-ios-demo-2026`
- Version: `0.1.0`
- Build: increment `CURRENT_PROJECT_VERSION` for every upload
- Privacy policy URL: `https://github.com/lucanomics/tapso/blob/main/docs/PRIVACY.md`

The bundle identifiers must be registered under the paid Apple Developer team that owns the App Store Connect record. Automatic signing is enabled. App Store Connect currently identifies the uploader as `Marketing`; that role cannot finish app-record, signing, or upload work. The organization Account Holder must first accept the pending Apple Developer Program License Agreement and grant one of the upload-capable roles listed below with Certificates, Identifiers & Profiles access.

## Beta metadata

### Beta description

TAPSO는 제주 버스 탑승 중 남은 정거장과 하차 타이밍을 Dynamic Island와 잠금 화면에서 한눈에 보여주는 iPhone 우선 데모입니다. 현재 빌드는 실제 승객 위치를 지속 추적하지 않으며, 제주 노선을 본뜬 명시적 합성 시나리오로 핵심 UX를 검증합니다.

### What to test

1. `데모 여정 시작`을 누르고 Live Activities 사용을 허용합니다.
2. 홈 화면에서 8정거장 컴팩트 Island의 노선, 돌이 캐릭터, 진행 게이지를 확인합니다.
3. 앱의 `한 정류장 이동`으로 2·1·0정거장 상태를 만든 뒤 각각 `준비 2`, `다음 하차`, `내려요`가 잘 보이는지 확인합니다.
4. Dynamic Island를 길게 눌러 목적지, 데이터 상태, 진행 레일이 잘 보이는지 확인합니다.
5. 잠금 화면 카드, 한국어/영어, VoiceOver, 큰 글자에서 정보가 잘리지 않는지 확인합니다.

### Beta review notes

- No account or test credentials are required.
- The app makes no network request and collects no user data in this demo build.
- Route, stop, and vehicle observations are synthetic and labeled as demo behavior.
- Live Activity updates are local in this build. Automatic background progression and real Jeju data are not claimed.
- A Dynamic Island-capable iPhone provides the intended experience; other supported iPhones show the Lock Screen Live Activity.

### Feedback email

Set this to an address monitored by the release owner in App Store Connect. Do not commit private contact details to the repository.

## Upload checklist

1. Confirm the latest Apple Developer agreements are accepted.
2. Grant the uploader an `Admin`, `App Manager`, or `Developer` App Store Connect role and Certificates, Identifiers & Profiles access.
3. Register the app and extension bundle identifiers, then select that paid team in Xcode.
4. Create the App Store Connect record using the values above.
5. Archive with `Release`, validate, and upload through Xcode Organizer.
6. Confirm build processing and export-compliance status. The app declares `ITSAppUsesNonExemptEncryption = NO` because this demo contains no encryption implementation.
7. Add the processed build to an internal testing group and paste the beta metadata above.
8. Complete the signed physical-device cases in `DEVICE_TEST_PLAN.md` before inviting external testers.

## Reality boundary

Internal TestFlight distribution of the deterministic demo does not require public-transit or APNs credentials. A self-advancing background demo or live pilot does require ActivityKit push tokens, a production APNs gateway, a durable session worker, official public-data credentials, and field validation.
