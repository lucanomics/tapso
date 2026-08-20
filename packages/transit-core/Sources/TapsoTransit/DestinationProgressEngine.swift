import Foundation

public enum DestinationProgressPhase: String, Codable, Hashable, Sendable {
    case active
    case approachingDestination
    case nextStopIsDestination
    case arrived
    case passedDestination
    case unknown
}

public enum DestinationProgressFailure: String, Error, Codable, Hashable, Sendable {
    case wrongRoute
    case routeVariantMismatch
    case destinationNotOnRoute
    case currentStopNotOnRoute
    case invalidStopOrdering
}

public struct DestinationProgress: Codable, Hashable, Sendable {
    public let currentStop: RouteStop
    public let destinationStop: RouteStop
    public let remainingStops: Int
    public let phase: DestinationProgressPhase
    public let freshness: DataFreshness
    public let observedAt: Date

    public init(
        currentStop: RouteStop,
        destinationStop: RouteStop,
        remainingStops: Int,
        phase: DestinationProgressPhase,
        freshness: DataFreshness,
        observedAt: Date
    ) {
        self.currentStop = currentStop
        self.destinationStop = destinationStop
        self.remainingStops = remainingStops
        self.phase = phase
        self.freshness = freshness
        self.observedAt = observedAt
    }
}

public struct DestinationProgressEngine: Sendable {
    public let freshnessPolicy: FreshnessPolicy

    public init(freshnessPolicy: FreshnessPolicy = .conservativeDefault) {
        self.freshnessPolicy = freshnessPolicy
    }

    public func calculate(
        observation: VehicleObservation,
        route: TransitRoute,
        plan: RidePlan,
        now: Date
    ) -> Result<DestinationProgress, DestinationProgressFailure> {
        guard observation.routeID == route.id, plan.routeID == route.id else {
            return .failure(.wrongRoute)
        }
        if let expectedVariant = plan.routeVariantID,
           observation.routeVariantID != expectedVariant || route.variantID != expectedVariant {
            return .failure(.routeVariantMismatch)
        }
        guard let destination = route.routeStop(id: plan.destinationStopID) else {
            return .failure(.destinationNotOnRoute)
        }
        guard let currentID = observation.confirmedStopID,
              let current = route.routeStop(id: currentID) else {
            return .failure(.currentStopNotOnRoute)
        }
        guard let boarding = route.routeStop(id: plan.boardingStopID),
              boarding.sequence < destination.sequence else {
            return .failure(.invalidStopOrdering)
        }

        let delta = destination.sequence - current.sequence
        let phase: DestinationProgressPhase
        switch delta {
        case let value where value < 0: phase = .passedDestination
        case 0: phase = .arrived
        case 1: phase = .nextStopIsDestination
        case 2: phase = .approachingDestination
        default: phase = .active
        }

        return .success(
            DestinationProgress(
                currentStop: current,
                destinationStop: destination,
                remainingStops: max(delta, 0),
                phase: phase,
                freshness: freshnessPolicy.classify(observedAt: observation.timestamp, relativeTo: now),
                observedAt: observation.timestamp
            )
        )
    }
}
