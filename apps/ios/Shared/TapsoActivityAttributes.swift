import ActivityKit
import Foundation
import TapsoTransit

public struct TapsoActivityAttributes: ActivityAttributes, Sendable {
    public struct ContentState: Codable, Hashable, Sendable {
        public let phase: JourneyState
        public let currentStopName: String
        public let nextStopName: String?
        public let remainingStops: Int
        public let freshness: DataFreshness
        public let updatedAt: Date

        public init(
            phase: JourneyState,
            currentStopName: String,
            nextStopName: String?,
            remainingStops: Int,
            freshness: DataFreshness,
            updatedAt: Date
        ) {
            self.phase = phase
            self.currentStopName = currentStopName
            self.nextStopName = nextStopName
            self.remainingStops = remainingStops
            self.freshness = freshness
            self.updatedAt = updatedAt
        }
    }

    public let routeNumber: String
    public let routeID: String
    public let boardingStopName: String
    public let destinationName: String
    public let totalStops: Int

    public init(
        routeNumber: String,
        routeID: String,
        boardingStopName: String,
        destinationName: String,
        totalStops: Int
    ) {
        self.routeNumber = routeNumber
        self.routeID = routeID
        self.boardingStopName = boardingStopName
        self.destinationName = destinationName
        self.totalStops = totalStops
    }
}
