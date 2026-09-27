import UIKit
import Capacitor

// Capacitor по умолчанию отключает «резиновый» отскок прокрутки (bounces = false).
// Возвращаем стандартное поведение iOS.
class BounceViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        webView?.scrollView.bounces = true
        webView?.scrollView.alwaysBounceVertical = true
    }
}
