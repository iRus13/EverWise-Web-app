# Welcome controls and the iPhone gesture area

On the iPhone 18 Pro / iOS 27 simulator, the welcome screen's Log In button
ended at y=874 in an 874-point viewport. WebKit reported a 34-point bottom safe
area, so the button extended into the home gesture region. The initial native
capture also showed the button flush with the bottom edge.

The welcome action group now reserves the greater of one rem or the device's
bottom safe area. The spacing remains inside the scrollable content so large
text does not make either action unreachable. Tablet and desktop layout rules
continue to apply normally.

## Verified locally

- Native rebuild, install and launch passed. At the ordinary text setting,
  Get Started ends at y=750.5 and Log In at y=840: exactly 34 points of bottom
  clearance. A screenshot shows the full welcome screen and both buttons.
- At the largest text setting, after layout settled and scrolling to the end,
  Get Started spans y=618.125 to 722.65625 and Log In ends at y=840.1875.
  Both actions are visible, with approximately 34 points below the last one.
  Text-size/scroll setup used debugger JavaScript; this is layout evidence,
  not proof of physical touch, VoiceOver or software-keyboard operation.
- WebKit passed all 128 responsive combinations and actual App public
  onboarding, login, recovery and keyboard journeys at 390px and 1440px.
- The 11 Chromium browser/harness tests passed, including the core-screen
  matrix and native/web paywall geometry. Both browser matrices now require
  welcome-button clearance after scrolling, including the largest text size.
  Tablet/desktop measurement scrolls the document as well as the phone pane.
- Lint, patch checks, the production web build and Capacitor sync passed.

Native before/after measurements are `/tmp/everwise-safe-before.json`,
`/tmp/everwise-safe-after.json` and `/tmp/everwise-safe-large-settled.json`.
Browser logs are `/tmp/everwise-safe-webkit.log` and
`/tmp/everwise-safe-chromium.log`. These paths are local evidence, not CI
artifacts. Final branch CI results belong in PR #3.

Earlier intermittent native capture discrepancies remain unresolved. The
layout repair does not claim to fix their cause. Native software-keyboard,
physical-device accessibility and live provider/payment acceptance remain open.

## Exact publication manifest

- `src/index.css`
- `tests/fixtures/app-layout.jsx`
- `tests/paywall-layout-browser.test.js`
- `scripts/qa-webkit.mjs`
- `docs/qa/2026-09-20-welcome-safe-area.md`

The preexisting local `package.json` approval map is excluded. No reference
sources, native Swift files, production services or billing state are changed.
