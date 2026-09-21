# Progress recovery repair — September 20, 2026

## Problem and behavior

The real App test reproduced a lesson-completion freeze when a simulated
Firestore update never acknowledged the write. Lessons, challenges and exams
all awaited that request before navigating. Failed writes otherwise had no
production-facing recovery message, and whole-array updates could overwrite
progress from another session.

Completion now advances immediately. A per-account journal retains pending
completion IDs and badges in local storage, and the app merges them into the
current profile after reload. Each completion has a separate journal entry;
acknowledging an earlier batch cannot remove later work. Firestore receives
atomic array unions rather than replacement arrays. Only completion IDs and
badges are sent; pending progress cannot grant paid or sponsored access.

A visible notice reports saving, pending sync, or unavailable device storage.
After 15 seconds without acknowledgement it offers retry. Browser online events
and account readiness also retry pending work. If storage is blocked or full,
the notice asks the learner to keep the app open and retry instead of claiming
a durable copy. The notice scrolls within at most 40% of the content area so
short screens retain space for the lesson.

UID guards prevent an old callback from changing a newly signed-in account.
Signing out retains the old owner's pending journal for their next sign-in;
successful account deletion clears only that owner's journal. A missing profile
now shows account recovery instead of retaining another learner's profile.

## Verification

- Full local suite: 455 unit/backend/browser tests and 1,694 UI tests pass
  (2,149 total; no failures or skips).
- Ten queue regressions cover reload, rejection, timeout and late acknowledgement,
  concurrent completions/tabs, storage failure/clearing, account isolation,
  deletion, malformed records and excluding access fields.
- Actual App integration tests cover immediate lesson/challenge/exam completion,
  remount and retry, storage failure, profile refresh and account switching.
  Hook tests cover stale deletion callbacks and switching before a writer starts.
- Chromium geometry covers 108 combinations, including pending-progress notices
  at 320px, tablet/desktop widths, 667x375 landscape and the largest text size.
- WebKit passes 112 responsive combinations and real public onboarding/login
  navigation at 390px and 1440px, with no uncaught browser errors.
- Lint and whitespace checks pass. Production build passes; initial JavaScript
  is 1,031,158 bytes (297,887 gzip in the production browser check), retaining
  the earlier approximately 46% reduction from the 1,907 KB baseline.
- Production hosting at both `/` and `/EverWise/` passes at 390px and 1440px
  with external browser
  requests blocked. No account was created and no email was sent.
- Updated root assets were synced into Capacitor. XcodeBuildMCP reports successful
  build, install and launch on iPhone 18 Pro / iOS 27 (process 46931).
  A subsequent screenshot confirms the welcome screen is visible.

The first local full-suite attempt hit Chrome startup/geometry timeouts; the
complete rerun passed without changing timeout limits. Test logs are in
`/tmp/everwise-progress-all-tests-recheck.log` on the audit Mac. The simulator
runtime reports missing native HTTPS API configuration and no available Apple
products. Its launch is not evidence of authenticated or payment acceptance.

The final WebKit, alternate hosting-base and CI results are recorded in PR #3.

## Boundaries and remaining work

The stalled/rejected Firestore writes in these tests are simulated. Real server
persistence, physical-device airplane mode, account deletion across devices,
Apple sandbox/TestFlight lifecycles and VoiceOver/keyboard interaction still
need the corresponding test setup. Username-only account recovery remains open.
No merge, deployment, production mutation, account creation or purchase is part
of this change.

## Exact file manifest

- `docs/qa/2026-09-20-progress-recovery.md`
- `scripts/qa-webkit.mjs`
- `src/App.jsx`
- `src/components/ProgressSaveNotice.jsx`
- `src/hooks/useProgressSync.js`
- `src/screens/PartnerAccessError.jsx`
- `src/utils/progressQueue.js`
- `tests/app-navigation.test.jsx`
- `tests/billing-client.test.jsx`
- `tests/fixtures/app-layout.jsx`
- `tests/partner-client.test.jsx`
- `tests/paywall-layout-browser.test.js`
- `tests/progress-queue.test.js`
- `tests/progress-sync.test.jsx`

The pre-existing local `package.json` dependency-script approval map is excluded.
