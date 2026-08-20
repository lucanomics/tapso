import SwiftUI

@main
struct TapsoApp: App {
    @State private var model = TapsoAppModel()
    @State private var theme = TapsoTheme()

    var body: some Scene {
        WindowGroup {
            TapsoRootView(model: model)
                .environment(theme)
                .tint(theme.tint)
        }
    }
}
