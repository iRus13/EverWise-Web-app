# Scam Protection: clearer practice and Spanish foundations

October 6, 2026. Target audience: adults aged 60–80. Development source and review evidence; not an App Store release.

## What changed

- The four opening Scam Protection lessons and phase 8 challenge now have complete Spanish authored copy: readings, tiered answers and feedback, optional confidence practice, memory connections, final scenarios, summaries and the next-step label. The review CSV lists all 322 native display keys. The normalized web set contains 321 keys. This adds 299 native and 334 web catalog entries without changing prior translations.
- Native and web readings use two shorter paragraphs. On web, the explanation comes before the learning goal; the question supports a single heading instead of competing with a large objective card. Tiered/final scenarios use plain reading text and a short decision heading. Shared answer markers distinguish the selected answer from the recommended alternative.
- Web reading, tiered, confidence, memory and final-scenario activities now follow the language setting for their full visible and spoken copy. Confidence choices require Continue, reset after extra practice and offer read-aloud. Final/tiered narration includes only the revealed feedback and recommendation, not unselected explanations.
- The native final-scenario review paragraph and narration use the same translated reassurance. An English fallback bug could expose `fillblank.word.pause` after catalog compilation; the helper now returns the ordinary word when the compiled source-language value is a catalog key.
- All ten Scam Protection phase-ending lessons now say the lesson is complete. They no longer claim the phase or course is finished while a challenge is still pending. Existing challenge and course completion logic remains authoritative.
- Twelve English safety explanations remove false guarantees about deadlines, caller identity, remote access and browser pop-ups. Four reading strings gain paragraph breaks, and twenty completion strings remove premature claims: 36 source-string changes in total. IDs, order, block types/counts, answer tiers/indices and progress structures are unchanged; the native integrity hash was updated.

## Evidence

- Native: 399 Unit-plan checks pass (350 XCTest + 49 Swift Testing). Four focused UI methods pass on both the 375×667 phone and 834×1210 iPad, covering all four readings, maximum-text choices/connections/final review, both extra-practice questions and the complete phase challenge. The affected maximum-text method passed again on both devices after visual review found and fixed an untranslated review paragraph. All eight reading openings and representative practice/feedback/completion captures were visually inspected.
- Native Release simulator build passes for arm64/x86_64, retaining minimum iOS 15.0 and both device families. Both installed test runtimes are iOS 27. This does not establish older-runtime or physical-device compatibility.
- Web: 2,452 component checks across 39 files passed, followed by 1,429 focused checks across five files after the final narration/handoff changes. Final lint/build pass with existing hook/chunk warnings. Production-compiled components were reviewed at 375×667 and 834×1210, including maximum-text confidence/feedback, all four tablet readings and the full challenge. The final handoff title was also checked with the same completion component restored to its finished state.
- Thirteen historical exporter checks pass with the existing web checkout explicitly configured as the reference. Service/provider checks from earlier increments retain their dated scope.

The CSV and curated original screenshots with SHA-256 hashes are committed. Full local images, result bundles and an interactive comparison are in `research/native-redesign-2026-10-06/spanish-scam-foundations/` in the parent workspace.

## Design and content references

The reading order, adaptable type and clear choices follow [Apple’s accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility) and [Dynamic Type guidance](https://developer.apple.com/videos/play/wwdc2024/10074/). They are project design choices for older adults, not an Apple certification. Safety wording was checked against the [FTC’s phone scam advice](https://consumer.ftc.gov/articles/phone-scams) and [tech-support scam guidance](https://consumer.ftc.gov/system/files/consumer_ftc_gov/pdf/933A-PIO-TechSupport-TearSheet-2022-508.pdf): caller ID can be faked, and independently chosen trusted support contact details are safer than an unexpected message’s instructions.

## Remaining work

Scam Protection phases 9–17 still need complete Spanish content and review. Independent bilingual acceptance, representative sessions with adults 60–80, physical speech/VoiceOver, older-device performance, real deployed accounts/deletion/Message Checker/StoreKit and a TestFlight upgrade remain open. The language notice now identifies phase 8 as the translated boundary. No merge, deployment, publisher message or App Store submission occurred.

[Review CSV](../localization/spanish-scam-foundations-review.csv) · [Screenshots](evidence/spanish-scam-foundations/)
