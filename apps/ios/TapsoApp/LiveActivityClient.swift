@preconcurrency import ActivityKit
import Foundation

@MainActor
final class LiveActivityClient {
    private var activity: Activity<TapsoActivityAttributes>?

    var activityID: String? { activity?.id }
    var activitiesEnabled: Bool { ActivityAuthorizationInfo().areActivitiesEnabled }

    func start(
        attributes: TapsoActivityAttributes,
        state: TapsoActivityAttributes.ContentState
    ) throws {
        guard activitiesEnabled else { throw LiveActivityError.disabled }
        let content = ActivityContent(
            state: state,
            staleDate: state.updatedAt.addingTimeInterval(120)
        )
        activity = try Activity.request(
            attributes: attributes,
            content: content,
            pushType: nil
        )
    }

    func update(state: TapsoActivityAttributes.ContentState) async {
        guard let activity else { return }
        let content = ActivityContent(
            state: state,
            staleDate: state.updatedAt.addingTimeInterval(120)
        )
        await activity.update(content)
    }

    func end(
        state: TapsoActivityAttributes.ContentState,
        immediately: Bool = false
    ) async {
        guard let activity else { return }
        let content = ActivityContent(state: state, staleDate: nil)
        let policy: ActivityUIDismissalPolicy = immediately
            ? .immediate
            : .after(Date().addingTimeInterval(60))
        await activity.end(content, dismissalPolicy: policy)
        self.activity = nil
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
