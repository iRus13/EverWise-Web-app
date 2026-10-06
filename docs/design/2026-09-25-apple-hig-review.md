# Apple design-guideline review — 25 September 2026

Reviewed the current local design against Apple's iOS/iPadOS guidance. This is a visual and interaction-layout review, not an Apple certification or App Store approval.

| Area | Finding and action | Evidence |
| --- | --- | --- |
| [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | Removed the horizontal overflow treatment at large reading sizes. All five destinations remain visible. Compact captions scale within 11–13 px; larger tablet captions within 13–17 px. Reading content retains its full text preference. | All 56 viewport/text cases keep tab controls inside the viewport; iPhone and iPad screenshots at app text size 10. |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | Essential control outlines were too faint. Changed the shared control border from #adadb4 to #85858d and applied it to account fields. Added stronger semantic colors for Increase Contrast. | Control outlines: 3.66:1 on white and 3.36:1 on grouped surfaces. Secondary text: 5.39:1; accent text: 6.36:1. All ten checked semantic color pairs meet their 3:1 control or 4.5:1 text targets, including increased contrast. |
| [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) | Retained system typography, readable body text, distinct heading levels and native text-metric support. Long content scrolls at larger sizes. | Standard and largest app-text settings across seven main screens; visual inspection of native Home, Settings and account forms. |
| [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | Retained safe-area handling, full-screen backgrounds, separated content/navigation and window-width adaptation. | Native iPhone 18 Pro and iPad mini screenshots; browser widths 320, 402, 744 and 1133. |
| [Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | Existing reduced-motion handling removes nonessential animation. | No running animation longer than 1 ms in the tested reduced-motion screen states. |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) | Retained clear labels, consistent pressed/disabled states and generous hit areas. | Enabled buttons, fields and links in the 56 tested cases met the 44-by-44 CSS-point target; native screenshots checked separately. |

## Scope

Seven screen samples: Home, Course, Scam Checker, Settings, onboarding, login and native-plan paywall. Four browser sizes, two app text sizes: 56 cases, no measured failures. Native capture: Home/Settings at text size 10 and login/paywall at standard text size on both iPhone and iPad. Eight native screenshots, with no reported JavaScript errors.

Evidence directory: `/Users/qwertyx/Documents/Codex/EverWise/qa-apple-hig/`. `layout-results.json` contains the actual control rectangles; `contrast.json` contains the numeric ratios; `native/results.json` contains native observations.

Lint, production web build, Capacitor sync and Release simulator build succeeded. The regular app was installed and reopened on iPhone. These CSS changes do not alter curriculum, account data, progress or billing.

The app continues to use custom web controls within Capacitor. The review does not establish full VoiceOver traversal, every tab's navigation-state retention, Dark Mode support, or physical-device coverage. Those are separate from the specific visual fixes verified here.
