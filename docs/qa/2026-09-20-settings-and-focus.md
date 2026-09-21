# Settings recovery and keyboard focus — September 20, 2026

## Reproduced problems

A password-reset request in Settings could remain pending indefinitely. Its
shared busy flag disabled Back and Log out, the reset button became a passive
row, and no pending status was shown. The reproduction tests failed for both
missing timeout recovery and disabled navigation.

Page navigation left keyboard focus on the old navigation button. Loading a
lesson could also remove the focused loading heading without moving focus to
the loaded content. Both behaviors were reproduced with the actual AppShell.

## Repairs

Login and Settings now share one bounded password-reset request controller.
It suppresses duplicate requests, handles network errors and throttling, ignores
late replies, and cancels its local timer when the screen unmounts. After 20
seconds, the message explains that a reset email may still arrive and asks the
learner to check their inbox before retrying. Success describes the provider
request without claiming confirmed delivery.

Settings reports progress/errors beside the reset control and keeps Back and
Log out usable during email recovery. Destructive account actions remain
separate. The reset control stays a real disabled button while pending instead
of losing its role. Reset eligibility is checked against the signed-in Firebase
email and excludes the reserved username-alias domain. Account guards reject
stale callbacks, and changing the settings owner clears the old screen's state.

AppShell focuses the new page's heading after navigation. If deferred content
replaces that focused heading, focus follows into the loaded screen. The shell
preserves a child screen's own focus and does not move focus away from a field
being edited or a navigation button the learner selected. The main landmark is
available as a fallback when a screen has no heading.
Non-interactive headings keep their normal visual presentation; buttons, links
and fields retain the visible keyboard focus ring.

## Evidence

- Local full suite: 455 unit/backend/browser tests and 1,706 UI tests pass
  (2,161 total, zero failures/skips). Includes real App account switching and
  reserved-alias cases; six Settings regressions; four page-focus regressions;
  and the existing login recovery tests.
- Expanded layout checks pass: 124 Chromium and 128 WebKit combinations
  (252 total), including pending/error reset messages at the largest text size
  and in landscape. WebKit keyboard login/recovery traversal passes at 390px
  and 1440px, including visible button focus and password clearing.
- Lint and whitespace checks pass. The production build passes.
- Root assets were synced into Capacitor; XcodeBuildMCP reports successful
  build/install/launch on iPhone 18 Pro / iOS 27 (process 72322). A screenshot
  confirms the welcome screen and the removal of the unintended heading border.
- The final expanded Chromium/WebKit matrices, real-browser keyboard journeys,
  both production hosting bases and CI results are recorded in draft PR #3.

Local test logs are `/tmp/everwise-recovery-focus-all.log`,
`/tmp/everwise-recovery-focus-chromium.log`,
`/tmp/everwise-recovery-focus-webkit-final.log` and
`/tmp/everwise-recovery-focus-production-final.log` on the audit Mac.

## Limits

No email was sent and no account was created. Recovery requests in automated
tests use simulated providers; browser network requests outside the local test
server are blocked. Username-only account recovery still needs a verified
recovery mechanism. No new identity or production policy is introduced here.

Native launch does not establish VoiceOver, software-keyboard or physical-device
acceptance. The simulator inspection tool still exposes no labeled WebView
buttons, so native interaction coverage is not claimed. The native runtime lacks
the HTTPS API setting and Apple products needed for live acceptance.

## Exact file manifest

- `docs/qa/2026-09-20-settings-and-focus.md`
- `scripts/qa-webkit.mjs`
- `src/App.jsx`
- `src/components/AppShell.jsx`
- `src/hooks/usePasswordResetRequest.js`
- `src/index.css`
- `src/screens/PasswordReset.jsx`
- `src/screens/Settings.jsx`
- `tests/app-navigation.test.jsx`
- `tests/fixtures/app-layout.jsx`
- `tests/password-reset.test.jsx`
- `tests/paywall-layout-browser.test.js`
- `tests/screen-focus.test.jsx`
- `tests/settings-recovery.test.jsx`

The local pre-existing package.json script-approval map is excluded. No merge,
deployment, purchase, migration or production mutation is included.

## CI fixture correction

The first published run passed the full test suite and build, then failed the
WebKit reset-error fixture. A new local reproduction with a deliberately delayed
provider failure confirmed that geometry could be measured before React rendered
the requested error state. The fixture now waits up to five seconds for that
specific state and allows its scroll position to settle. All readability and
navigation assertions remain. A dedicated Chromium regression and an additional
WebKit probe cover the delayed response. The final CI result is recorded in PR #3.

Correction manifest: this report, `scripts/qa-webkit.mjs`,
`tests/fixtures/app-layout.jsx`, and `tests/paywall-layout-browser.test.js`.
