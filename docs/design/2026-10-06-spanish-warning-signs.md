# Warning Signs: readable examples and the next path step

October 6, 2026. Target audience: adults 60–80. Development review, not an App Store release.

## Changes

- Five phase 9 lessons and the challenge have Spanish readings, practice, choices, feedback, simulated messages, memory connections, completion copy and narration. Coverage: 390 native and 389 normalized web display keys; 349 native and 361 web catalog additions. Existing translations are preserved. The review CSV records each key and its location.
- Five reading openings use two paragraphs. Thirty-three reviewed English edits produce 36 canonical string replacements, including three shared occurrences in later stages. They clarify independent verification, pressure and secrecy, gift-card recovery and cryptocurrency risk. Source IDs, structure, ordering, answer tiers/indices and progress identifiers remain unchanged; the native content hash matches the exporter contract.
- Native example senders and displayed link labels now use the selected language. Message containers preserve separately addressable text. Web examples gain an explicit section heading, quiet bordered message surface, a plain link label and a visible notice that the example cannot be tapped. Read-aloud includes that notice. Example links are neither buttons nor links.
- A native end-to-end check found that a completed stage could remain expanded while the next stage stayed collapsed or offscreen. The path now opens and reveals a newly reached phase. It restores after first layout without waiting for another geometry change, while ordinary tab returns preserve the learner's expansion choices and bookmark. This applies across phases, not only phase 9.
- The web language notice now marks phase 9 as the translated boundary. Stages 10–17 remain unfinished.

## Verified evidence

- Native Unit plan: 402 checks pass (351 XCTest + 51 Swift Testing), including catalog/narration coverage, word-bank fallback, stable curriculum contracts and new path advancement/bookmark cases.
- Native rendered checks: all five reading openings on each 375×667 phone and 834×1210 iPad; translated call/bank examples at regular and maximum text; an unsafe answer followed by review; and the complete five-part phase challenge. The corrected handoff returns to the expanded phase 10 with its first lesson marked Current. The iPad sidebar/reading-preference retention check also passes. Original failed checks and their corrections are retained locally; only the final outcomes are claimed.
- Final native Release simulator build passes for arm64 and x86_64, with minimum iOS 15.0 and iPhone/iPad families retained. Both installed test runtimes are iOS 27. Older-runtime and physical-device acceptance remain open.
- Web: 2,461 checks across 40 files pass; 21 focused checks pass after the final semantic-label cleanup. Final build passes; lint has the existing Message Checker hook warning, and the build retains existing chunk/import warnings. Production-compiled views were inspected at 375×667 and 834×1210, at regular and maximum text. No horizontal document overflow was observed at either width. The finished challenge's next-lesson presentation was also reviewed; its local progress/callbacks are synthetic.
- Thirteen exporter checks pass against the explicit web reference. Earlier service checks retain their dated scope.

Curated original screenshots and SHA-256 hashes are committed. The full screenshots, local result bundles, correction log and comparison gallery are in the parent workspace at `research/native-redesign-2026-10-06/spanish-warning-signs/`.

## References and limits

The legible hierarchy, scalable type and explicit controls follow [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility) and [Dynamic Type guidance](https://developer.apple.com/videos/play/wwdc2024/10074/). These are project design decisions, not Apple certification.

Safety wording was checked against FTC guidance on [gift-card scams](https://consumer.ftc.gov/articles/avoiding-and-reporting-gift-card-scams), [utility impersonation](https://consumer.ftc.gov/articles/scammers-pretend-be-your-utility-company), [fake emergencies](https://consumer.ftc.gov/articles/scammers-use-fake-emergencies-steal-your-money) and [cryptocurrency scams](https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-scams). A warning sign prompts verification; a convincing voice or a chosen contact route alone is not proof of identity. Already shared gift-card numbers warrant prompt contact with the issuer rather than an absolute claim that recovery is impossible.

Still open: Spanish stages 10–17; independent bilingual review; representative sessions with adults 60–80; physical VoiceOver/speech and older-device performance; production account/deletion/Message Checker/StoreKit acceptance; source/signing/product identity reconciliation; and a TestFlight upgrade from the published app. No merge, deployment, publisher message or App Store submission occurred.

[Review CSV](../localization/spanish-warning-signs-review.csv) · [Screenshots](evidence/spanish-warning-signs/)
