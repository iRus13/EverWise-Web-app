# Complete challenge and exam browser journeys

## Coverage added

The prior curriculum suite rendered all activity blocks and exercised exams in a DOM test environment. It did not prove that learners could reach and use the controls throughout actual browser challenge/exam journeys.

A new fixture renders the real AppShell, ChallengePlayer and ExamPlayer using all currently authored challenges and exams. Only the final navigation/completion callbacks are isolated. The shared WebKit/Firefox browser runner now plays these flows at 320x568 with text size 10 and 1440x900 with text size 2:

- All 17 challenges: answer every multiselect, turn and read all flashcards, fill each blank, answer the scenario and true/false question, check progress increments and explanation content, and use the final return action. No Skip actions are used.
- All 5 exams: answer all 10 questions correctly and verify the exact passing score, then separately fail one point below the stated passing score. Answer buttons lock after selection. Failure cannot expose the completion action. Retake starts at question one with no selected answer; answering all questions incorrectly on that second attempt produces zero, proving the earlier nonzero score was cleared. Back exits cleanly.
- Every clicked control must be reachable through user-scrollable ancestors before Playwright clicks it. Hidden clipping ancestors stay fixed; both ends of oversized controls are measured. No premature or duplicate completion callback is accepted.

That is 34 complete challenge journeys and 20 exam journeys plus 10 complete retakes per browser, covering 85 authored challenge blocks and all 50 exam questions. The broader curriculum comprises 1,224 lesson blocks plus those 85 challenge blocks, or 1,309 total.

## Validation and limits

Local WebKit and Chromium each passed all 54 journeys plus 10 complete retakes, with no uncaught errors. After the sentence correction, focused WebKit/Chromium checks passed at both viewport/text settings; all 1,730 UI tests, lint, production build, Capacitor sync and iPhone 18 Pro simulator build/install/launch passed. New-head CI results will be recorded after their logs are verified. All external requests are blocked. The walkthrough also exposed an awkward Phase 1 completion sentence, “A Wi-Fi connects…”. It now reads “A device can connect to a wireless network using Wi-Fi.” Runtime dependencies and deployment configuration are unchanged. The later passing-score and saved-retake fixes are documented in [exam scoring and progress](2026-09-20-exam-progress.md).

The fixture proves browser player behavior, readable/reachable actions and callback results. It does not prove App-level persistence/unlocking after these callbacks, physical-device accessibility, live accounts/payments or independent editorial accuracy of the curriculum. App progress persistence has separate emulator coverage. The successful challenge route is covered; every incorrect choice inside every challenge is not claimed.

## Exact publication manifest

1. `scripts/qa-assessments.mjs`
2. `scripts/qa-webkit.mjs`
3. `tests/fixtures/assessments.html`
4. `tests/fixtures/assessments.jsx`
5. `src/data/phase-challenges.js`
6. `docs/qa/2026-09-20-assessment-journeys.md`

The preexisting package.json dependency-script approvals and sources/ remain untouched. No deployment, merge, purchase, invitation rotation or production account mutation is included.
