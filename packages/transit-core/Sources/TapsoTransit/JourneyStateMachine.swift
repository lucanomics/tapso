import Foundation

public enum JourneyState: String, Codable, Hashable, Sendable {
    case idle
    case planning
    case waitingForBoarding
    case matchingVehicle
    case vehicleConfirmationRequired
    case active
    case approachingDestination
    case nextStopIsDestination
    case arrived
    case dataAging
    case dataStale
    case vehicleTemporarilyLost
    case vehicleRecovery
    case cancelled
    case completed
}

public enum JourneyEvent: Hashable, Sendable {
    case beginPlanning
    case planReady
    case boarded
    case matchSelected
    case matchAmbiguous
    case vehicleConfirmed
    case progress(DestinationProgress)
    case vehicleLost
    case vehicleRecovered
    case cancel
    case complete
}

public struct JourneyTransition: Hashable, Sendable {
    public let from: JourneyState
    public let event: JourneyEvent
    public let to: JourneyState
    public let accepted: Bool

    public init(from: JourneyState, event: JourneyEvent, to: JourneyState, accepted: Bool) {
        self.from = from
        self.event = event
        self.to = to
        self.accepted = accepted
    }
}

public struct JourneyStateMachine: Sendable {
    public private(set) var state: JourneyState

    public init(state: JourneyState = .idle) {
        self.state = state
    }

    @discardableResult
    public mutating func handle(_ event: JourneyEvent) -> JourneyTransition {
        let previous = state
        let next = reduce(state: state, event: event)
        state = next ?? state
        return JourneyTransition(from: previous, event: event, to: state, accepted: next != nil)
    }

    private func reduce(state: JourneyState, event: JourneyEvent) -> JourneyState? {
        if case .cancel = event, ![JourneyState.completed, .cancelled].contains(state) {
            return .cancelled
        }

        switch (state, event) {
        case (.idle, .beginPlanning):
            return .planning
        case (.planning, .planReady):
            return .waitingForBoarding
        case (.waitingForBoarding, .boarded):
            return .matchingVehicle
        case (.matchingVehicle, .matchSelected):
            return .active
        case (.matchingVehicle, .matchAmbiguous):
            return .vehicleConfirmationRequired
        case (.vehicleConfirmationRequired, .vehicleConfirmed):
            return .active
        case (.active, .vehicleLost),
             (.dataAging, .vehicleLost),
             (.dataStale, .vehicleLost):
            return .vehicleTemporarilyLost
        case (.vehicleTemporarilyLost, .vehicleRecovered):
            return .vehicleRecovery
        case (.vehicleRecovery, .progress):
            return stateForProgress(event)
        case (.active, .progress),
             (.approachingDestination, .progress),
             (.nextStopIsDestination, .progress),
             (.dataAging, .progress),
             (.dataStale, .progress):
            return stateForProgress(event)
        case (.arrived, .complete), (.cancelled, .complete):
            return .completed
        default:
            return nil
        }
    }

    private func stateForProgress(_ event: JourneyEvent) -> JourneyState? {
        guard case let .progress(progress) = event else { return nil }
        switch progress.freshness {
        case .stale, .unknown:
            return .dataStale
        case .aging:
            return .dataAging
        case .fresh:
            switch progress.phase {
            case .active: return .active
            case .approachingDestination: return .approachingDestination
            case .nextStopIsDestination: return .nextStopIsDestination
            case .arrived, .passedDestination: return .arrived
            case .unknown: return .dataStale
            }
        }
    }
}

public enum RideSessionUpdate: Hashable, Sendable {
    case applied(DestinationProgress)
    case duplicate
    case outOfOrder
    case wrongVehicle
    case progressFailure(DestinationProgressFailure)
}

public struct RideSession: Identifiable, Codable, Hashable, Sendable {
    public let id: UUID
    public let plan: RidePlan
    public let startedAt: Date
    public private(set) var matchedVehicleID: VehicleIdentifier?
    public private(set) var state: JourneyState
    public private(set) var latestObservation: VehicleObservation?
    public private(set) var latestProgress: DestinationProgress?
    public private(set) var liveActivityID: String?

    public init(
        id: UUID = UUID(),
        plan: RidePlan,
        startedAt: Date,
        matchedVehicleID: VehicleIdentifier? = nil,
        state: JourneyState = .waitingForBoarding,
        latestObservation: VehicleObservation? = nil,
        latestProgress: DestinationProgress? = nil,
        liveActivityID: String? = nil
    ) {
        self.id = id
        self.plan = plan
        self.startedAt = startedAt
        self.matchedVehicleID = matchedVehicleID
        self.state = state
        self.latestObservation = latestObservation
        self.latestProgress = latestProgress
        self.liveActivityID = liveActivityID
    }

    public mutating func recordMatch(_ result: VehicleMatchResult) {
        matchedVehicleID = result.selectedVehicle?.vehicleID
        state = result.selectedVehicle == nil ? .vehicleConfirmationRequired : .active
    }

    public mutating func confirm(vehicleID: VehicleIdentifier) {
        matchedVehicleID = vehicleID
        state = .active
    }

    public mutating func attachLiveActivity(id: String?) {
        liveActivityID = id
    }

    public mutating func markVehicleLost() {
        guard ![JourneyState.completed, .cancelled, .arrived].contains(state) else { return }
        state = .vehicleTemporarilyLost
    }

    public mutating func apply(
        observation: VehicleObservation,
        route: TransitRoute,
        now: Date,
        engine: DestinationProgressEngine = .init()
    ) -> RideSessionUpdate {
        guard observation.vehicleID == matchedVehicleID else { return .wrongVehicle }
        if let latestObservation {
            if observation.timestamp == latestObservation.timestamp { return .duplicate }
            if observation.timestamp < latestObservation.timestamp { return .outOfOrder }
        }

        switch engine.calculate(observation: observation, route: route, plan: plan, now: now) {
        case let .failure(error):
            return .progressFailure(error)
        case let .success(progress):
            latestObservation = observation
            latestProgress = progress
            state = Self.state(for: progress)
            return .applied(progress)
        }
    }

    public mutating func complete() {
        state = .completed
    }

    public mutating func cancel() {
        state = .cancelled
    }

    private static func state(for progress: DestinationProgress) -> JourneyState {
        switch progress.freshness {
        case .stale, .unknown: return .dataStale
        case .aging: return .dataAging
        case .fresh:
            switch progress.phase {
            case .active: return .active
            case .approachingDestination: return .approachingDestination
            case .nextStopIsDestination: return .nextStopIsDestination
            case .arrived, .passedDestination: return .arrived
            case .unknown: return .dataStale
            }
        }
    }
}
