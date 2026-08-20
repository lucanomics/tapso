@preconcurrency import ActivityKit
import Foundation

@MainActor
final class LiveActivityClient {
    private var activity: Activity<TapsoActivityAttributes>?
    private var lastAlertedMilestone: TapsoLiveActivityMilestone?

    init() {
        activity = Activity<TapsoActivityAttributes>.activities.first {
            switch $0.activityState {
            case .active, .stale:
                true
            default:
                false
            }
        }
        if let activity {
            lastAlertedMilestone = TapsoLiveActivityPolicy.milestone(
                for: activity.content.state
            )
        }
    }

    var activityID: String? { activity?.id }
    var activitiesEnabled: Bool { ActivityAuthorizationInfo().areActivitiesEnabled }

    func start(
        attributes: TapsoActivityAttributes,
        state: TapsoActivityAttributes.ContentState
    ) async throws {
        guard activitiesEnabled else { throw LiveActivityError.disabled }
        for existing in Activity<TapsoActivityAttributes>.activities {
            await existing.end(nil, dismissalPolicy: .immediate)
        }
        activity = nil
        lastAlertedMilestone = nil
        let content = content(for: state)
        activity = try Activity.request(
            attributes: attributes,
            content: content,
            pushType: nil
        )
    }

    func update(state: TapsoActivityAttributes.ContentState) async {
        guard let activity else { return }
        let milestone = TapsoLiveActivityPolicy.milestone(for: state)
        let alert = milestone == lastAlertedMilestone
            ? nil
            : alertConfiguration(for: milestone)
        await activity.update(
            content(for: state),
            alertConfiguration: alert
        )
        lastAlertedMilestone = milestone ?? lastAlertedMilestone
    }

    func end(
        state: TapsoActivityAttributes.ContentState,
        immediately: Bool = false
    ) async {
        guard let activity else { return }
        let content = ActivityContent(
            state: state,
            staleDate: nil,
            relevanceScore: TapsoLiveActivityPolicy.relevanceScore(for: state)
        )
        let policy: ActivityUIDismissalPolicy = immediately
            ? .immediate
            : .after(Date().addingTimeInterval(60))
        await activity.end(content, dismissalPolicy: policy)
        self.activity = nil
        lastAlertedMilestone = nil
    }

    private func content(
        for state: TapsoActivityAttributes.ContentState
    ) -> ActivityContent<TapsoActivityAttributes.ContentState> {
        ActivityContent(
            state: state,
            staleDate: TapsoLiveActivityPolicy.staleDate(for: state),
            relevanceScore: TapsoLiveActivityPolicy.relevanceScore(for: state)
        )
    }

    private func alertConfiguration(
        for milestone: TapsoLiveActivityMilestone?
    ) -> AlertConfiguration? {
        guard let milestone else { return nil }
        return switch milestone {
        case .prepare:
            AlertConfiguration(
                title: LocalizedStringResource("alert_prepare_title"),
                body: LocalizedStringResource("alert_prepare_body"),
                sound: .default
            )
        case .nextStop:
            AlertConfiguration(
                title: LocalizedStringResource("alert_next_title"),
                body: LocalizedStringResource("alert_next_body"),
                sound: .default
            )
        case .arrived:
            AlertConfiguration(
                title: LocalizedStringResource("alert_arrived_title"),
                body: LocalizedStringResource("alert_arrived_body"),
                sound: .default
            )
        }
    }
}

enum LiveActivityError: LocalizedError {
    case disabled

    var errorDescription: String? {
        switch self {
        case .disabled:
            String(localized: "live_activity_disabled")
        }
    }
}
