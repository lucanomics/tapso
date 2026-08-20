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
                        accent: phasePresentation(for: context.state.phase).accent
                    )
                }
                DynamicIslandExpandedRegion(.trailing) {
                    RemainingMetric(
                        remainingStops: context.state.remainingStops,
                        accent: phasePresentation(for: context.state.phase).accent,
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
                CompactTrailingView(state: context.state)
            } minimal: {
                MinimalJourneyView(state: context.state)
            }
            .keylineTint(phasePresentation(for: context.state.phase).accent)
            .widgetURL(URL(string: "tapso://ride/\(context.attributes.routeID)"))
        }
    }
}

private struct CompactLeadingView: View {
    let routeNumber: String
    let state: TapsoActivityAttributes.ContentState

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "bus.fill")
                .font(.caption2.weight(.bold))
            Text(verbatim: routeNumber)
                .font(.caption.weight(.black))
                .monospacedDigit()
        }
        .foregroundStyle(phasePresentation(for: state.phase).accent)
        .accessibilityLabel(
            String(format: String(localized: "route_accessibility"), routeNumber)
        )
    }
}

private struct CompactTrailingView: View {
    let state: TapsoActivityAttributes.ContentState

    var body: some View {
        Group {
            if state.freshness == .stale || state.phase == .dataStale {
                Label("compact_delayed", systemImage: "exclamationmark.triangle.fill")
                    .labelStyle(.titleAndIcon)
            } else {
                switch state.phase {
                case .arrived:
                    Label("compact_get_off", systemImage: "figure.walk")
                case .nextStopIsDestination:
                    Label("compact_next", systemImage: "bell.fill")
                case .approachingDestination:
                    HStack(spacing: 3) {
                        Text("compact_prepare")
                        Text(state.remainingStops, format: .number)
                            .fontWeight(.black)
                    }
                default:
                    HStack(spacing: 3) {
                        Text(state.remainingStops, format: .number)
                            .fontWeight(.black)
                            .contentTransition(.numericText())
                        Text("compact_stops")
                            .font(.caption2)
                    }
                }
            }
        }
        .font(.caption2.weight(.bold))
        .foregroundStyle(phasePresentation(for: state.phase).accent)
        .accessibilityLabel(remainingLabel(state.remainingStops))
    }
}

private struct MinimalJourneyView: View {
    let state: TapsoActivityAttributes.ContentState

    var body: some View {
        ZStack {
            Circle()
                .fill(phasePresentation(for: state.phase).accent.opacity(0.2))
            if state.freshness == .stale || state.phase == .dataStale {
                Image(systemName: "exclamationmark")
            } else if state.phase == .arrived {
                Image(systemName: "figure.walk")
            } else {
                Text(state.remainingStops, format: .number)
                    .monospacedDigit()
            }
        }
        .font(.caption2.weight(.black))
        .foregroundStyle(phasePresentation(for: state.phase).accent)
        .accessibilityLabel(remainingLabel(state.remainingStops))
    }
}

private struct LockScreenJourneyView: View {
    let context: ActivityViewContext<TapsoActivityAttributes>

    private var presentation: PhasePresentation {
        phasePresentation(for: context.state.phase)
    }

    var body: some View {
        ZStack {
            JourneyAmbientBackground(accent: presentation.accent)

            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    RouteMark(
                        routeNumber: context.attributes.routeNumber,
                        accent: presentation.accent
                    )
                    LiveDataStatus(
                        freshness: context.state.freshness,
                        isStale: context.isStale,
                        accent: presentation.accent
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
                context.state.remainingStops
            )
        )
    }
}

private struct PhaseEyebrow: View {
    let state: TapsoActivityAttributes.ContentState

    var body: some View {
        PhaseBadge(
            presentation: phasePresentation(for: state.phase),
            compact: true
        )
    }
}

private struct ExpandedJourneyView: View {
    let context: ActivityViewContext<TapsoActivityAttributes>

    private var presentation: PhasePresentation {
        phasePresentation(for: context.state.phase)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 9) {
                MilestoneGlyph(presentation: presentation)

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
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .background {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            presentation.accent.opacity(0.15),
                            presentation.accent.opacity(0.035)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(presentation.accent.opacity(0.2), lineWidth: 0.75)
                }
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
                let markerSize = 12.0
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

                    Circle()
                        .fill(accent)
                        .frame(width: markerSize, height: markerSize)
                        .overlay {
                            Image(systemName: remainingStops == 0 ? "flag.fill" : "bus.fill")
                                .font(.system(size: 6, weight: .black))
                                .foregroundStyle(TapsoLiveActivityPalette.background)
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
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
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

    var body: some View {
        Image(systemName: presentation.symbolName)
            .font(.headline.weight(.bold))
            .foregroundStyle(TapsoLiveActivityPalette.background)
            .frame(width: 32, height: 32)
            .background {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [presentation.accent, presentation.accent.opacity(0.72)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .shadow(color: presentation.accent.opacity(0.32), radius: 7)
            }
    }
}

private struct LiveDataStatus: View {
    let freshness: DataFreshness
    let isStale: Bool
    let accent: Color
    var iconOnly = false

    var body: some View {
        Group {
            if iconOnly {
                Image(
                    systemName: isDelayed
                        ? "exclamationmark.triangle.fill"
                        : "wave.3.right"
                )
                .foregroundStyle(isDelayed ? TapsoLiveActivityPalette.amber : accent)
                .accessibilityLabel(isDelayed ? "compact_delayed" : "tracking_live")
            } else {
                HStack(spacing: 4) {
                    Circle()
                        .fill(isDelayed ? TapsoLiveActivityPalette.amber : accent)
                        .frame(width: 6, height: 6)
                    Text(isDelayed ? "compact_delayed" : "tracking_live")
                }
            }
        }
        .font(.caption2.weight(.bold))
        .foregroundStyle(.white.opacity(0.6))
    }

    private var isDelayed: Bool {
        isStale || freshness == .stale || freshness == .aging
    }
}

private struct RouteMark: View {
    let routeNumber: String
    let accent: Color

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: "bus.fill")
                .font(.caption2.weight(.bold))
            Text(verbatim: routeNumber)
                .font(.system(.headline, design: .rounded, weight: .black))
                .monospacedDigit()
        }
        .foregroundStyle(.black)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
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
                        ? .system(.title2, design: .rounded, weight: .black)
                        : .system(size: 42, weight: .black, design: .rounded)
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
}

private func phasePresentation(for state: JourneyState) -> PhasePresentation {
    switch state {
    case .approachingDestination:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.amber,
            eyebrow: "get_ready",
            instruction: "prepare_to_get_off",
            symbolName: "figure.stand"
        )
    case .nextStopIsDestination:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.coral,
            eyebrow: "next_stop_destination",
            instruction: "get_off_next",
            symbolName: "bell.fill"
        )
    case .arrived:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.coral,
            eyebrow: "arrived",
            instruction: "get_off_now",
            symbolName: "figure.walk"
        )
    case .dataAging, .dataStale:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.amber,
            eyebrow: "data_delayed",
            instruction: "check_vehicle_display",
            symbolName: "exclamationmark.triangle.fill"
        )
    default:
        PhasePresentation(
            accent: TapsoLiveActivityPalette.mint,
            eyebrow: "on_the_way",
            instruction: "island_tracking_message",
            symbolName: "bus.fill"
        )
    }
}

private enum TapsoLiveActivityPalette {
    static let mint = Color(red: 0.18, green: 0.78, blue: 0.66)
    static let amber = Color(red: 1.00, green: 0.72, blue: 0.24)
    static let coral = Color(red: 1.00, green: 0.38, blue: 0.32)
    static let background = Color(red: 0.025, green: 0.045, blue: 0.055)
}

private func remainingLabel(_ count: Int) -> String {
    String(format: String(localized: "remaining_widget_accessibility"), count)
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
