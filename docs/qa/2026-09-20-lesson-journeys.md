# Full lesson journeys and quiz recovery

## Reproduced defects

LessonPlayer counted a correct answer again after Back navigation, including after a storage/reload round trip. Changing a missed answer during backtracking could inflate the first-attempt completion score. Missed answers were not saved while the quiz was in progress, so reloading before review could bypass the required second look. Skipping an unanswered quiz question also bypassed review. Five new behavior regressions failed before repair.

The player now remembers how many questions have had their first attempt, saves immediately when answering, and persists the outstanding review list on every navigation. Repeat answers do not add points. Skip postpones the question to review. The position store validates the optional first-attempt marker and preserves it across reloads. Its existing learner/lesson key delimiter is unchanged; a literal NUL in the source is now written as an escaped character so the file is readable as text.

Old quiz positions lack enough history to reconstruct first attempts. They restart the quiz while retaining the completed teaching blocks; old review queues remain resumable. Old review scores are bounded by their known outstanding mistakes, so those mistakes cannot simultaneously count as correct answers. That additional regression also failed before the bound was added.

## Browser coverage

The new runner exercises all 111 authored lessons in the real LessonPlayer and AppShell. Each lesson goes through every activity, every scored question, all optional confidence-practice questions, and exactly one completion callback with the correct score. Full journeys do not use Skip or injected completion. Separate navigation/recovery journeys deliberately use Back, Skip and reload to verify first-attempt scoring and required review.

Coverage is split into four deterministic groups, each at320×568/largest text and1440×900/normal text. Controls must be reachable by scrolling containers a learner can scroll; hidden ancestors cannot be moved to disguise clipping. External traffic is blocked and uncaught browser errors fail. The CI matrix runs all four groups in Chromium, WebKit and Firefox.

This is player-level interaction coverage with synthetic identity/local position storage. Live account completion, Firebase persistence, paywalls and entitlement checks are covered separately; this runner does not replace those checks, physical-device usability, audible narration or independent content review.

## Validation status

All four local WebKit groups completed successfully. Their logs contain exactly111 distinct lesson IDs, once at each viewport:222 journeys,2448 authored activity-block visits,748 scored questions and240 confidence-practice questions. Separate recovery journeys passed at both sizes. The subsequent legacy-score bound and stricter stored-position consistency check passed the final UI/storage regressions and Chrome pilot; new-head CI reruns the entire curriculum against that final source.

The unit/backend/browser suite passed465 checks, with all9 position-storage checks rerun after the final guard. The final full UI suite passed1749 tests (2214 unit/UI checks combined). The previous partner orchestration helper depended on skipping every quiz answer; it now answers the authored quiz before asserting the pending-save/late-entitlement race. The original race assertion remains intact.

Final-source Chromium passed10 complete representative lesson journeys spanning every activity type, plus the4 recovery journeys. Lint, production build, Capacitor synchronization and iPhone18Pro simulator build/install/launch passed (PID21751). No uncaught browser errors occurred and external requests were blocked. New-head CI is separate and must be verified from its final15 job logs and parent conclusion before being called green.

The first full browser attempt exposed a test-harness assumption: different confidence-practice scenarios share the same heading. Matching now uses scenario text and all choices, and verifies each distinct scenario exactly once. No curriculum content was changed to accommodate the test.

## Exact publication manifest

1. .github/workflows/qa.yml
2. src/screens/LessonPlayer.jsx
3. src/utils/lessonProgress.js
4. tests/lesson-review.test.jsx
5. tests/lesson-progress.test.js
6. tests/partner-client.test.jsx
7. scripts/qa-assessments.mjs
8. scripts/qa-lesson-journeys.mjs
9. scripts/qa-lessons.mjs
10. tests/fixtures/lesson-journeys.html
11. tests/fixtures/lesson-journeys.jsx
12. docs/qa/2026-09-20-lesson-journeys.md

Preexisting package.json script approvals and sources/ are excluded. No merge, deployment, live account or payment action is included.
