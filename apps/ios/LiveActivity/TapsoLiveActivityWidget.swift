import ActivityKit
import SwiftUI
import TapsoTransit
import WidgetKit

struct TapsoLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TapsoActivityAttributes.self) { context in
            LockScreenJourneyView(context: context)
                .activityBackgroundTint(.black)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    RouteBadge(routeNumber: context.attributes.routeNumber)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    RemainingStopsView(
                        remainingStops: context.state.remainingStops,
                        compact: true
                    )
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(phaseLabel(for: context.state.phase))
                        .font(.caption.weight(.bold))
                        .foregroundStyle(phaseColor(for: context.state.phase))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ExpandedJourneyView(context: context)
                }
            } compactLeading: {
                Text(verbatim: context.attributes.routeNumber)
                    .font(.caption.weight(.black))
                    .foregroundStyle(tapsoMint)
                    .accessibilityLabel(
                        String(
                            format: String(localized: "route_accessibility"),
                            context.attributes.routeNumber
                        )
                    )
            } compactTrailing: {
                HStack(spacing: 3) {
                    Text(context.state.remainingStops, format: .number)
                        .fontWeight(.black)
                    Text("stops_compact")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .accessibilityLabel(remainingLabel(context.state.remainingStops))
            } minimal: {
                Text(context.state.remainingStops, format: .number)
                    .font(.caption2.weight(.black))
                    .foregroundStyle(phaseColor(for: context.state.phase))
                    .accessibilityLabel(remainingLabel(context.state.remainingStops))
            }
            .keylineTint(phaseColor(for: context.state.phase))
            .widgetURL(URL(string: "tapso://ride/\(context.attributes.routeID)"))
        }
    }

    private var tapsoMint: Color {
        Color(red: 0.18, green: 0.78, blue: 0.66)
    }

    private func phaseColor(for state: JourneyState) -> Color {
        switch state {
        case .approachingDestination:
            Color(red: 1.00, green: 0.72, blue: 0.24)
        case .nextStopIsDestination, .arrived:
            Color(red: 1.00, green: 0.38, blue: 0.32)
        default:
            tapsoMint
        }
    }

    private func phaseLabel(for state: JourneyState) -> String {
        switch state {
        case .approachingDestination: String(localized: "get_ready")
        case .nextStopIsDestination: String(localized: "next_stop_destination")
        case .arrived: String(localized: "get_off")
        case .dataAging, .dataStale: String(localized: "data_delayed")
        default: String(localized: "on_the_way")
        }
    }

    private func remainingLabel(_ count: Int) -> String {
        String(format: String(localized: "remaining_widget_accessibility"), count)
    }
}

private struct LockScreenJourneyView: View {
    let context: ActivityViewContext<TapsoActivityAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                RouteBadge(routeNumber: context.attributes.routeNumber)
                Spacer()
                Text(statusText)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(statusColor)
            }

            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("destination")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(verbatim: context.attributes.destinationName)
                        .font(.headline)
                        .lineLimit(1)
                    Text(verbatim: context.state.currentStopName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 12)
                RemainingStopsView(
                    remainingStops: context.state.remainingStops,
                    compact: false
                )
            }
        }
        .padding(16)
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

    private var statusText: String {
        if context.isStale || context.state.freshness == .stale {
            return String(localized: "data_delayed")
        }
        switch context.state.phase {
        case .approachingDestination: return String(localized: "get_ready")
        case .nextStopIsDestination: return String(localized: "next_stop_destination")
        case .arrived: return String(localized: "get_off")
        default: return String(localized: "live")
        }
    }

    private var statusColor: Color {
        switch context.state.phase {
        case .approachingDestination: .orange
        case .nextStopIsDestination, .arrived: .red
        default: Color(red: 0.18, green: 0.78, blue: 0.66)
        }
    }
}

private struct ExpandedJourneyView: View {
    let context: ActivityViewContext<TapsoActivityAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Label {
                Text(verbatim: context.attributes.destinationName)
                    .lineLimit(1)
            } icon: {
                Image(systemName: "flag.checkered")
            }
            .font(.headline)

            HStack {
                Label {
                    Text(verbatim: context.state.currentStopName)
                        .lineLimit(1)
                } icon: {
                    Image(systemName: "bus.fill")
                }
                .font(.caption)
                .foregroundStyle(.secondary)

                Spacer()

                if let next = context.state.nextStopName {
                    Text(verbatim: next)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .padding(.top, 2)
    }
}

private struct RouteBadge: View {
    let routeNumber: String

    var body: some View {
        Text(verbatim: routeNumber)
            .font(.system(.headline, design: .rounded, weight: .black))
            .foregroundStyle(.black)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Color(red: 0.18, green: 0.78, blue: 0.66), in: Capsule())
    }
}

private struct RemainingStopsView: View {
    let remainingStops: Int
    let compact: Bool

    var body: some View {
        VStack(alignment: .trailing, spacing: 0) {
            Text(remainingStops, format: .number)
                .font(
                    compact
                        ? .system(.title2, design: .rounded, weight: .black)
                        : .system(size: 38, weight: .black, design: .rounded)
                )
                .contentTransition(.numericText())
            Text("stops_remaining")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }
}

private let previewAttributes = TapsoActivityAttributes(
    routeNumber: "365",
    routeID: "demo-route-365-outbound",
    boardingStopName: "제주버스터미널",
    destinationName: "제주출입국·외국인청"
)

private let previewContentState = TapsoActivityAttributes.ContentState(
    phase: .approachingDestination,
    currentStopName: "동문로터리",
    nextStopName: "제주여자상업고등학교",
    remainingStops: 2,
    freshness: .fresh,
    updatedAt: .now
)

#Preview("Lock Screen", as: .content, using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewContentState
}

#Preview("Dynamic Island Compact", as: .dynamicIsland(.compact), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewContentState
}

#Preview("Dynamic Island Expanded", as: .dynamicIsland(.expanded), using: previewAttributes) {
    TapsoLiveActivityWidget()
} contentStates: {
    previewContentState
}
