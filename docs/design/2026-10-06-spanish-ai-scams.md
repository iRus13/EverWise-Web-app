# AI lessons: readable guidance and clear examples

October 6, 2026. Designed for adults 60–80. Development evidence, not a published release.

## Visible changes

- All eight phase 11 lessons now use Spanish throughout readings, exercises, feedback, examples, memory links, completion and the final challenge. Readings use two paragraphs and put the learning goal before optional review. Native adds 580 catalog entries; web adds 596. Coverage includes 634 native and 632 normalized web display keys, with distinct answer labels and grammatical sentence-building choices. Existing translations are preserved.
- The AI lessons label their optional reminder **Review safe AI habits** / **Repasar hábitos seguros con la IA**. An optional authored heading drives native/web text and narration; older content retains the warning-sign label. The existing full-width native control and web details/summary behavior remain, including large-text wrapping, keyboard focus and reduced-motion support. Narration includes the habits only when expanded.
- Call and video examples now explicitly identify themselves as transcripts. The simulated link remains plain text, with an example notice, while real answer buttons remain below the question.
- Seventy-four reviewed source corrections remove misleading certainty and unhelpful judgments: good grammar never established trust; voices can be imitated; not every emergency appears immediately in news; independent sources must actually be independent; AI may have web or shared-data access but still give outdated or wrong information. Emergency examples direct learners to official alerts and safety instructions without waiting for every source to repeat them. The scored clues are present in the examples.
- IDs, order, answer tiers, answer indices and saved-progress structures remain unchanged. Eight reading blocks gain optional reminder-title metadata. The next phase's first title is translated to make the handoff readable; full phase 12 content remains unfinished.

## Verification

- Native Unit plan: **404 checks pass** (353 XCTest + 51 Swift Testing), including complete phase 11 coverage, distinct choices, visible-state narration, fill-in grammar and curriculum integrity.
- Native phone **375×667** and iPad **834×1210**: all eight reading openings; expanded/collapsed reminders at regular and maximum text; call/video transcripts with unsafe-answer review and continuation; maximum-text video example; the full five-step challenge, including the sentence “Una voz copiada con IA se llama clon de voz.” The handoff opens phase 12 and marks its first lesson Current. All four focused UI methods pass on both devices.
- **2,489 web component checks across 42 files pass**, plus **483 Node checks** and **13 exporter checks** against the explicit web source. The full web run initially caught the previous phase-boundary expectation; it was updated to phase 12 and the complete run passed. The first native UI command referenced an unavailable test plan and did not run tests; the corrected UI-Smoke runs passed.
- Production web build and compiled review build pass. Lint retains the existing Message Checker hook warning; existing build chunk/import warnings remain.
- Actual web review: eight phone openings, two paragraphs each, no horizontal overflow; tablet reading and transcript hierarchy; Enter opens/closes the reminder; maximum-text reminder and decision/feedback continuation; the complete challenge exercised through Spanish completion using local synthetic progress.
- Release simulator build passes for **arm64/x86_64**, minimum **iOS 15.0**, iPhone and iPad families. Both native test runtimes are iOS 27. This does not establish older-runtime, physical-device, audible or production-service acceptance.
- Content hash: `9c9c5a5c31e6f3953991bc62f3299013f5300f4e38c689a4caf349a37d06887c`.

Screenshots, hashes and the translation review CSV are committed. Full local screenshots, result bundles, correction log and metadata diff are under `research/native-redesign-2026-10-06/spanish-ai-scams/` in the parent workspace.

## References

The reminder and adaptive reading layout follow the project's application of Apple's [disclosure-control guidance](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls) and [layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout). This is not Apple certification.

Content review used the [FBI guidance on generative AI fraud](https://www.ic3.gov/PSA/2024/PSA241203), [FTC guidance on copied-voice family emergency scams](https://consumer.ftc.gov/consumer-alerts/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes), [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf), and [NIST synthetic-content report](https://www.nist.gov/publications/reducing-risks-posed-synthetic-content-overview-technical-approaches-digital-content). The practical advice emphasizes independent verification and the possibility of confident errors rather than claiming reliable visual detection.

## Still open

Spanish phases **12–17**, independent bilingual review, representative sessions with adults 60–80, older physical-device performance and VoiceOver/audio, deployed accounts/deletion and Message Checker, real StoreKit purchases/restoration and the published-app TestFlight upgrade. Publisher bundle/product/build/signing reconciliation remains necessary. No merge, deployment, publisher message or App Store submission occurred.

[Review CSV](../localization/spanish-ai-scams-review.csv) · [Screenshots](evidence/spanish-ai-scams/)
