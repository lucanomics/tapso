import XCTest
@testable import TapsoTransit

final class JourneyStateMachineTests: XCTestCase {
    func testPlanningToActiveFlow() {
        var machine = JourneyStateMachine()
        XCTAssertEqual(machine.handle(.beginPlanning).to, .planning)
        XCTAssertEqual(machine.handle(.planReady).to, .waitingForBoarding)
        XCTAssertEqual(machine.handle(.boarded).to, .matchingVehicle)
        XCTAssertEqual(machine.handle(.matchSelected).to, .active)
    }

    func testAmbiguousMatchRequiresConfirmation() {
        var machine = JourneyStateMachine(state: .matchingVehicle)
        XCTAssertEqual(machine.handle(.matchAmbiguous).to, .vehicleConfirmationRequired)
        XCTAssertEqual(machine.handle(.vehicleConfirmed).to, .active)
    }

    func testApproachToArrivalFlow() throws {
        var machine = JourneyStateMachine(state: .active)
        let progress = DestinationProgressEngine()
        let two = try progress.calculate(
            observation: DemoFixtures.observation(stopSequence: 6),
            route: DemoFixtures.route,
            plan: DemoFixtures.plan,
            now: DemoFixtures.referenceDate
        ).get()
        let one = try progress.calculate(
            observation: DemoFixtures.observation(stopSequence: 7),
            route: DemoFixtures.route,
            plan: DemoFixtures.plan,
            now: DemoFixtures.referenceDate
        ).get()
        let arrived = try progress.calculate(
            observation: DemoFixtures.observation(stopSequence: 8),
            route: DemoFixtures.route,
            plan: DemoFixtures.plan,
            now: DemoFixtures.referenceDate
        ).get()

        XCTAssertEqual(machine.handle(.progress(two)).to, .approachingDestination)
        XCTAssertEqual(machine.handle(.progress(one)).to, .nextStopIsDestination)
        XCTAssertEqual(machine.handle(.progress(arrived)).to, .arrived)
        XCTAssertEqual(machine.handle(.complete).to, .completed)
    }

    func testActiveToStaleAndBackToActive() throws {
        let engine = DestinationProgressEngine()
        var machine = JourneyStateMachine(state: .active)
        let stale = try engine.calculate(
            observation: DemoFixtures.observation(stopSequence: 2, seconds: -121),
            route: DemoFixtures.route,
            plan: DemoFixtures.plan,
            now: DemoFixtures.referenceDate
        ).get()
        let fresh = try engine.calculate(
            observation: DemoFixtures.observation(stopSequence: 3),
            route: DemoFixtures.route,
            plan: DemoFixtures.plan,
            now: DemoFixtures.referenceDate
        ).get()
        XCTAssertEqual(machine.handle(.progress(stale)).to, .dataStale)
        XCTAssertEqual(machine.handle(.progress(fresh)).to, .active)
    }

    func testVehicleLossAndRecovery() throws {
        var machine = JourneyStateMachine(state: .active)
        XCTAssertEqual(machine.handle(.vehicleLost).to, .vehicleTemporarilyLost)
        XCTAssertEqual(machine.handle(.vehicleRecovered).to, .vehicleRecovery)
        let fresh = try DestinationProgressEngine().calculate(
            observation: DemoFixtures.observation(stopSequence: 3),
            route: DemoFixtures.route,
            plan: DemoFixtures.plan,
            now: DemoFixtures.referenceDate
        ).get()
        XCTAssertEqual(machine.handle(.progress(fresh)).to, .active)
    }

    func testCancellation() {
        var machine = JourneyStateMachine(state: .active)
        XCTAssertEqual(machine.handle(.cancel).to, .cancelled)
        XCTAssertEqual(machine.handle(.complete).to, .completed)
    }

    func testInvalidTransitionDoesNotMutateState() {
        var machine = JourneyStateMachine()
        let transition = machine.handle(.matchSelected)
        XCTAssertFalse(transition.accepted)
        XCTAssertEqual(machine.state, .idle)
    }

    func testRideSessionRejectsDuplicateAndOutOfOrderUpdates() {
        var session = activeSession()
        let initial = DemoFixtures.observation(stopSequence: 1, seconds: 10)
        XCTAssertApplied(session.apply(
            observation: initial,
            route: DemoFixtures.route,
            now: initial.timestamp
        ))
        XCTAssertEqual(
            session.apply(observation: initial, route: DemoFixtures.route, now: initial.timestamp),
            .duplicate
        )
        let old = DemoFixtures.observation(stopSequence: 0, seconds: 5)
        XCTAssertEqual(
            session.apply(observation: old, route: DemoFixtures.route, now: initial.timestamp),
            .outOfOrder
        )
    }

    func testRideSessionRejectsWrongVehicle() {
        var session = activeSession()
        let other = DemoFixtures.observation(vehicleID: "other", stopSequence: 1)
        XCTAssertEqual(
            session.apply(observation: other, route: DemoFixtures.route, now: other.timestamp),
            .wrongVehicle
        )
    }

    private func activeSession() -> RideSession {
        RideSession(
            plan: DemoFixtures.plan,
            startedAt: DemoFixtures.referenceDate,
            matchedVehicleID: "demo-bus-365-A",
            state: .active
        )
    }

    private func XCTAssertApplied(
        _ update: RideSessionUpdate,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        guard case .applied = update else {
            XCTFail("Expected applied update, got \(update)", file: file, line: line)
            return
        }
    }
}
