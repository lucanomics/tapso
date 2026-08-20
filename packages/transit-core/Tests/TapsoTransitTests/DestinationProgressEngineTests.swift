import XCTest
@testable import TapsoTransit

final class DestinationProgressEngineTests: XCTestCase {
    private let engine = DestinationProgressEngine()
    private let route = DemoFixtures.route
    private let plan = DemoFixtures.plan
    private let now = DemoFixtures.referenceDate

    func testEightStopsRemaining() throws {
        let progress = try value(for: DemoFixtures.observation(stopSequence: 0))
        XCTAssertEqual(progress.remainingStops, 8)
        XCTAssertEqual(progress.phase, .active)
    }

    func testNormalProgressionIsDeterministic() throws {
        let values = try (0...8).map {
            try value(for: DemoFixtures.observation(stopSequence: $0, seconds: Double($0)))
        }
        XCTAssertEqual(values.map(\.remainingStops), Array((0...8).reversed()))
    }

    func testTwoStopsMeansApproaching() throws {
        let progress = try value(for: DemoFixtures.observation(stopSequence: 6))
        XCTAssertEqual(progress.remainingStops, 2)
        XCTAssertEqual(progress.phase, .approachingDestination)
    }

    func testOneStopMeansNextStop() throws {
        let progress = try value(for: DemoFixtures.observation(stopSequence: 7))
        XCTAssertEqual(progress.remainingStops, 1)
        XCTAssertEqual(progress.phase, .nextStopIsDestination)
    }

    func testDestinationReached() throws {
        let progress = try value(for: DemoFixtures.observation(stopSequence: 8))
        XCTAssertEqual(progress.remainingStops, 0)
        XCTAssertEqual(progress.phase, .arrived)
    }

    func testDestinationPassed() throws {
        let progress = try value(for: DemoFixtures.observation(stopSequence: 9))
        XCTAssertEqual(progress.remainingStops, 0)
        XCTAssertEqual(progress.phase, .passedDestination)
    }

    func testSkippedObservationUsesOrderedStopSequence() throws {
        let fromEight = try value(for: DemoFixtures.observation(stopSequence: 0))
        let toTwo = try value(for: DemoFixtures.observation(stopSequence: 6, seconds: 10))
        XCTAssertEqual(fromEight.remainingStops, 8)
        XCTAssertEqual(toTwo.remainingStops, 2)
    }

    func testStaleUpdateIsExplicit() throws {
        let observation = DemoFixtures.observation(stopSequence: 3, seconds: -121)
        XCTAssertEqual(try value(for: observation).freshness, .stale)
    }

    func testWrongRouteFails() {
        let observation = DemoFixtures.observation(stopSequence: 0, routeID: "other-route")
        XCTAssertEqual(failure(for: observation), .wrongRoute)
    }

    func testDestinationNotPresentFails() {
        let invalid = RidePlan(
            routeID: route.id,
            routeVariantID: route.variantID,
            direction: .outbound,
            boardingStopID: plan.boardingStopID,
            destinationStopID: "missing"
        )
        let result = engine.calculate(
            observation: DemoFixtures.observation(stopSequence: 0),
            route: route,
            plan: invalid,
            now: now
        )
        XCTAssertEqual(result.failure, .destinationNotOnRoute)
    }

    func testWrongRouteDirectionIsCaughtByRouteIdentityAtProgressBoundary() {
        let observation = DemoFixtures.observation(
            stopSequence: 0,
            routeID: "inbound-route",
            direction: .inbound
        )
        XCTAssertEqual(failure(for: observation), .wrongRoute)
    }

    func testRouteVariantMismatchFailsClosed() {
        let observation = DemoFixtures.observation(stopSequence: 0, routeVariantID: "branch")
        XCTAssertEqual(failure(for: observation), .routeVariantMismatch)
    }

    private func value(for observation: VehicleObservation) throws -> DestinationProgress {
        try engine.calculate(observation: observation, route: route, plan: plan, now: now).get()
    }

    private func failure(for observation: VehicleObservation) -> DestinationProgressFailure? {
        engine.calculate(observation: observation, route: route, plan: plan, now: now).failure
    }
}

private extension Result {
    var failure: Failure? {
        guard case let .failure(error) = self else { return nil }
        return error
    }
}
