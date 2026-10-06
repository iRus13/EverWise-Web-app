# Emergency Skills in Spanish — October 6, 2026

EverWise is for adults 60–80. This increment completes the six Emergency Skills lessons and their final challenge in Spanish, using the existing native reading, practice and connected-path components.

## What learners see

- Spanish instructions, answer options, explanations, flashcards, sentence exercises, quizzes and completion text for suspicious links, stolen money, who to call, credit freezes, password recovery and FBI IC3 reports.
- 675 native and 676 web catalog additions. Previously translated text is retained except **Freeze**, now consistently **Congelamiento** in both apps. Canonical English scoring values and saved-progress IDs are unchanged.
- The web path no longer incorrectly labels translated phases 5 and 6 as English; the boundary now starts after phase 7. Settings uses a shorter coverage notice. Later Scam Protection lessons and AI results are still English.
- One updated web example initially fell out of the authored presentation map and became an oversized question. The map is corrected: the example is body text, followed by the short decision heading. Native retains its authored question/supporting-text roles.

## Content corrections

Fifteen English string locations were corrected and mirrored in Spanish and web source, without changing IDs, block order/count, scoring or answer indices. Recovery instructions now direct learners to official services, distinguish entering a password from merely opening a page, avoid treating two-factor authentication as a guarantee, and warn against using public example passwords. The credit-freeze lesson names all three U.S. bureaus and explains lifting a freeze. The police example now clearly describes a past theft with no immediate danger. Emergency numbers and reporting agencies have U.S. context. IC3 reporting does not promise a response or refund; recovery-fee scams are called out.

Primary references: [FTC recovery steps](https://consumer.ftc.gov/articles/what-do-if-you-were-scammed), [FTC credit freezes](https://consumer.ftc.gov/articles/credit-freezes-and-fraud-alerts), [Apple phishing guidance](https://support.apple.com/en-us/102568), [FBI IC3](https://www.ic3.gov/). The translation review CSV contains 739 native display keys and their source locations. Independent bilingual review remains open.

## Validation

- Native Unit plan: 396 checks (347 XCTest + 49 Swift Testing). Coverage includes all 739 phase display keys, distinct translated options, narration text, all 19 sentence answers and unchanged canonical scoring values.
- Three focused UI methods on both 375×667 phone and 834×1210 iPad simulators: open/advance all six reading introductions, complete maximum-text credit-freeze sentences and a police-contact choice, and complete the five-part challenge to its assessment handoff. The affected maximum-text method is rerun on both devices after the final terminology correction.
- All twelve native reading openings and representative practice/feedback/completion captures were visually inspected. Native Release simulator build retains arm64/x86_64, iOS 15.0 minimum and iPhone/iPad families. Both tested simulators run iOS 27; the deployment target does not prove older-device acceptance.
- Web: 2,440 component checks passed across 38 files, followed by focused terminology checks; lint and production build pass with the existing React-hook and chunk-size warnings. The production-compiled visual harness exercised phone reading, maximum-text selection/feedback, enlarged tablet credit-freeze instructions and the complete tablet challenge. It uses synthetic progress/callbacks, not production accounts.
- Thirteen exporter checks pass with EVERWISE_REFERENCE pointed at the existing web checkout containing the pinned historical commit. The default old-Mac path was unavailable; no exporter source change was needed.

Curated original screenshots and SHA-256 hashes are committed beside this record. Full local captures, result bundles and the interactive gallery are under `research/native-redesign-2026-10-06/spanish-emergency/` in the parent workspace.

## Still open

Later Scam Protection content, independent bilingual acceptance, physical speech/VoiceOver and older-device checks, release performance, production accounts/deletion/Message Checker/StoreKit and a TestFlight upgrade remain open. No production service change, merge, deployment, publisher message or App Store submission is part of this increment. These are development review files, not an upload-ready archive.
