import Foundation
import TapsoTransit

enum TapsoLiveActivityMilestone: String, Equatable, Sendable {
    case prepare
    case nextStop
    case arrived
}

enum TapsoLiveActivityPolicy {
    static func milestone(
        for state: TapsoActivityAttributes.ContentState
    ) -> TapsoLiveActivityMilestone? {
        switch state.phase {
        case .approachingDestination:
            .prepare
        case .nextStopIsDestination:
            .nextStop
        case .arrived:
            .arrived
        default:
            nil
        }
    }

    static func relevanceScore(
        for state: TapsoActivityAttributes.ContentState
    ) -> Double {
        switch state.phase {
        case .arrived:
            100
        case .nextStopIsDestination:
            95
        case .approachingDestination:
            85
        case .dataAging, .dataStale:
            75
        default:
            50
        }
    }

    static func staleDate(
        for state: TapsoActivityAttributes.ContentState
    ) -> Date? {
        switch state.phase {
        case .arrived, .completed, .cancelled:
            nil
        default:
            state.updatedAt.addingTimeInterval(120)
        }
    }
}
