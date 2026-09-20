# Consistent lesson Exit control

The confidence check-in screen dropped the learner's Exit callback even though the real LessonPlayer supplied it. Its practice questions and other activity types displayed Save and exit, but the check-in itself did not. A learner had to go backward or advance before leaving.

The check-in now forwards the same Exit action as the rest of the lesson. Exiting does not advance the activity, complete the lesson, or overwrite the saved position.

## Verification

The regression renders one authored lesson at every currently used activity type through the real LessonPlayer, checks the accessible Exit control and verifies that only the exit callback fires. Confidence practice has an additional case. Before the fix, the check-in failed while the other 13 cases passed. After the fix, all 14 passed; the combined focused exit/review suite passed 27 tests. All 1,730 UI tests, lint and the production build passed locally.

The browser QA runner can now optionally run the same assertions in Firefox with EVERWISE_QA_BROWSER=firefox; WebKit remains the CI default. Firefox uses its normal Tab navigation, while macOS WebKit retains Option-Tab. The local Firefox 1538 runtime could not launch on macOS 27: it reported sandbox-extension denial and a graphics initialization error before any app page opened. This matches [Playwright issue42082](https://github.com/microsoft/playwright/issues/42082); no sandbox settings were changed. A separate Linux CI job now installs the pinned Playwright/Firefox runtime and runs the same browser suite. Its results are pending at report creation. Application dependencies were not changed.

This evidence does not replace physical-iPhone touch or VoiceOver acceptance. Results were recorded before publication; no deployment was performed.

## Exact manifest

- .github/workflows/qa.yml
- src/components/blocks/ConfidenceBlock.jsx
- tests/learning-exit.test.jsx
- scripts/qa-webkit.mjs
- docs/qa/2026-09-20-learning-exit.md

The preexisting package.json script-approval map remains excluded.
