# Firebase account and progress verification

The application selects the named Firestore database `default`. Before this
change, Firebase CLI 15.30.2 parsed the repository's rules configuration as
`(default)`. The new runner reproduced that mismatch with an assertion against
the CLI's actual configuration parser. `firebase.json` now explicitly selects
`default`; no database or rules deployment has been performed.

The production Firebase initialization now delegates to a shared factory with
the same client configuration, persistence order and database selection as
before. The browser test uses this factory with an isolated demo configuration
through a test-only Vite alias. Production code contains no emulator switch.
The comments in `firestore.rules` now describe current authorization accurately:
profile subscription fields are writable mirrors, not access authority. The
allow/deny rules themselves are unchanged.

## Reproduce

Use Node 22 or 24 and Java 21. Install Firebase CLI 15.30.2 and Playwright 1.62.1
in a separate temporary directory, with lifecycle scripts disabled, and install
Playwright's WebKit browser. The GitHub QA workflow provides the exact setup.
Point `EVERWISE_FIREBASE_CLI` at `firebase-tools/lib/bin/firebase.js` and
`EVERWISE_PLAYWRIGHT_MODULE` at the Playwright package directory, then run:

```sh
node scripts/qa-firebase.mjs
```

No Firebase login is required. The runner requires the demo project
`demo-everwise-qa` and loopback Auth/Firestore endpoints on ports 9099/8089.
It verifies that the required ports are free, creates a temporary configuration
with the repository rules, runs the emulators, and shuts them down afterward.
A ten-minute watchdog terminates its own process group if a run stalls.
The browser blocks unrecognized network destinations and API requests. Billing
and partner access are explicit synthetic responses; no checkout is exercised.

## Coverage and evidence

- Fifteen real Firebase Auth/Firestore emulator scenarios cover unpaid profile
  creation, rejected paid/trial creation, owner reads and deletion, cross-owner
  read/update/delete denial, signed-out denial, directory-listing denial,
  undeclared collections, concurrent atomic progress saves, offline reconnect,
  logout/login, second-account isolation, and Auth account deletion.
- Actual App browser journeys at 390px and 1440px cover the public interview,
  username signup, stored profile, paywall free exit, lesson completion,
  persisted login, reload, logout, another account, and username login recovery.
  The phone journey disconnects Firestore before completing the lesson, checks
  the durable progress journal, reloads, and verifies the acknowledged completion
  by reading the server. Both journeys attempt to forge an active subscription
  mirror and verify that opening the next lesson still shows the paywall.
- All 458 unit/backend/browser checks passed across the full run and an isolated
  rerun of one Chrome startup timeout. The existing 1,706 UI tests also passed.
  The two new unit checks cover emulator isolation and the narrow canceled
  navigation diagnostic classification. Lint passed. CI reruns the full suite.
- Root and `/EverWise/` production build startup, deferred content and asset checks passed at
  phone and desktop sizes. Test-project strings are absent from production JS.
- Updated Capacitor assets built, installed and launched on iPhone 18 Pro /
  iOS 27 simulator, process 3184. The welcome screen was visually confirmed.

Local emulator evidence: `/tmp/everwise-firebase-integration.log`.
Other local evidence: `/tmp/everwise-firebase-full-tests.log`,
`/tmp/everwise-firebase-unit-final.log`, `/tmp/everwise-firebase-layout-retry.log`,
`/tmp/everwise-firebase-production.log`, and
`/tmp/everwise-firebase-ios-build.log`. CI status and the published head are
recorded in PR #3 rather than embedding a self-referencing commit here.

WebKit reports canceled Firestore streams from discarded pages as access-control
diagnostics on some reloads, similar to [Firebase issue 4527](https://github.com/firebase/firebase-js-sdk/issues/4527).
The test does not ignore general connection errors: a diagnostic is separated
only when its exact local Firestore session ID was observed before reload and
independently reported canceled by the browser. Other page errors, new-channel
failures, wrong endpoints, missing server data or unacknowledged progress still
fail. The separated diagnostic count is printed. Unit tests cover those bounds.

The first Linux CI run passed the service scenarios but timed out at the initial
signup profile save after 20 seconds. The browser harness now gives that cold
connection a specific 60-second bound and reports the last 30 local emulator
response statuses on failure. The second run completed signup, but the progress
acknowledgement after reload outlasted the old 20-second test wait; the app
correctly retained its durable journal and showed the pending-sync notice.
Acknowledgement also receives a 60-second bound, followed by a mandatory server
read. The third run confirmed offline recovery and reached username login, where
the same cold profile-read delay exceeded the Home transition's old bound.
Account-loading transitions consistently use 60 seconds as well; ordinary UI
actions retain 20 seconds. This changes no application behavior or saved-data
assertions; the overall emulator run still has a ten-minute limit. Final CI
status is in PR #3.

These are local emulator and simulator results. They do not prove deployed
Firestore rules, production persistence, real payment/provider behavior,
physical-device airplane mode, VoiceOver, or App Store/TestFlight acceptance.
The native build still lacks the configured HTTPS API and Apple test products.
The full audit remains in progress.

## Exact publication manifest

- `.github/workflows/qa.yml`
- `firebase.json`
- `firestore.rules`
- `src/firebase.js`
- `src/config/firebaseClient.js`
- `src/config/firebaseDatabase.js`
- `scripts/firebase-qa-config.mjs`
- `scripts/qa-firebase.mjs`
- `scripts/qa-firebase-scenarios.mjs`
- `scripts/qa-firebase-browser.mjs`
- `tests/firebase-qa-config.test.mjs`
- `tests/fixtures/firebase-emulator.js`
- `docs/qa/2026-09-20-firebase-accounts.md`

The existing local `package.json` dependency-script approval map stays outside
this change. `sources/` remains read-only. No merge, deployment, purchase or
production account mutation is included.
