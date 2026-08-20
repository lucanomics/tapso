import Observation
import SwiftUI

@Observable
@MainActor
final class TapsoTheme {
    let tint = Color(red: 0.18, green: 0.78, blue: 0.66)
    let warning = Color(red: 1.00, green: 0.72, blue: 0.24)
    let urgent = Color(red: 1.00, green: 0.38, blue: 0.32)
    let checking = Color(red: 0.35, green: 0.70, blue: 1.00)
    let surface = Color(uiColor: .secondarySystemBackground)
    let raisedSurface = Color(uiColor: .tertiarySystemBackground)
}
