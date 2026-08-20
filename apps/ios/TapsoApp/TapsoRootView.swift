import SwiftUI

struct TapsoRootView: View {
    let model: TapsoAppModel

    var body: some View {
        NavigationStack {
            Group {
                if model.hasActiveRide {
                    ActiveJourneyView(model: model)
                        .transition(.opacity)
                } else {
                    HomeView(model: model)
                        .transition(.opacity)
                }
            }
            .animation(.easeInOut(duration: 0.2), value: model.hasActiveRide)
        }
    }
}
