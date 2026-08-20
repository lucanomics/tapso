import SwiftUI

struct ActiveJourneyView: View {
    @Environment(TapsoTheme.self) private var theme
    @Bindable var model: TapsoAppModel

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
        HStack {
            Text("365")
                .font(.system(.title2, design: .rounded, weight: .black))
                .foregroundStyle(.black)
                .padding(.horizontal, 13)
                .padding(.vertical, 6)
                .background(theme.tint, in: Capsule())
            VStack(alignment: .leading, spacing: 2) {
                Text(verbatim: model.destinationName)
                    .font(.headline)
                    .lineLimit(1)
                Text(model.liveActivityStatus)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "wave.3.right")
                .foregroundStyle(theme.tint)
                .symbolEffect(.variableColor.iterative)
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
                    .font(.system(size: 86, weight: .black, design: .rounded))
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
        .padding(.vertical, 28)
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
            ProgressView(value: Double(8 - model.remainingStops), total: 8)
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
        Label(model.liveActivityStatus, systemImage: "iphone.gen3.radiowaves.left.and.right")
            .font(.subheadline.weight(.medium))
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(theme.tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 18))
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
        switch model.currentState {
        case .approachingDestination: String(localized: "get_ready")
        case .nextStopIsDestination: String(localized: "next_stop_destination")
        case .arrived: String(localized: "arrived")
        case .dataAging, .dataStale: String(localized: "data_delayed")
        default: String(localized: "on_the_way")
        }
    }

    private var phaseMessage: String {
        switch model.currentState {
        case .approachingDestination: String(localized: "prepare_to_get_off")
        case .nextStopIsDestination: String(localized: "get_off_next")
        case .arrived: String(localized: "get_off_now")
        case .dataAging, .dataStale: String(localized: "check_vehicle_display")
        default: String(localized: "keep_enjoying_ride")
        }
    }

    private var phaseSymbol: String {
        switch model.currentState {
        case .approachingDestination: "figure.stand"
        case .nextStopIsDestination: "bell.fill"
        case .arrived: "figure.walk"
        case .dataAging, .dataStale: "exclamationmark.triangle.fill"
        default: "bus.fill"
        }
    }

    private var phaseColor: Color {
        switch model.currentState {
        case .approachingDestination: theme.warning
        case .nextStopIsDestination, .arrived: theme.urgent
        default: theme.tint
        }
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
