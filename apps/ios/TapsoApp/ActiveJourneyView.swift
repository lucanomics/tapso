import SwiftUI
import TapsoTransit

struct ActiveJourneyView: View {
    @Environment(TapsoTheme.self) private var theme
    @Bindable var model: TapsoAppModel
    @ScaledMetric(relativeTo: .largeTitle) private var remainingNumberSize = 78.0

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                header
                remainingPanel
                stopProgress
                activityStatus
                demoControls
                if let error = model.errorMessage {
                    errorBanner(error)
                }
            }
            .padding(20)
        }
        .background(Color(uiColor: .systemBackground))
        .navigationTitle("active_journey_title")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("cancel") {
                    Task { await model.cancelRide() }
                }
            }
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "bus.fill")
                    .font(.caption.weight(.black))
                Text(verbatim: model.routeNumber)
                    .font(.system(.title3, design: .rounded, weight: .black))
                    .monospacedDigit()
            }
            .foregroundStyle(.black)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(
                LinearGradient(
                    colors: [theme.tint, theme.tint.opacity(0.74)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                in: Capsule()
            )
            .overlay(alignment: .topTrailing) {
                Image(systemName: "sparkles")
                    .font(.system(size: 8, weight: .black))
                    .foregroundStyle(.white)
                    .padding(3)
                    .background(Color.black.opacity(0.82), in: Circle())
                    .offset(x: 5, y: -5)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(verbatim: model.destinationName)
                    .font(.headline)
                    .lineLimit(1)
                Text("live_vehicle_companion")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "wave.3.right")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(theme.tint)
                .symbolEffect(.variableColor.iterative)
                .frame(width: 34, height: 34)
                .background(theme.tint.opacity(0.12), in: Circle())
        }
    }

    private var remainingPanel: some View {
        VStack(spacing: 10) {
            Label(phaseEyebrow, systemImage: phaseSymbol)
                .font(.caption.weight(.black))
                .tracking(0.8)
                .foregroundStyle(phaseColor)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(phaseColor.opacity(0.12), in: Capsule())
                .overlay {
                    Capsule().stroke(phaseColor.opacity(0.24), lineWidth: 0.75)
                }
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(model.remainingStops, format: .number)
                    .font(
                        .system(
                            size: min(remainingNumberSize, 96),
                            weight: .black,
                            design: .rounded
                        )
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [phaseColor, phaseColor.opacity(0.72)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .contentTransition(.numericText())
                Text("stops_unit")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(.secondary)
            }
            Text(phaseMessage)
                .font(.title3.weight(.semibold))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background {
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [phaseColor.opacity(0.16), theme.surface, theme.surface],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay {
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .stroke(phaseColor.opacity(0.2), lineWidth: 1)
                }
                .overlay(alignment: .topTrailing) {
                    Image(systemName: "sparkles")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(phaseColor.opacity(0.4))
                        .padding(20)
                        .accessibilityHidden(true)
                }
        }
        .shadow(color: phaseColor.opacity(0.12), radius: 18, y: 9)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            String(
                format: String(localized: "remaining_accessibility"),
                model.remainingStops,
                phaseMessage
            )
        )
        .accessibilityIdentifier("remaining-stops")
    }

    private var stopProgress: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Label("current_stop", systemImage: "bus.fill")
                    .foregroundStyle(.secondary)
                Spacer()
                Text(verbatim: model.currentStopName)
                    .fontWeight(.semibold)
                    .lineLimit(1)
            }
            ProgressView(
                value: Double(model.completedStops),
                total: Double(model.totalStops)
            )
            .tint(phaseColor)
            .accessibilityLabel("journey_progress")
            HStack {
                Text("next_stop")
                    .foregroundStyle(.secondary)
                Spacer()
                Text(verbatim: model.nextStopName ?? model.destinationName)
                    .fontWeight(.medium)
                    .lineLimit(1)
            }
        }
        .font(.subheadline)
        .padding(18)
        .background(theme.raisedSurface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var activityStatus: some View {
        HStack(spacing: 12) {
            TrustMetric(
                title: "island_short",
                value: model.isLiveActivityRunning
                    ? String(localized: "connected")
                    : String(localized: "not_connected"),
                systemImage: model.isLiveActivityRunning
                    ? "iphone.gen3.radiowaves.left.and.right"
                    : "iphone.slash",
                color: model.isLiveActivityRunning ? theme.tint : .secondary
            )

            Divider()
                .frame(height: 38)

            TrustMetric(
                title: "vehicle_match",
                value: matchTrustValue,
                systemImage: matchTrustSymbol,
                color: matchTrustColor
            )
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 13)
        .background(theme.raisedSurface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(theme.tint.opacity(0.12), lineWidth: 0.75)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            String(
                format: String(localized: "trust_status_accessibility"),
                model.isLiveActivityRunning
                    ? String(localized: "connected")
                    : String(localized: "not_connected"),
                matchTrustValue
            )
        )
        .accessibilityIdentifier("live-activity-status")
    }

    private var demoControls: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("demo_controls")
                .font(.headline)
            Picker("demo_speed", selection: $model.speed) {
                ForEach(DemoSpeed.allCases) { speed in
                    Text(verbatim: speed.rawValue).tag(speed)
                }
            }
            .pickerStyle(.segmented)
            .onChange(of: model.speed) { _, _ in model.speedChanged() }
            .accessibilityIdentifier("speed-picker")

            if model.speed == .manual, model.remainingStops > 0 {
                Button {
                    Task { await model.advanceDemo() }
                } label: {
                    Label("advance_one_stop", systemImage: "forward.frame.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .accessibilityIdentifier("advance-demo-step")
            }

            if model.remainingStops == 0 {
                Button {
                    Task { await model.finishRide() }
                } label: {
                    Label("finish_ride", systemImage: "checkmark.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(theme.urgent)
                .accessibilityIdentifier("finish-ride")
            }
        }
        .padding(18)
        .background(theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func errorBanner(_ error: String) -> some View {
        Label(error, systemImage: "exclamationmark.triangle.fill")
            .font(.footnote)
            .foregroundStyle(theme.urgent)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(theme.urgent.opacity(0.1), in: RoundedRectangle(cornerRadius: 16))
    }

    private var phaseEyebrow: String {
        switch model.activityDisplayPhase {
        case .prepare: String(localized: "get_ready")
        case .nextStop: String(localized: "next_stop_destination")
        case .arrived: String(localized: "arrived")
        case .delayed: String(localized: "data_delayed")
        case .checking: String(localized: "checking_status")
        case .riding: String(localized: "on_the_way")
        }
    }

    private var phaseMessage: String {
        switch model.activityDisplayPhase {
        case .prepare: String(localized: "prepare_to_get_off")
        case .nextStop: String(localized: "get_off_next")
        case .arrived: String(localized: "get_off_now")
        case .delayed: String(localized: "check_vehicle_display")
        case .checking: String(localized: "checking_instruction")
        case .riding: String(localized: "keep_enjoying_ride")
        }
    }

    private var phaseSymbol: String {
        switch model.activityDisplayPhase {
        case .prepare: "figure.stand"
        case .nextStop: "bell.fill"
        case .arrived: "figure.walk"
        case .delayed: "exclamationmark.triangle.fill"
        case .checking: "arrow.triangle.2.circlepath"
        case .riding: "bus.fill"
        }
    }

    private var phaseColor: Color {
        switch model.activityDisplayPhase {
        case .prepare, .delayed: theme.warning
        case .nextStop, .arrived: theme.urgent
        case .checking: theme.checking
        case .riding: theme.tint
        }
    }

    private var matchTrustValue: String {
        switch model.matchConfidence {
        case .high: String(localized: "match_confidence_high")
        case .medium: String(localized: "match_confidence_medium")
        case .low: String(localized: "match_confidence_low")
        case .unknown: String(localized: "match_confidence_unknown")
        }
    }

    private var matchTrustSymbol: String {
        switch model.matchConfidence {
        case .high: "checkmark.seal.fill"
        case .medium: "shield.lefthalf.filled"
        case .low: "exclamationmark.shield.fill"
        case .unknown: "questionmark.circle.fill"
        }
    }

    private var matchTrustColor: Color {
        switch model.matchConfidence {
        case .high: theme.tint
        case .medium: theme.warning
        case .low: theme.urgent
        case .unknown: .secondary
        }
    }
}

private struct TrustMetric: View {
    let title: LocalizedStringKey
    let value: String
    let systemImage: String
    let color: Color

    var body: some View {
        HStack(spacing: 9) {
            Image(systemName: systemImage)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(color)
                .frame(width: 30, height: 30)
                .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 9))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(verbatim: value)
                    .font(.caption.weight(.bold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.84)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview("Active") {
    ActiveJourneyPreview()
}

@MainActor
private struct ActiveJourneyPreview: View {
    @State private var model = TapsoAppModel()
    @State private var theme = TapsoTheme()

    var body: some View {
        NavigationStack {
            ActiveJourneyView(model: model)
                .environment(theme)
                .task { await model.startDemo() }
        }
    }
}
