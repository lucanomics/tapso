// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "TapsoTransit",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "TapsoTransit", targets: ["TapsoTransit"])
    ],
    targets: [
        .target(name: "TapsoTransit"),
        .testTarget(
            name: "TapsoTransitTests",
            dependencies: ["TapsoTransit"]
        )
    ]
)
