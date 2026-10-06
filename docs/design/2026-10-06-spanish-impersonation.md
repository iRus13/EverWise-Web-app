# Impersonation lessons: calmer reading and clearer advice

October 6, 2026. Audience: adults 60–80. Development review, not an App Store release.

## Visible changes

- All eight phase 10 lessons now open with two readable paragraphs followed by the learning goal. Repeated warning signs move into a clearly labeled optional reminder. The native row is a full-width button with a minimum 56-point height, scalable text, an expanded/collapsed accessibility value and a reduced-motion-aware transition. The web uses native details/summary with a visible keyboard focus treatment.
- Read-aloud includes the warning signs only while the reminder is expanded, in the same order as the screen. Changing expansion stops existing playback through the existing request-change handling. Moving to another reading resets the reminder. Physical audible/VoiceOver acceptance remains separate.
- Spanish now covers all eight lessons and the phase challenge: readings, choices, feedback, examples, memory connections, completion, narration and sentence-building words. There are 562 native and 578 web catalog additions, covering 623 native and 622 normalized web display keys. Existing translations and canonical answer identities are preserved. The next lesson's title is also translated; its full phase is still unfinished.
- Seventy-two reviewed source edits produce 74 canonical replacements, including two shared occurrences in later stages. The corrections make scenario clues match scored answers, replace guaranteed recovery/deadline claims with specific verification steps, distinguish unsolicited support from requested help, and account for limited legitimate Medicare callbacks. The corrections keep IDs, ordering, scoring and saved-progress structures unchanged.
- Multi-message examples retain clear sender labels and noninteractive simulated links. Native text identifiers now distinguish senders and message bodies within each example.

## Verification

- Native Unit plan: 403 checks passed (352 XCTest + 51 Swift Testing). Coverage includes all phase 10 Spanish display keys, distinct choices, grammatical fill-in answers, hidden/expanded narration and unchanged curriculum contracts.
- Rendered native checks: eight opening screens on both 375×667 iPhone and 834×1210 iPad; reminders opened and closed at regular and maximum text; tech support, utilities and Medicare two-message practices, including an unsafe answer and continuing after feedback; maximum-text tech support practice; full five-part phase 10 challenge and return to the expanded next phase with its first node marked Current. Final outcomes are recorded separately from retained failed attempts.
- Final Release simulator build passes for arm64/x86_64. Minimum deployment remains iOS 15.0, with iPhone and iPad families. Both installed test runtimes are iOS 27; this does not establish older-runtime or physical-device acceptance.
- Web: 2,475 tests across 41 files pass. Final build passes. Lint retains the existing Message Checker hook warning; build retains existing chunk/import warnings. An unrelated Message Checker focus assertion failed once in a full run, passed in its isolated 31-test check, and passed in the final full run without product changes.
- Production-compiled web views were visually reviewed at phone/tablet widths and maximum text. The reminder opens and closes with Enter. No horizontal document overflow was observed in the reviewed views. The complete five-step challenge was exercised through its Spanish completion screen using local synthetic progress.
- Thirteen exporter checks pass against the explicit web reference. Native content hash: `12919b16465b8d5c093c32db4614016b1afdc656a0531e9731983a9c9f5ce1e0`.

Original screenshots, hashes and the translation review CSV are committed. Full local screenshots, result bundles and the exact correction log remain in `research/native-redesign-2026-10-06/spanish-impersonation/` in the parent workspace.

## Design and content references

The optional reminder follows Apple's guidance on [disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls) and [adaptable layouts](https://developer.apple.com/design/human-interface-guidelines/layout). Core reading, the learning goal and Continue remain directly available. These are project decisions, not Apple certification.

Content was checked against the [IRS contact guidance](https://www.irs.gov/help/how-to-know-its-the-irs), [Social Security scam guidance](https://www.ssa.gov/scam/), [Medicare fraud guidance](https://www.medicare.gov/basics/reporting-medicare-fraud-and-abuse), [Microsoft technical support guidance](https://support.microsoft.com/en-us/security/avoid-and-report-microsoft-technical-support-scams), [FTC recovery guidance](https://consumer.ftc.gov/articles/what-do-if-you-were-scammed), [FTC utility impersonation guidance](https://consumer.ftc.gov/articles/scammers-pretend-be-your-utility-company), [FTC family-emergency guidance](https://consumer.ftc.gov/articles/scammers-use-fake-emergencies-steal-your-money), and [Postal Inspection Service package-text guidance](https://www.uspis.gov/news/scam-article/smishing-package-tracking-text-scams).

## Still open

Spanish phases 11–17, independent bilingual review, representative sessions with adults 60–80, physical VoiceOver/audio and older-device performance, real account/deletion/Message Checker/StoreKit acceptance, publisher source/signing/product-identity reconciliation and a TestFlight upgrade from the published app. No merge, deployment, publisher message or App Store submission occurred.

[Review CSV](../localization/spanish-impersonation-review.csv) · [Screenshots](evidence/spanish-impersonation/)
