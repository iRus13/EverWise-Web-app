# Exam passing scores and saved retake awards

## Reproduced problems and fixes

The Phase 4 exam says learners need eight correct answers, but previously allowed completion at six or seven because those scores have a result tier. Completion now requires both the stated passing score and a matching result tier. Encouraging feedback below the pass mark no longer unlocks the next phase.

After passing the Phase 3 exam at eight out of ten, a perfect retake displayed Communication Master and “Trophy earned” but the profile retained only Communication Champion. The completion handler now records an improved tier even when the exam was already completed. Existing awards are preserved; equal or lower retakes do not add redundant/lower-tier awards or repeat the completion write.

Both defects were reproduced before changing app code: two new regressions failed while 1,438 tests passed. The same 1,440 focused tests pass after the repairs. The real App/Firebase emulator journey independently reproduced the missing retake trophy in a server profile read.

## Coverage

- Every authored exam is exercised at exactly its passing score and one point below it in component tests. App integration checks improved, equal and lower retake tiers.
- Full browser assessment journeys now fail one point below the passing score instead of using one correct answer. They retain complete zero-score retakes, exact grading and reachable-control checks at 320px maximum text and 1440px normal text.
- Real App journeys use local Auth/Firestore emulators at 390px and 1440px. Prerequisite completions and billing access are explicitly synthetic; target challenge/exam completions go through the actual players. They verify challenge completion unlocks the exam, passing unlocks the next phase, saved badges/completions survive reload, and an improved retake saves its trophy without duplicate completion. The 390px flow also completes both challenge and exam with Firestore disconnected and verifies the durable queue before reconnecting through reload.
- The App challenge journey uses its supported Skip controls; answering all 85 challenge blocks is covered separately in the complete browser player journeys. All external requests remain blocked and no cloud account or payment provider is used.

## Browser reload diagnostics

The expanded desktop journey reloads immediately while an online completion write is in flight. Its data assertions passed, but WebKit reported a CORS-style diagnostic for a retry that never reached the browser's network-request events. Timestamped document observation established the order: reload begins, beforeunload fires, the original fetch fails, the SDK issues another initial-channel fetch from that same departing document, that fetch fails, then pagehide fires. The new page recovers the queued completion and the server confirms it.

The harness retains the rapid reload. Existing channel diagnostics still require independently observed browser cancellation. For an initial retry absent from those network events, a narrow additional classifier requires the exact local demo-project URL, an observed fetch issued after beforeunload, its native TypeError/Load failed rejection while leaving, and subsequent pagehide of the same document. The observer preserves native responses and rethrows rejections; it does not change app transport or retry behavior. Negative tests reject active-page errors, mismatched URLs/documents, wrong lifecycle ordering, missing lifecycle events, other hosts/ports/projects and unrelated exceptions. Replay of the actual failing trace matches the unload retry, while the same trace marked as active fails. Unknown errors and missing server data still fail the run.

## Validation

Focused 1,440 tests, all 463 unit/backend/browser tests and the full 1,740 UI tests pass (2,203 unit/UI tests total). Local WebKit and Chromium each pass 34 complete challenge journeys, 20 exam journeys and 10 full retakes with no uncaught page errors and all external requests blocked. The final emulator run passes all 15 service scenarios, both complete account/assessment journeys and the parent completion check. At 1440px, one diagnostic matches the independently observed exact unload-retry lifecycle; no app errors or active-channel failures remain. The 390px offline challenge/exam queue and 1440px rapid online reload both retain their server data. Lint, production build, Capacitor asset sync and iPhone 18 Pro simulator build/install/launch pass. New-head CI will be reported in the PR after its logs are verified. These checks do not replace physical-device, live-payment or deployed Firebase acceptance.

## Exact publication manifest

1. `src/App.jsx`
2. `src/screens/ExamPlayer.jsx`
3. `tests/billing-client.test.jsx`
4. `tests/curriculum-audit.test.jsx`
5. `scripts/qa-assessments.mjs`
6. `scripts/qa-firebase-browser.mjs`
7. `tests/fixtures/firebase-emulator.js`
8. `docs/qa/2026-09-20-assessment-journeys.md`
9. `scripts/firebase-qa-config.mjs`
10. `tests/firebase-qa-config.test.mjs`
11. `docs/qa/2026-09-20-exam-progress.md`

The preexisting package.json script approvals and sources/ are excluded. No merge, deployment, live purchase, invitation or production-account change is included.
