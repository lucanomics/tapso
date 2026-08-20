import XCTest
import TapsoTransit
@testable import Tapso

final class TapsoActivityAttributesTests: XCTestCase {
    func testContentStateRoundTripsThroughJSON() throws {
        let state = TapsoActivityAttributes.ContentState(
            phase: .approachingDestination,
            currentStopName: "동문로터리",
            nextStopName: "제주여자상업고등학교",
            remainingStops: 2,
            freshness: .fresh,
            updatedAt: Date(timeIntervalSince1970: 1_800_000_000)
        )

        let data = try JSONEncoder().encode(state)
        XCTAssertEqual(try JSONDecoder().decode(TapsoActivityAttributes.ContentState.self, from: data), state)
        XCTAssertLessThan(data.count, 4_096)
    }

    func testDemoTimelineEndsAtDestination() {
        XCTAssertEqual(DemoFixtures.demoTimeline().count, 9)
        XCTAssertEqual(DemoFixtures.demoTimeline().last?.confirmedStopID, DemoFixtures.plan.destinationStopID)
    }
}
