import SwiftUI

struct HomeView: View {
    @Environment(TapsoTheme.self) private var theme
    let model: TapsoAppModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                brandHeader
                routePreview
                demoExplanation
                startButton
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 24)
        }
        .background(Color(uiColor: .systemBackground))
        .navigationTitle("")
        .toolbar(.hidden, for: .navigationBar)
    }

    private var brandHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("TAPSO")
                .font(.system(.largeTitle, design: .rounded, weight: .black))
                .tracking(1.5)
            Text("brand_korean")
                .font(.headline)
                .foregroundStyle(theme.tint)
            Text("home_mantra")
                .font(.title3.weight(.medium))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }

    private var routePreview: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                Text("365")
                    .font(.system(.title, design: .rounded, weight: .bold))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(theme.tint, in: Capsule())
                Spacer()
                Label("demo_badge", systemImage: "hammer.fill")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            StopPairView(
                origin: "제주버스터미널",
                destination: "제주출입국·외국인청"
            )

            HStack {
                Label("eight_stops", systemImage: "point.topleft.down.to.point.bottomright.curvepath")
                Spacer()
                Label("vehicle_data", systemImage: "location.slash")
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }
        .padding(20)
        .background(theme.surface, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("demo_route_accessibility")
    }

    private var demoExplanation: some View {
        Label {
            Text("demo_explanation")
                .fixedSize(horizontal: false, vertical: true)
        } icon: {
            Image(systemName: "dot.radiowaves.up.forward")
                .foregroundStyle(theme.tint)
        }
        .font(.subheadline)
        .foregroundStyle(.secondary)
    }

    private var startButton: some View {
        Button {
            Task { await model.startDemo() }
        } label: {
            Label("start_demo_ride", systemImage: "arrow.right.circle.fill")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 17)
        }
        .buttonStyle(.borderedProminent)
        .buttonBorderShape(.roundedRectangle(radius: 18))
        .accessibilityIdentifier("start-demo-ride")
    }
}

private struct StopPairView: View {
    let origin: String
    let destination: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(spacing: 3) {
                Circle().fill(.secondary).frame(width: 8, height: 8)
                Rectangle().fill(.quaternary).frame(width: 2, height: 30)
                Circle().stroke(.primary, lineWidth: 2).frame(width: 10, height: 10)
            }
            .padding(.top, 6)

            VStack(alignment: .leading, spacing: 16) {
                Text(verbatim: origin)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(verbatim: destination)
                    .font(.headline)
            }
        }
    }
}

#Preview("Home") {
    HomeView(model: TapsoAppModel())
        .environment(TapsoTheme())
        .tint(TapsoTheme().tint)
}
