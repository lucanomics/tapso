import ActivityKit
import SwiftUI
import TapsoTransit
import WidgetKit

struct TapsoLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TapsoActivityAttributes.self) { context in
            LockScreenJourneyView(context: context)
                .activityBackgroundTint(TapsoLiveActivityPalette.background)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    RouteMark(
                        routeNumber: context.attributes.routeNumber,
                        accent: phasePresentation(for: context.state).accent,
                        phase: TapsoLiveActivityPolicy.displayPhase(for: context.state)
                    )
                }
                DynamicIslandExpandedRegion(.trailing) {
                    RemainingMetric(
                        remainingStops: context.state.remainingStops,
                        accent: phasePresentation(for: context.state).accent,
                        compact: true
                    )
                }
                DynamicIslandExpandedRegion(.center) {
                    PhaseEyebrow(state: context.state)
                }
                DynamicIslandExpandedRegion(.bottom, priority: 1) {
                    ExpandedJourneyView(context: context)
                }
            } compactLeading: {
                CompactLeadingView(
                    routeNumber: context.attributes.routeNumber,
                    state: context.state
                )
            } compactTrailing: {
                CompactTrailingView(
                    state: context.state,
                    totalStops: context.attributes.totalStops
                )
            } minimal: {
                MinimalJourneyView(state: context.state)
            }
            .keylineTint(phasePresentation(for: context.state).accent)
            .widgetURL(URL(string: "tapso://ride/\(context.attributes.routeID)"))
        }
    }
}

private struct CompactLeadingView: View {
    let routeNumber: String
    let state: TapsoActivityAttributes.ContentState

    var body: some View {
        HStack(spacing: 4) {
            CompactJejuBuddy(
                accent: phasePresentation(for: state).accent,
                phase: TapsoLiveActivityPolicy.displayPhase(for: state)
            )
            Text(verbatim: routeNumber)
                .font(.caption.weight(.black))
                .monospacedDigit()
            CitrusDot(size: 5)
        }
        .foregroundStyle(phasePresentation(for: state).accent)
        .padding(.horizontal, 3)
        .padding(.vertical, 2)
        .background(
            phasePresentation(for: state).accent.opacity(0.1),
            in: Capsule()
        )
        .accessibilityLabel(
            String(format: String(localized: "route_accessibility"), routeNumber)
        )
        .accessibilityHint("island_hold_hint")
    }
}

private struct CompactTrailingView: View {
    let state: TapsoActivityAttributes.ContentState
    let totalStops: Int

    private var presentation: PhasePresentation {
        phasePresentation(for: state)
    }

    var body: some View {
        Group {
            switch TapsoLiveActivityPolicy.displayPhase(for: state) {
            case .delayed:
                CompactActionPill(
                    title: "compact_delayed",
                    symbolName: "exclamationmark.triangle.fill",
                    accent: presentation.accent
                )
            case .checking:
                CompactActionPill(
                    title: "compact_checking",
                    symbolName: "arrow.triangle.2.circlepath",
                    accent: presentation.accent
                )
            case .arrived:
                CompactActionPill(
                    title: "compact_get_off",
                    symbolName: "figure.walk",
                    accent: presentation.accent
                )
            case .nextStop:
                CompactActionPill(
                    title: "compact_next",
                    symbolName: "bell.fill",
                    accent: presentation.accent
                )
            case .prepare:
                CompactActionPill(
                    title: "compact_prepare",
                    symbolName: "figure.stand",
                    accent: presentation.accent,
                    count: state.remainingStops
                )
            case .riding:
                CompactJourneyMetric(
                    remainingStops: state.remainingStops,
                    totalStops: totalStops,
                    accent: presentation.accent
                )
            }
        }
        .font(.caption2.weight(.bold))
        .foregroundStyle(presentation.accent)
        .accessibilityLabel(compactAccessibilityLabel(for: state))
    }
}

private struct CompactActionPill: View {
    let title: LocalizedStringKey
    let symbolName: String
    let accent: Color
    var count: Int? = nil

    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: symbolName)
                .font(.system(size: 8, weight: .black))
            Text(title)
            if let count {
                Text(count, format: .number)
                    .fontWeight(.black)
                    .monospacedDigit()
            }
        }
        .padding(.horizontal, 5)
        .padding(.vertical, 3)
        .background(accent.opacity(0.14), in: Capsule())
        .overlay {
            Capsule().stroke(accent.opacity(0.24), lineWidth: 0.55)
        }
    }
}

private struct CompactJourneyMetric: View {
    let remainingStops: Int
    let totalStops: Int
    let accent: Color

    private var progress: Double {
        let total = max(1, totalStops)
        let remaining = min(max(remainingStops, 0), total)
        return 1 - Double(remaining) / Double(total)
    }

    var body: some View {
        HStack(spacing: 4) {
            ZStack {
                Circle()
                    .stroke(accent.opacity(0.22), lineWidth: 2)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(accent, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text(remainingStops, format: .number)
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .monospacedDigit()
                    .contentTransition(.numericText())
                CitrusDot(size: 4)
                    .offset(x: 7, y: -7)
            }
            .frame(width: 20, height: 20)

            Text("compact_stops")
                .font(.caption2.weight(.bold))
        }
    }
}

private struct CompactJejuBuddy: View {
    let accent: Color
    let phase: TapsoLiveActivityDisplayPhase

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 5, style: .continuous)
                .fill(TapsoLiveActivityPalette.basaltLight)
                .overlay {
                    RoundedRectangle(cornerRadius: 5, style: .continuous)
                        .stroke(accent.opacity(0.46), lineWidth: 0.55)
                }
            Capsule()
                .fill(accent)
                .frame(width: 9, height: 2)
                .offset(y: -4)
            HStack(spacing: 3) {
                Circle()
                Circle()
            }
            .foregroundStyle(.white.opacity(0.92))
            .frame(width: 6, height: 1.8)
            .offset(y: 1)
            HStack(spacing: 5) {
                Circle()
                Circle()
            }
            .foregroundStyle(TapsoLiveActivityPalette.tangerine)
            .frame(width: 8, height: 2)
            .offset(y: 3)

            JejuBuddyMouth(phase: phase, compact: true)
                .offset(y: 5.5)
        }
        .frame(width: 16, height: 16)
        .accessibilityHidden(true)
    }
}

private struct MinimalJourneyView: View {
    let state: TapsoActivityAttributes.ContentState

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            TapsoLiveActivityPalette.basaltLight,
                            phasePresentation(for: state).accent.opacity(0.24)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            switch TapsoLiveActivityPolicy.displayPhase(for: state) {
            case .delayed:
                Image(systemName: "exclamationmark")
            case .checking:
                Image(systemName: "arrow.triangle.2.circlepath")
            case .arrived:
                Image(systemName: "figure.walk")
            default:
                Text(state.remainingStops, format: .number)
                    .monospacedDigit()
            }

            CitrusDot(size: 6)
                .offset(x: 8, y: -8)
        }
        .font(.caption2.weight(.black))
        .foregroundStyle(phasePresentation(for: state).accent)
        .accessibilityLabel(compactAccessibilityLabel(for: state))
    }
}

private struct LockScreenJourneyView: View {
    let context: ActivityViewContext<TapsoActivityAttributes>

    private var presentation: PhasePresentation {
        phasePresentation(for: context.state)
    }

    var body: some View {
        ZStack {
            JourneyAmbientBackground(accent: presentation.accent)

            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    RouteMark(
                        routeNumber: context.attributes.routeNumber,
                        accent: presentation.accent,
                        phase: TapsoLiveActivityPolicy.displayPhase(for: context.state)
                    )
                    LiveDataStatus(
                        freshness: context.state.freshness,
                        isStale: context.isStale,
                        accent: presentation.accent,
                        displayPhase: TapsoLiveActivityPolicy.displayPhase(for: context.state)
                    )
                    Spacer()
                    PhaseBadge(presentation: presentation)
                }

                HStack(alignment: .bottom, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(presentation.instruction)
                            .font(.title3.weight(.black))
                            .foregroundStyle(.white)
                        Label {
                            Text(verbatim: context.attributes.destinationName)
                                .lineLimit(1)
                        } icon: {
                            Image(systemName: "flag.checkered")
                        }
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.72))
                    }
                    Spacer(minLength: 8)
                    RemainingMetric(
                        remainingStops: context.state.remainingStops,
                        accent: presentation.accent,
                        compact: false
                    )
                }

                JourneyProgressRail(
                    currentStopName: context.state.currentStopName,
                    nextStopName: context.state.nextStopName,
                    destinationName: context.attributes.destinationName,
                    remainingStops: context.state.remainingStops,
                    totalStops: context.attributes.totalStops,
                    accent: presentation.accent
                )
            }
            .padding(16)
        }
        .foregroundStyle(.white)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            String(
                format: String(localized: "live_activity_accessibility"),
                context.attributes.routeNumber,
                context.attributes.destinationName,
                context.state.remainingStops,
                presentation.accessibilityText
            )
        )
    }
}

private struct PhaseEyebrow: View {
    let state: TapsoActivityAttributes.ContentState

    var body: some View {
        PhaseBadge(
            presentation: phasePresentation(for: state),
            compact: true
        )
    }
}

private struct ExpandedJourneyView: View {
    let context: ActivityViewContext<TapsoActivityAttributes>

    private var presentation: PhasePresentation {
        phasePresentation(for: context.state)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 9) {
                MilestoneGlyph(
                    presentation: presentation,
                    phase: TapsoLiveActivityPolicy.displayPhase(for: context.state)
                )

                VStack(alignment: .leading, spacing: 1) {
                    Text(presentation.instruction)
                        .font(.headline.weight(.black))
                        .lineLimit(1)
                    Text(verbatim: context.attributes.destinationName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 6)
                LiveDataStatus(
                    freshness: context.state.freshness,
                    isStale: context.isStale,
                    accent: presentation.accent,
                    displayPhase: TapsoLiveActivityPolicy.displayPhase(for: context.state),
                    iconOnly: true
                )
            }

            JourneyProgressRail(
                currentStopName: context.state.currentStopName,
                nextStopName: context.state.nextStopName,
                destinationName: context.attributes.destinationName,
                remainingStops: context.state.remainingStops,
                totalStops: context.attributes.totalStops,
                accent: presentation.accent
            )
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 8)
        .background {
            JejuPostcardBackground(accent: presentation.accent)
        }
    }
}

private struct JourneyProgressRail: View {
    let currentStopName: String
    let nextStopName: String?
    let destinationName: String
    let remainingStops: Int
    let totalStops: Int
    let accent: Color

    private var progress: Double {
        let total = max(1, totalStops)
        let remaining = min(max(remainingStops, 0), total)
        return 1 - Double(remaining) / Double(total)
    }

    var body: some View {
        VStack(spacing: 7) {
            GeometryReader { proxy in
                let markerSize = 14.0
                let destinationSize = 7.0
                let availableWidth = max(0, proxy.size.width - markerSize)

                ZStack(alignment: .leading) {
                    Capsule().fill(.white.opacity(0.13))
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [accent.opacity(0.72), accent],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: max(markerSize / 2, proxy.size.width * progress))

                    CitrusDot(size: destinationSize)
                        .offset(x: max(0, proxy.size.width - destinationSize))

                    RoundedRectangle(cornerRadius: 4.5, style: .continuous)
                        .fill(accent)
                        .frame(width: markerSize, height: markerSize)
                        .overlay {
                            Image(systemName: remainingStops == 0 ? "flag.fill" : "bus.fill")
                                .font(.system(size: 7, weight: .black))
                                .foregroundStyle(TapsoLiveActivityPalette.background)
                        }
                        .overlay {
                            RoundedRectangle(cornerRadius: 4.5, style: .continuous)
                                .stroke(.white.opacity(0.26), lineWidth: 0.6)
                        }
                        .offset(x: availableWidth * progress)
                }
            }
            .frame(height: 12)

            HStack(spacing: 6) {
                Image(systemName: "bus.fill")
                    .foregroundStyle(accent)
                Text(verbatim: currentStopName)
                    .lineLimit(1)
                    .foregroundStyle(.white.opacity(0.64))
                Image(systemName: "chevron.right")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(accent.opacity(0.8))
                Text(verbatim: nextStopName ?? destinationName)
                    .lineLimit(1)
                    .foregroundStyle(.white.opacity(0.9))
                Spacer(minLength: 4)
                HStack(spacing: 3) {
                    Text(remainingStops, format: .number)
                        .fontWeight(.black)
                        .monospacedDigit()
                    Text("compact_stops")
                }
                .foregroundStyle(accent)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(accent.opacity(0.12), in: Capsule())
            }
            .font(.caption2.weight(.semibold))
        }
    }
}

private struct JourneyAmbientBackground: View {
    let accent: Color

    var body: some View {
        ZStack {
            TapsoLiveActivityPalette.background
            LinearGradient(
                colors: [accent.opacity(0.22), .clear, accent.opacity(0.06)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            Circle()
                .fill(TapsoLiveActivityPalette.tangerine.opacity(0.17))
                .frame(width: 84, height: 84)
                .offset(x: 145, y: -42)
                .blur(radius: 1)
            JejuWaveShape(amplitude: 9)
                .stroke(TapsoLiveActivityPalette.seaFoam.opacity(0.18), lineWidth: 1.2)
                .frame(height: 42)
                .offset(y: 56)
            JejuWaveShape(amplitude: 6)
                .stroke(accent.opacity(0.13), lineWidth: 1)
                .frame(height: 34)
                .offset(y: 67)
        }
    }
}

private struct PhaseBadge: View {
    let presentation: PhasePresentation
    var compact = false

    var body: some View {
        HStack(spacing: compact ? 3 : 4) {
            Image(systemName: presentation.symbolName)
                .font(.system(size: compact ? 8 : 9, weight: .bold))
            Text(presentation.eyebrow)
                .lineLimit(1)
        }
        .font(.caption2.weight(.black))
        .textCase(.uppercase)
        .foregroundStyle(presentation.accent)
        .padding(.horizontal, compact ? 6 : 8)
        .padding(.vertical, compact ? 3 : 4)
        .background(presentation.accent.opacity(0.11), in: Capsule())
        .overlay {
            Capsule()
                .stroke(presentation.accent.opacity(0.3), lineWidth: 0.65)
        }
    }
}

private struct MilestoneGlyph: View {
    let presentation: PhasePresentation
    let phase: TapsoLiveActivityDisplayPhase

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            JejuStoneBuddy(accent: presentation.accent, phase: phase)

            Circle()
                .fill(presentation.accent)
                .frame(width: 16, height: 16)
                .overlay {
                    Image(systemName: presentation.symbolName)
                        .font(.system(size: 7, weight: .black))
                        .foregroundStyle(TapsoLiveActivityPalette.background)
                }
                .overlay {
                    Circle().stroke(TapsoLiveActivityPalette.background, lineWidth: 2)
                }
                .offset(x: 3, y: 3)
        }
        .accessibilityHidden(true)
    }
}

private struct LiveDataStatus: View {
    let freshness: DataFreshness
    let isStale: Bool
    let accent: Color
    var displayPhase: TapsoLiveActivityDisplayPhase = .riding
    var iconOnly = false

    var body: some View {
        Group {
            if iconOnly {
                Image(
                    systemName: statusSymbol
                )
                .foregroundStyle(statusAccent)
                .accessibilityLabel(statusText)
            } else {
                HStack(spacing: 4) {
                    Circle()
                        .fill(statusAccent)
                        .frame(width: 6, height: 6)
                    Text(statusText)
                }
            }
        }
        .font(.caption2.weight(.bold))
        .foregroundStyle(.white.opacity(0.6))
    }

    private var isDelayed: Bool {
        isStale || freshness == .stale || freshness == .aging
    }

    private var isChecking: Bool {
        displayPhase == .checking || freshness == .unknown
    }

    private var statusSymbol: String {
        if isDelayed { "exclamationmark.triangle.fill" }
        else if isChecking { "arrow.triangle.2.circlepath" }
        else { "wave.3.right" }
    }

    private var statusText: LocalizedStringKey {
        if isDelayed { "compact_delayed" }
        else if isChecking { "checking_status" }
        else { "tracking_live" }
    }

    private var statusAccent: Color {
        if isDelayed { TapsoLiveActivityPalette.amber }
        else if isChecking { TapsoLiveActivityPalette.sky }
        else { accent }
    }
}

private struct RouteMark: View {
    let routeNumber: String
    let accent: Color
    let phase: TapsoLiveActivityDisplayPhase

    var body: some View {
        HStack(spacing: 5) {
            CompactJejuBuddy(accent: accent, phase: phase)
            Text(verbatim: routeNumber)
                .font(.system(.headline, design: .rounded, weight: .black))
                .monospacedDigit()
            CitrusDot(size: 7)
        }
        .foregroundStyle(.black)
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .background {
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [accent, accent.opacity(0.76)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay {
                    Capsule().stroke(.white.opacity(0.2), lineWidth: 0.7)
                }
        }
    }
}

private struct RemainingMetric: View {
    let remainingStops: Int
    let accent: Color
    let compact: Bool

    var body: some View {
        VStack(alignment: .trailing, spacing: -2) {
            Text(remainingStops, format: .number)
                .font(
                    compact
                        ? .system(.title3, design: .rounded, weight: .black)
                        : .system(size: 38, weight: .black, design: .rounded)
                )
                .monospacedDigit()
                .foregroundStyle(accent)
                .contentTransition(.numericText())
            Text("stops_remaining")
                .font(.caption2.weight(.bold))
                .foregroundStyle(.secondary)
        }
    }
}

private struct PhasePresentation {
    let accent: Color
    let eyebrow: LocalizedStringKey
    let instruction: LocalizedStringKey
    let symbolName: String
    let accessibilityText: String
}

private func phasePresentation(
    for state: TapsoActivityAttributes.ContentState
) -> PhasePresentation {
    switch TapsoLiveActivityPolicy.displayPhase(for: state) {
    case .prepare:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.amber,
            eyebrow: "get_ready",
            instruction: "prepare_to_get_off",
            symbolName: "figure.stand",
            accessibilityText: String(localized: "prepare_to_get_off")
        )
    case .nextStop:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.coral,
            eyebrow: "next_stop_destination",
            instruction: "get_off_next",
            symbolName: "bell.fill",
            accessibilityText: String(localized: "get_off_next")
        )
    case .arrived:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.coral,
            eyebrow: "arrived",
            instruction: "get_off_now",
            symbolName: "figure.walk",
            accessibilityText: String(localized: "get_off_now")
        )
    case .delayed:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.amber,
            eyebrow: "data_delayed",
            instruction: "check_vehicle_display",
            symbolName: "exclamationmark.triangle.fill",
            accessibilityText: String(localized: "check_vehicle_display")
        )
    case .checking:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.sky,
            eyebrow: "checking_status",
            instruction: "checking_instruction",
            symbolName: "arrow.triangle.2.circlepath",
            accessibilityText: String(localized: "checking_instruction")
        )
    case .riding:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.mint,
            eyebrow: "on_the_way",
            instruction: "island_tracking_message",
            symbolName: "bus.fill",
            accessibilityText: String(localized: "island_tracking_message")
        )
    }
}

private enum TapsoLiveActivityPalette {
    static let mint = Color(red: 0.18, green: 0.78, blue: 0.66)
    static let amber = Color(red: 1.00, green: 0.72, blue: 0.24)
    static let coral = Color(red: 1.00, green: 0.38, blue: 0.32)
    static let sky = Color(red: 0.35, green: 0.70, blue: 1.00)
    static let seaFoam = Color(red: 0.47, green: 0.92, blue: 0.86)
    static let tangerine = Color(red: 1.00, green: 0.53, blue: 0.18)
    static let leaf = Color(red: 0.20, green: 0.74, blue: 0.43)
    static let basaltLight = Color(red: 0.10, green: 0.14, blue: 0.15)
    static let background = Color(red: 0.025, green: 0.045, blue: 0.055)
}

private struct CitrusDot: View {
    let size: CGFloat

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [TapsoLiveActivityPalette.tangerine, .yellow.opacity(0.82)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .shadow(color: TapsoLiveActivityPalette.tangerine.opacity(0.35), radius: 2)
            Capsule()
                .fill(TapsoLiveActivityPalette.leaf)
                .frame(width: size * 0.42, height: max(1, size * 0.18))
                .rotationEffect(.degrees(-28))
                .offset(x: size * 0.12, y: -size * 0.02)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

private struct JejuStoneBuddy: View {
    let accent: Color
    let phase: TapsoLiveActivityDisplayPhase

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 11, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [TapsoLiveActivityPalette.basaltLight, .black],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay {
                    RoundedRectangle(cornerRadius: 11, style: .continuous)
                        .stroke(accent.opacity(0.4), lineWidth: 0.8)
                }

            Capsule()
                .fill(accent.opacity(0.78))
                .frame(width: 21, height: 5)
                .offset(y: -11)

            HStack(spacing: 7) {
                Circle()
                Circle()
            }
            .foregroundStyle(.white.opacity(0.92))
            .frame(width: 13, height: 3)
            .offset(y: -2)

            HStack(spacing: 13) {
                Circle()
                Circle()
            }
            .foregroundStyle(TapsoLiveActivityPalette.tangerine.opacity(0.85))
            .frame(width: 18, height: 3)
            .offset(y: 4)

            JejuBuddyMouth(phase: phase, compact: false)
                .offset(y: 8)
        }
        .frame(width: 36, height: 36)
        .shadow(color: accent.opacity(0.2), radius: 7)
    }
}

private struct JejuBuddyMouth: View {
    let phase: TapsoLiveActivityDisplayPhase
    let compact: Bool

    @ViewBuilder
    var body: some View {
        switch phase {
        case .riding:
            JejuSmileShape()
                .stroke(
                    .white.opacity(0.78),
                    style: StrokeStyle(
                        lineWidth: compact ? 0.75 : 1.2,
                        lineCap: .round
                    )
                )
                .frame(width: compact ? 5 : 8, height: compact ? 2.5 : 4)
        case .prepare:
            Circle()
                .fill(.white.opacity(0.78))
                .frame(width: compact ? 1.8 : 3, height: compact ? 1.8 : 3)
        case .nextStop:
            Capsule()
                .fill(.white.opacity(0.82))
                .frame(width: compact ? 2 : 3.2, height: compact ? 3 : 5)
        case .arrived:
            JejuSmileShape()
                .stroke(
                    .white.opacity(0.88),
                    style: StrokeStyle(
                        lineWidth: compact ? 0.9 : 1.4,
                        lineCap: .round
                    )
                )
                .frame(width: compact ? 6 : 9, height: compact ? 3 : 5)
        case .delayed:
            Capsule()
                .fill(.white.opacity(0.72))
                .frame(width: compact ? 5 : 8, height: compact ? 1 : 1.5)
                .rotationEffect(.degrees(-12))
        case .checking:
            HStack(spacing: compact ? 1 : 2) {
                Circle()
                Circle()
            }
            .foregroundStyle(.white.opacity(0.72))
            .frame(width: compact ? 4 : 7, height: compact ? 1.2 : 2)
        }
    }
}

private struct JejuSmileShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addQuadCurve(
            to: CGPoint(x: rect.maxX, y: rect.minY),
            control: CGPoint(x: rect.midX, y: rect.maxY)
        )
        return path
    }
}

private struct JejuPostcardBackground: View {
    let accent: Color

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            TapsoLiveActivityPalette.basaltLight,
                            accent.opacity(0.15),
                            TapsoLiveActivityPalette.background
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            Circle()
                .fill(TapsoLiveActivityPalette.tangerine.opacity(0.2))
                .frame(width: 45, height: 45)
                .offset(x: 130, y: -25)

            JejuWaveShape(amplitude: 5)
                .stroke(TapsoLiveActivityPalette.seaFoam.opacity(0.19), lineWidth: 1)
                .frame(height: 22)
                .offset(y: 34)

            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(accent.opacity(0.26), lineWidth: 0.75)
        }
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct JejuWaveShape: Shape {
    let amplitude: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.midY))
        path.addCurve(
            to: CGPoint(x: rect.midX, y: rect.midY),
            control1: CGPoint(x: rect.width * 0.14, y: rect.midY - amplitude),
            control2: CGPoint(x: rect.width * 0.36, y: rect.midY + amplitude)
        )
        path.addCurve(
            to: CGPoint(x: rect.maxX, y: rect.midY),
            control1: CGPoint(x: rect.width * 0.64, y: rect.midY - amplitude),
            control2: CGPoint(x: rect.width * 0.86, y: rect.midY + amplitude)
        )
        return path
    }
}

private func remainingLabel(_ count: Int) -> String {
    String(format: String(localized: "remaining_widget_accessibility"), count)
}

private func compactAccessibilityLabel(
    for state: TapsoActivityAttributes.ContentState
) -> String {
    switch TapsoLiveActivityPolicy.displayPhase(for: state) {
    case .delayed:
        String(localized: "check_vehicle_display")
    case .checking:
        String(localized: "checking_instruction")
    default:
        remainingLabel(state.remainingStops)
    }
}

private let previewAttributes = TapsoActivityAttributes(
    routeNumber: "365",
    routeID: "demo-route-365-outbound",
    boardingStopName: "제주버스터미널",
    destinationName: "제주출입국·외국인청",
    totalStops: 8
)

private let previewDate = Date(timeIntervalSince1970: 1_800_000_000)
private let previewActive = TapsoActivityAttributes.ContentState(
    phase: .active,
    currentStopName: "제주버스터미널",
    nextStopName: "용문마을",
    remainingStops: 8,
    freshness: .fresh,
    updatedAt: previewDate
)
private let previewPreparing = TapsoActivityAttributes.ContentState(
    phase: .approachingDestination,
    currentStopName: "동문로터리",
    nextStopName: "제주여자상업고등학교",
    remainingStops: 2,
    freshness: .fresh,
    updatedAt: previewDate
)
private let previewNext = TapsoActivityAttributes.ContentState(
    phase: .nextStopIsDestination,
    currentStopName: "제주여자상업고등학교",
    nextStopName: "제주출입국·외국인청",
    remainingStops: 1,
    freshness: .fresh,
    updatedAt: previewDate
)
private let previewArrived = TapsoActivityAttributes.ContentState(
    phase: .arrived,
    currentStopName: "제주출입국·외국인청",
    nextStopName: nil,
    remainingStops: 0,
    freshness: .fresh,
    updatedAt: previewDate
)
private let previewChecking = TapsoActivityAttributes.ContentState(
    phase: .nextStopIsDestination,
    currentStopName: "동문로터리",
    nextStopName: "제주여자상업고등학교",
    remainingStops: 2,
    freshness: .fresh,
    updatedAt: previewDate
)
private let previewDelayed = TapsoActivityAttributes.ContentState(
    phase: .nextStopIsDestination,
    currentStopName: "제주여자상업고등학교",
    nextStopName: "제주출입국·외국인청",
    remainingStops: 1,
    freshness: .stale,
    updatedAt: previewDate
)

#Preview("Lock Screen · Prepare", as: .content, using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewPreparing
}

#Preview("Island · Compact Ride", as: .dynamicIsland(.compact), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewActive
}

#Preview("Island · Compact Next", as: .dynamicIsland(.compact), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewNext
}

#Preview("Island · Compact Prepare", as: .dynamicIsland(.compact), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewPreparing
}

#Preview("Island · Compact Checking", as: .dynamicIsland(.compact), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewChecking
}

#Preview("Island · Compact Delayed", as: .dynamicIsland(.compact), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewDelayed
}

#Preview("Island · Minimal", as: .dynamicIsland(.minimal), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewPreparing
}

#Preview("Island · Expanded Ride", as: .dynamicIsland(.expanded), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewActive
}

#Preview("Island · Expanded Prepare", as: .dynamicIsland(.expanded), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewPreparing
}

#Preview("Island · Expanded Next", as: .dynamicIsland(.expanded), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewNext
}

#Preview("Island · Expanded Arrived", as: .dynamicIsland(.expanded), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewArrived
}

#Preview("Island · Expanded Delayed", as: .dynamicIsland(.expanded), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewDelayed
}
