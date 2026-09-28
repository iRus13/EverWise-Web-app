import Capacitor
import UIKit
import WebKit

@objc(EverwiseBridgeViewController)
final class EverwiseBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(EverwisePurchasesPlugin())
        bridge?.registerPluginInstance(EverwiseLayoutPlugin())

        let background = UIColor(red: 245 / 255, green: 245 / 255, blue: 247 / 255, alpha: 1)
        webView?.isOpaque = false
        webView?.backgroundColor = background
        webView?.scrollView.backgroundColor = background
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        webView?.scrollView.keyboardDismissMode = .interactive
        webView?.allowsBackForwardNavigationGestures = false
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .darkContent
    }
}

// Keep the web layout clear of iPad window controls without guessing their
// height or relying on a device-name/viewport-size heuristic.
@objc(EverwiseLayoutPlugin)
final class EverwiseLayoutPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "EverwiseLayoutPlugin"
    let jsName = "EverwiseLayout"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getInsets", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getTextMetrics", returnType: CAPPluginReturnPromise)
    ]

    private var textObservers: [NSObjectProtocol] = []

    override func load() {
        if #available(iOS 17.0, *) {
            DispatchQueue.main.async { [weak self] in
                guard let self, let controller = self.bridge?.viewController else { return }
                controller.registerForTraitChanges([UITraitPreferredContentSizeCategory.self]) { [weak self] (_: UIViewController, _: UITraitCollection) in
                    guard let self else { return }
                    self.notifyListeners("textMetricsChanged", data: self.textMetrics())
                }
            }
        }
        for name in [UIContentSizeCategory.didChangeNotification, UIApplication.didBecomeActiveNotification] {
            textObservers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                // Read the view's traits after UIKit has applied the change,
                // including per-app accessibility preferences on returning.
                DispatchQueue.main.async { [weak self] in
                    guard let self else { return }
                    self.notifyListeners("textMetricsChanged", data: self.textMetrics())
                }
            })
        }
    }

    deinit {
        textObservers.forEach { NotificationCenter.default.removeObserver($0) }
    }

    private func textMetrics() -> [String: Any] {
        let traits = bridge?.viewController?.traitCollection ?? UIScreen.main.traitCollection
        return [
            "bodyScale": UIFontMetrics(forTextStyle: .body).scaledValue(for: 17, compatibleWith: traits) / 17,
            "titleScale": UIFontMetrics(forTextStyle: .title1).scaledValue(for: 28, compatibleWith: traits) / 28,
            "category": traits.preferredContentSizeCategory.rawValue,
            "accessibility": traits.preferredContentSizeCategory.isAccessibilityCategory
        ]
    }

    @objc func getTextMetrics(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { call.reject("Text preferences unavailable"); return }
            call.resolve(self.textMetrics())
        }
    }

    @objc func getInsets(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let view = self?.bridge?.viewController?.view else {
                call.resolve(["top": 0])
                return
            }
            if #available(iOS 26.0, *), view.traitCollection.userInterfaceIdiom == .pad {
                view.layoutIfNeeded()
                let insets = view.edgeInsets(for: .safeArea(cornerAdaptation: .vertical))
                call.resolve(["top": insets.top])
            } else {
                call.resolve(["top": 0])
            }
        }
    }
}
