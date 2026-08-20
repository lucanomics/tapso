import Foundation
import Observation
import TapsoTransit
import UIKit

enum DemoSpeed: String, CaseIterable, Identifiable {
    case one = "1×"
    case five = "5×"
    case ten = "10×"
    case manual = "Step"

    var id: Self { self }

    var interval: Duration? {
        switch self {
        case .one: .seconds(4)
        case .five: .milliseconds(800)
        case .ten: .milliseconds(400)
        case .manual: nil
        }
    }
}

@Observable
@MainActor
final class TapsoAppModel {
    private(set) var session: RideSession?
    private(set) var matchResult: VehicleMatchResult?
    private(set) var errorMessage: String?
    var speed: DemoSpeed = .manual

    @ObservationIgnored
    private let route = DemoFixtures.route
    @ObservationIgnored
    private let timeline = DemoFixtures.demoTimeline()
    @ObservationIgnored
    private let liveActivity = LiveActivityClient()
    @ObservationIgnored
    private var playbackTask: Task<Void, Never>?
    @ObservationIgnored
    private var timelineIndex = 0

    var hasActiveRide: Bool { session != nil }
    var currentProgress: DestinationProgress? { session?.latestProgress }
    var currentState: JourneyState { session?.state ?? .idle }
    var remainingStops: Int { currentProgress?.remainingStops ?? 8 }
    var currentStopName: String {
        currentProgress?.currentStop.stop.name ?? route.stops[0].stop.name
    }
    var destinationName: String {
        route.routeStop(id: DemoFixtures.plan.destinationStopID)?.stop.name ?? ""
    }
    var nextStopName: String? {
        guard let progress = currentProgress else { return route.stops.dropFirst().first?.stop.name }
        return route.stops.first { $0.sequence == progress.currentStop.sequence + 1 }?.stop.name
    }
    var liveActivityStatus: String {
        liveActivity.activityID == nil
            ? String(localized: "activity_not_running")
            : String(localized: "activity_running")
    }

    func startDemo() async {
        playbackTask?.cancel()
        errorMessage = nil
        timelineIndex = 0

        let now = DemoFixtures.referenceDate
        let matching = VehicleMatchingEngine().match(
            VehicleMatchingInput(
                plan: DemoFixtures.plan,
                route: route,
                boarding: BoardingContext(tappedAt: now),
                candidates: [DemoFixtures.obviousCandidate()],
                now: now
            )
        )
        matchResult = matching

        var newSession = RideSession(
            plan: DemoFixtures.plan,
            startedAt: now,
            state: .matchingVehicle
        )
        newSession.recordMatch(matching)
        guard newSession.matchedVehicleID != nil else {
            session = newSession
            return
        }
        _ = newSession.apply(
            observation: timeline[0],
            route: route,
            now: timeline[0].timestamp
        )
        session = newSession

        let attributes = TapsoActivityAttributes(
            routeNumber: route.number,
            routeID: route.id.rawValue,
            boardingStopName: route.stops[0].stop.name,
            destinationName: destinationName
        )
        do {
            try liveActivity.start(attributes: attributes, state: contentState())
            session?.attachLiveActivity(id: liveActivity.activityID)
        } catch {
            errorMessage = error.localizedDescription
        }
        beginPlaybackIfNeeded()
    }

    func advanceDemo() async {
        guard var current = session, timelineIndex + 1 < timeline.count else { return }
        timelineIndex += 1
        let observation = timeline[timelineIndex]
        let result = current.apply(observation: observation, route: route, now: observation.timestamp)
        guard case .applied = result else { return }
        session = current
        notifyForMilestone()
        await liveActivity.update(state: contentState())
    }

    func finishRide() async {
        playbackTask?.cancel()
        guard var current = session else { return }
        current.complete()
        session = current
        await liveActivity.end(state: contentState())
        session = nil
        matchResult = nil
        timelineIndex = 0
    }

    func cancelRide() async {
        playbackTask?.cancel()
        guard var current = session else { return }
        current.cancel()
        session = current
        await liveActivity.end(state: contentState(), immediately: true)
        session = nil
        matchResult = nil
        timelineIndex = 0
    }

    func speedChanged() {
        playbackTask?.cancel()
        beginPlaybackIfNeeded()
    }

    private func beginPlaybackIfNeeded() {
        guard let interval = speed.interval else { return }
        playbackTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: interval)
                guard !Task.isCancelled, let self else { return }
                if self.remainingStops == 0 { return }
                await self.advanceDemo()
            }
        }
    }

    private func contentState() -> TapsoActivityAttributes.ContentState {
        TapsoActivityAttributes.ContentState(
            phase: currentState,
            currentStopName: currentStopName,
            nextStopName: nextStopName,
            remainingStops: remainingStops,
            freshness: currentProgress?.freshness ?? .unknown,
            updatedAt: currentProgress?.observedAt ?? Date()
        )
    }

    private func notifyForMilestone() {
        switch remainingStops {
        case 2:
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case 1, 0:
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        default:
            break
        }
    }
}
