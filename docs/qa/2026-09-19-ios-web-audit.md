# Everwise iOS and web audit — September 19, 2026

Local candidate on `audit/ios-web-2026-09-19`, based on transferred commit `62cbd6f`. The audit branch is prepared for the user-authorized GitHub push and review PR. No deployment, production account mutation, or payment was performed. Synced files under `../sources/` were left unchanged. The existing `package.json` script-approval settings were preserved as an unstaged local change.

## Repairs

| Area | Reproduced problem / code defect | Result |
| --- | --- | --- |
| iOS packaging | Capacitor copied `dist` although the current build writes `dist/client`, risking stale web screens in the app. | Capacitor and preview use the client output; packaged HTML matches the new build. Added explicit web and iOS build commands. |
| Deployment paths | GitHub Pages uploaded the wrong directory and sent its base option to the worker build; the older server release requires `dist/index.html`. | Pages builds and uploads client assets with the correct base. The legacy workflow explicitly emits its expected flat layout. Both builds checked locally; workflows not dispatched. |
| iOS prices | Annual equivalent and renewal disclosure stayed in US dollars when Apple returned localized prices. | Both cards and renewal text use the same StoreKit price and period, showing the actual annual total. Unavailable/unsupported products lead to retry, Restore, or free learning. |
| iOS trials | Every annual customer was promised a seven-day trial. | Swift returns the configured free offer and Apple Account eligibility. The UI advertises a trial only when verified, using its actual duration. |
| Web trials | Paywall ignored the server's `canStartTrial` flag. | Returning customers and unknown eligibility see immediate billing terms, not an unavailable free trial. |
| Paywall design | Native short-screen rules shrank renewal terms to 12px; large text settings were ignored. | Readable disclosures, responsive cards, accessible keyboard selection, visible free exit, and scrollable legal/Restore actions on both platforms. No price change. |
| Native launch | iOS 27 simulator crashed at startup in `UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`, despite a successful compile. | Adopted a single-window scene lifecycle with the existing storyboard and Capacitor URL/universal-link forwarding. App now renders the welcome screen and remains running. |
| Native purchase recovery | A pre-purchase entitlement lookup could revoke newly purchased/restored access; offline Firestore writes could hold the paywall open. | Successful deliveries invalidate older checks and open learning without waiting for the profile write. Four regression cases cover purchase and restore. |
| Native lifecycle | Access was checked only at sign-in; an asynchronous purchase/restore could finish after the account changed. | Recheck on foreground/focus and every minute while visible. Reject stale account continuations. StoreKit listens for and finishes verified delayed transactions; upgraded transactions are excluded from entitlement selection. |
| Scam checker | Malformed arrays/objects could crash rendering; requests could remain pending indefinitely. | Validate every displayed response field, bound requests to 30 seconds, prevent duplicate submissions, cancel on exit, and keep the submitted message stable while checking. |
| Narration | A late response could play after Stop; changing lesson text left stale playback state; failures could duplicate fallback speech. | Ignore canceled/stale requests, reset on text changes, release audio on failure, and fall back to device speech after eight seconds. Cache completed audio only. |
| Native API transport | Insecure configured native API origins were accepted despite the release checklist. | Native requests accept only HTTPS origins without URL credentials, paths, queries, or fragments; invalid configuration fails locally. |
| Development privacy | Missing narration credentials silently forwarded text to a hard-coded HTTP server. | Removed the external fallback. An unconfigured provider returns unavailable, allowing client device speech instead. |
| Home | No level-one heading; a stored `scamsCaught` field never updated. Desktop guidance was unnecessarily lengthy. | Responsive screen-reader headings, actual completed-lesson count, and shorter desktop guidance. |
| Dependencies | Root dependency audit reported 12 advisories, including five high-severity entries. | Patched transitive dependencies, Vitest 4.1.11, Miniflare 5.20260918.0-alpha, and a targeted esbuild override. Root and server audits report zero known advisories. |
| Test reliability | Nine existing tests failed because Node's Storage implementation conflicted with jsdom; newer Vitest exposed an uncleared cancellation mock. | Browser storage stays owned by jsdom, and cancellation state is reset between tests. |

## Verification

- **439 unit/backend/browser tests passed; zero failed or skipped.** Includes billing, webhook verification, account isolation, partner seat races and crash recovery, durable storage, and responsive browser measurements. [Log](evidence-2026-09-19/unit-and-browser.txt)
- **1,673 UI tests passed in 15 files.** Includes 1,366 curriculum checks: rendering every shipped lesson/challenge activity, validating answer data, completing every scored lesson, and exercising passing/failing exams. Existing account, onboarding, deletion, access and settings tests remain included. [Log](evidence-2026-09-19/ui.txt)
- **86 responsive combinations:** eight web paywall sizes; 12 native-paywall combinations across four sizes and three app text settings; 66 combinations across 11 main screens, three widths and two text settings. Separate deliberately broken geometry fixture verifies that clipping is detected.
- Main screens: welcome, login, interview, signup, Home, Settings, badges, course path, lesson, completion and scam checker. Browser fixtures use synthetic data and inert account/purchase callbacks.
- Phone width 320px through desktop width 1920px; includes landscape paywall and largest app text size. Geometry checks cover overflow/control bounds, paywall disclosure legibility and tap targets, legal-footer reachability, headings and broken images. This is Chromium emulation, not physical-device or VoiceOver testing.
- Visual inspection in the Codex browser: welcome, interview, Home on phone/desktop, native paywall at normal and largest text, and desktop web paywall. A transient hot-reload error occurred during dependency/server replacement; fresh pages rendered successfully afterward.
- Lint and `git diff --check` pass. Production Sites build, GitHub Pages base-path build, legacy flat web build, Capacitor sync and Drizzle migration-file consistency check pass. No migration applied.
- Xcode generic iOS **Debug and Release unsigned device builds pass**. The follow-up includes the scene migration and current packaged web assets. The iPhone 18 Pro / iOS 27 simulator also builds, installs and launches; its welcome screen was visually checked and the app remained running beyond one minute. No physical-device installation or upload. [Simulator evidence](evidence-2026-09-19/ios-simulator.txt)
- Root and server dependency audits: **zero known vulnerabilities** at audit time. This is dependency-advisory evidence, not a security certification. [Root audit](evidence-2026-09-19/dependencies.json), [server audit](evidence-2026-09-19/server-dependencies.json)

- **90 additional WebKit responsive combinations pass**, plus real App onboarding through all public questions, login validation, login detour and answer/password recovery at 390px and 1440px. External requests blocked; no real account created. This is Playwright WebKit, not Safari or a physical iPhone. [Log](evidence-2026-09-19/webkit.txt)
- An integrated App test uses real screens with simulated Firebase/billing services: free lesson completion, progress write, Settings, paywall, free exit and logout.
- Fresh isolated checkout of `343ceaf`: committed `package.json` parses, `npm ci --ignore-scripts`, production build, lint and all 1,668 then-current UI tests pass without the local `allowScripts` map. The final fresh checkout passes all 2,111 tests, the web/Sites build, Capacitor sync and a fresh unsigned iOS Release build. [Clean-checkout evidence](evidence-2026-09-19/clean-checkout.txt)
- Added a pull-request QA workflow for lint, the complete test suite, production build, and WebKit navigation/layouts. It has read-only repository permissions and no deployment steps.

## Reproduce

```sh
npm ci --ignore-scripts
npm run lint
npm test
npm run build
npm run build:ios
npx drizzle-kit check
npm audit
npm audit --prefix server
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build
```

Chrome/Chromium is required for browser geometry tests; CI fails if it is absent. Set `EVERWISE_CHROME_BIN` when the browser is in a nonstandard location. Local browser tests skip explicitly if Chrome is unavailable; there were no skips in this audit.

For a native candidate intended to use hosted features, set `VITE_EVERWISE_API_URL` to the confirmed HTTPS API origin before building. No production origin or secret was invented for this audit.

## Still requires live acceptance

1. The MacBook coordinating task reached this task and confirmed the transfer base `62cbd6f` and no subsequent edits in the transfer task. It has no verified sandbox-account or TestFlight setup; its earlier simulator notes are historical. Reverse task messaging remains unavailable, but no task link is needed to continue local QA.
2. A simulator became available during follow-up and exposed the launch crash now fixed. Its accessibility snapshot does not expose the WebView buttons, so simulator interaction/keyboard testing is not claimed. TestFlight/physical iPhone checks remain: installation, keyboards and safe areas, VoiceOver, audible narration, background/foreground behavior, Apple ID changes, purchase/cancel/restore, Ask to Buy, refunds and billing grace periods.
3. Real authenticated Firebase creation/login, cross-device persistence and deletion were not exercised. Automated versions use mocks or isolated stores. A dedicated test account/environment is needed for live acceptance.
4. Live Stripe/Apple purchases and subscription configuration were not verified. The existing Sites `BILLING_RECOVERY_COMPLETE` gate remains unchanged. Tests do not establish deployed billing readiness or reconcile existing customers.
5. Local AI/narration provider credentials are absent. The scam checker cannot perform a real assessment here; local error recovery and device-speech fallback are tested. Hosted provider operation remains unverified.
6. Safari and Firefox themselves, browser zoom, actual assistive technology and an independent editorial audit remain outside this local proof. Playwright WebKit coverage is recorded above.
7. Build warnings remain: the main client bundle is about 1.9 MB before gzip; cold-load performance and curriculum code splitting need a separate measured pass. The clean iOS build also emits three warnings inside Capacitor Keyboard plus an unused AppIntents metadata warning. App compilation succeeds; this is not a warning-free native release.

This is a tested local repair candidate, not a claim that every possible bug is gone or that the production apps have changed.

## Implementation references

Apple's [subscription metadata](https://developer.apple.com/documentation/storekit/product/subscriptioninfo) and [introductory-offer eligibility](https://developer.apple.com/documentation/storekit/product/subscriptioninfo/iseligibleforintrooffer) informed the native trial changes. The test-runner configuration follows the [Vitest 4 migration guidance](https://v4.vitest.dev/guide/migration#pool-rework).

Optional WebKit check: install Playwright 1.62.1 and its WebKit browser in an isolated directory, then run `EVERWISE_PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright node scripts/qa-webkit.mjs`. The PR workflow contains the Linux installation commands.

The scene migration follows Apple’s [UIKit scene lifecycle guidance](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle).

## GitHub CI follow-up

The first Linux PR run passed installation and lint, but cold Chrome exceeded the harness’s three-second DevTools discovery bound (437/438 unit tests passed). Discovery now allows ten seconds inside the unchanged 30-second measurement deadline. The response-body read also remains under the abort deadline, with a new regression test. The updated local suite passes **2,112 tests** (439 unit/backend/browser + 1,673 UI). No app behavior or geometry assertion was weakened. GitHub reruns the complete suite and WebKit checks on this correction.
