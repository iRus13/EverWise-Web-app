# First update preparation

This branch contains the current web/Capacitor improvements. It is **not** the native Swift App Store submission package.

The public iOS app is Everwise: Digital Literacy, App Store ID 6795436298, bundle `com.everwise.digitalliteracy`, version 1.0.1 (rechecked in US and GB stores during preparation). Native source and publisher handoff material belong in the separate private `iRus13/EverWise-Swift-app` repository.

## Included changes

- Consistent typography, spacing, navigation and reusable controls across onboarding, home, learning, course path, badges, settings, paywall and recovery screens.
- Responsive and large-text improvements, native web-wrapper insets and text metrics, keyboard/focus handling, and loading/error interactions.
- Progress recovery, subscription-state handling and account/partner-flow regression coverage.
- Renewal/payment terms remain readable at 18 CSS pixels before the app's text scaling; real browser geometry checks cover compact and large layouts.

## Validation

The complete unit/browser run passed 480 of 482 checks and exposed two renewal-text readability failures. After correcting the CSS, both failing checks were rerun and passed across their viewport/text-size matrices. The UI suite passed 1,954 tests in 34 files. Lint and production build passed; build warnings about chunk size and mixed static/dynamic imports remain performance follow-ups.

These are local results. No production purchase, installed App Store upgrade or publisher-signed candidate has been validated by this branch.

## Before production

Keep this work on its development branch until reviewed. `main` has automatic website/server deployment workflows, so pushing this branch does not authorize merging or deploying it.

For iOS, use the publisher-confirmed native source and subscription products. Verify existing-user login, persistent progress and purchases after an update without uninstalling. Web account/profile changes need explicit compatibility with older native clients. Preserve the named Firebase database `default` and existing course IDs. Do not copy development bundle/product IDs into the publisher's release settings.

The publisher's native handoff contains the source reconciliation, missing confirmations, configuration checklist, and proposed delivery sequence. No App Store submission date is committed while those release requirements remain open.
