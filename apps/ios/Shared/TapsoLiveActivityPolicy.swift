import Foundation
import TapsoTransit

enum TapsoLiveActivityMilestone: String, Equatable, Sendable {
    case prepare
    case nextStop
    case arrived
}

enum TapsoLiveActivityDisplayPhase: String, Equatable, Sendable {
    case riding
    case prepare
    case nextStop
    case arrived
    case delayed
    case checking
}

enum TapsoLiveActivityPolicy {
    static func displayPhase(
        for state: TapsoActivityAttributes.ContentState
    ) -> TapsoLiveActivityDisplayPhase {
        guard state.remainingStops >= 0 else { return .checking }

        if state.phase == .completed || state.phase == .cancelled {
            return .checking
        }
        if state.freshness == .stale
            || state.phase == .dataStale
            || state.phase == .vehicleTemporarilyLost {
            return .delayed
        }
        if state.freshness == .unknown
            || state.phase == .vehicleRecovery {
            return .checking
        }
        if state.freshness == .aging || state.phase == .dataAging {
            return .delayed
        }

        switch (state.phase, state.remainingStops) {
        case (.approachingDestination, 2):
            return .prepare
        case (.nextStopIsDestination, 1):
            return .nextStop
        case (.arrived, 0):
            return .arrived
        case (.active, 3...):
            return .riding
        default:
            return .checking
        }
    }

    static func milestone(
        for state: TapsoActivityAttributes.ContentState
    ) -> TapsoLiveActivityMilestone? {
        switch displayPhase(for: state) {
        case .prepare:
            .prepare
        case .nextStop:
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
        switch displayPhase(for: state) {
        case .arrived:
            100
        case .nextStop:
            95
        case .prepare:
            85
        case .delayed, .checking:
            75
        default:
            50
        }
    }

    static func staleDate(
        for state: TapsoActivityAttributes.ContentState
    ) -> Date? {
        if state.phase == .completed
            || state.phase == .cancelled
            || displayPhase(for: state) == .arrived {
            nil
        } else {
            state.updatedAt.addingTimeInterval(120)
        }
    }
}
