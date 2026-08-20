import XCTest
@testable import TapsoTransit

final class VehicleMatchingEngineTests: XCTestCase {
    private let engine = VehicleMatchingEngine()
    private let now = DemoFixtures.referenceDate
    private let route = DemoFixtures.route
    private let plan = DemoFixtures.plan

    func testOneObviousCandidateIsHighConfidence() {
        let result = match([DemoFixtures.obviousCandidate()])
        XCTAssertEqual(result.selectedVehicle?.vehicleID, "demo-bus-365-A")
        XCTAssertEqual(result.confidence, .high)
        XCTAssertFalse(result.requiresConfirmation)
    }

    func testTwoEquivalentCandidatesRequireConfirmation() {
        let first = DemoFixtures.obviousCandidate()
        let second = VehicleCandidate(
            vehicleID: "demo-bus-365-B",
            observations: first.observations.map { observation in
                replacing(observation, vehicleID: "demo-bus-365-B")
            }
        )
        let result = match([first, second])
        XCTAssertNil(result.selectedVehicle)
        XCTAssertEqual(result.confidence, .low)
        XCTAssertTrue(result.requiresConfirmation)
        XCTAssertEqual(result.alternatives.count, 2)
    }

    func testWrongRouteCandidateIsRejected() {
        let candidate = candidate(
            id: "wrong",
            observation: DemoFixtures.observation(vehicleID: "wrong", stopSequence: 0, routeID: "other")
        )
        XCTAssertEqual(match([candidate]).rejectedCandidates.first?.reason, .wrongRoute)
    }

    func testOppositeDirectionCandidateIsRejected() {
        let candidate = candidate(
            id: "inbound",
            observation: DemoFixtures.observation(vehicleID: "inbound", stopSequence: 0, direction: .inbound)
        )
        XCTAssertEqual(match([candidate]).rejectedCandidates.first?.reason, .wrongDirection)
    }

    func testStaleCandidateIsRejected() {
        let candidate = candidate(
            id: "stale",
            observation: DemoFixtures.observation(vehicleID: "stale", stopSequence: 0, seconds: -121)
        )
        XCTAssertEqual(match([candidate]).rejectedCandidates.first?.reason, .staleObservation)
    }

    func testApproachingOriginAddsEvidence() {
        let candidate = candidate(
            id: "approaching",
            observation: DemoFixtures.observation(
                vehicleID: "approaching",
                stopSequence: 0,
                event: .approachingStop
            )
        )
        XCTAssertTrue(match([candidate]).alternatives[0].evidence.contains { $0.kind == .atBoardingStop })
    }

    func testJustDepartedOriginAddsEvidence() {
        let result = match([DemoFixtures.obviousCandidate()])
        XCTAssertTrue(result.decisionEvidence.contains { $0.kind == .justDepartedBoardingStop })
    }

    func testCandidateTooFarPastOriginIsRejected() {
        let candidate = candidate(
            id: "far",
            observation: DemoFixtures.observation(vehicleID: "far", stopSequence: 3)
        )
        XCTAssertEqual(match([candidate]).rejectedCandidates.first?.reason, .alreadyTooFarPastBoarding)
    }

    func testHeadingMismatchPenalizesScore() {
        let aligned = DemoFixtures.observation(vehicleID: "aligned", stopSequence: 0)
        let mismatched = replacing(aligned, vehicleID: "mismatch", heading: 250)
        let result = match([
            candidate(id: "aligned", observation: aligned),
            candidate(id: "mismatch", observation: mismatched)
        ])
        let mismatch = result.alternatives.first { $0.vehicleID == "mismatch" }
        XCTAssertTrue(mismatch?.evidence.contains { $0.kind == .headingMismatch && $0.score < 0 } == true)
    }

    func testInvalidStopOrderingFailsClosed() {
        let reversed = RidePlan(
            routeID: route.id,
            routeVariantID: route.variantID,
            direction: .outbound,
            boardingStopID: "demo-stop-8",
            destinationStopID: "demo-stop-0"
        )
        let result = engine.match(input(plan: reversed, candidates: [DemoFixtures.obviousCandidate()]))
        XCTAssertEqual(result.rejectedCandidates.first?.reason, .invalidStopOrdering)
    }

    func testLowConfidenceDoesNotSilentlySelect() {
        let routeStop = route.stops[0]
        let observation = VehicleObservation(
            vehicleID: "weak",
            routeID: route.id,
            routeVariantID: route.variantID,
            direction: .unknown,
            timestamp: now.addingTimeInterval(-100),
            coordinate: Coordinate(
                latitude: routeStop.stop.coordinate.latitude + 0.004,
                longitude: routeStop.stop.coordinate.longitude
            ),
            confirmedStopID: nil
        )
        let result = match([candidate(id: "weak", observation: observation)])
        XCTAssertNil(result.selectedVehicle)
        XCTAssertEqual(result.confidence, .low)
    }

    func testAlternativesRemainInspectable() {
        let obvious = DemoFixtures.obviousCandidate()
        let weakObservation = DemoFixtures.observation(
            vehicleID: "alternative",
            stopSequence: 0,
            seconds: -90,
            event: .unknown,
            direction: .unknown
        )
        let result = match([obvious, candidate(id: "alternative", observation: weakObservation)])
        XCTAssertEqual(result.alternatives.map(\.vehicleID), ["demo-bus-365-A", "alternative"])
    }

    func testStructuredDebugRecordExplainsSelection() {
        let record = match([DemoFixtures.obviousCandidate()]).debugRecord
        XCTAssertEqual(record.event, "vehicle_match_selected")
        XCTAssertEqual(record.selectedVehicleID, "demo-bus-365-A")
        XCTAssertTrue(record.candidates[0].evidence.contains(MatchEvidenceKind.exactRoute.rawValue))
    }

    func testLaterEvidenceCanContradictPreviousMatch() {
        let next = VehicleCandidate(
            vehicleID: "demo-bus-365-B",
            observations: [
                DemoFixtures.observation(
                    vehicleID: "demo-bus-365-B",
                    stopSequence: 0,
                    event: .departedStop
                )
            ]
        )
        let result = engine.reevaluate(
            previousVehicleID: "demo-bus-365-A",
            with: input(candidates: [next])
        )
        XCTAssertEqual(result.selectedVehicle?.vehicleID, "demo-bus-365-B")
        XCTAssertTrue(result.decisionEvidence.contains { $0.kind == .previousMatchContradicted })
    }

    func testTemporaryDisappearanceReturnsUnknownWithoutFabricatingMatch() {
        let result = match([])
        XCTAssertNil(result.selectedVehicle)
        XCTAssertEqual(result.confidence, .unknown)
        XCTAssertTrue(result.requiresConfirmation)
    }

    func testOutOfOrderContinuityIsRejected() {
        let sameTime = [
            DemoFixtures.observation(vehicleID: "bad-history", stopSequence: 0, seconds: 0),
            DemoFixtures.observation(vehicleID: "bad-history", stopSequence: 1, seconds: 0)
        ]
        let result = match([VehicleCandidate(vehicleID: "bad-history", observations: sameTime)])
        XCTAssertEqual(result.rejectedCandidates.first?.reason, .implausibleContinuity)
    }

    func testRouteVariantMismatchIsRejected() {
        let observation = DemoFixtures.observation(
            vehicleID: "branch",
            stopSequence: 0,
            routeVariantID: "branch"
        )
        XCTAssertEqual(
            match([candidate(id: "branch", observation: observation)]).rejectedCandidates.first?.reason,
            .routeVariantMismatch
        )
    }

    private func match(_ candidates: [VehicleCandidate]) -> VehicleMatchResult {
        engine.match(input(candidates: candidates))
    }

    private func input(
        plan: RidePlan? = nil,
        candidates: [VehicleCandidate]
    ) -> VehicleMatchingInput {
        VehicleMatchingInput(
            plan: plan ?? self.plan,
            route: route,
            boarding: BoardingContext(tappedAt: now),
            candidates: candidates,
            now: now
        )
    }

    private func candidate(id: VehicleIdentifier, observation: VehicleObservation) -> VehicleCandidate {
        VehicleCandidate(vehicleID: id, observations: [observation])
    }

    private func replacing(
        _ observation: VehicleObservation,
        vehicleID: VehicleIdentifier,
        heading: Double? = nil
    ) -> VehicleObservation {
        VehicleObservation(
            vehicleID: vehicleID,
            routeID: observation.routeID,
            routeVariantID: observation.routeVariantID,
            direction: observation.direction,
            timestamp: observation.timestamp,
            coordinate: observation.coordinate,
            headingDegrees: heading ?? observation.headingDegrees,
            speedKilometersPerHour: observation.speedKilometersPerHour,
            confirmedStopID: observation.confirmedStopID,
            event: observation.event
        )
    }
}
