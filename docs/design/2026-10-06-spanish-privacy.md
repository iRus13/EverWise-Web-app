# Personal information: clearer reading and practical privacy habits

October 6, 2026. Designed for adults 60–80. Development review, not a published release.

## Visible changes

- All seven phase 12 lessons and their final challenge have authored Spanish readings, questions, examples, answer feedback, memory links and completion copy. **552 native / 564 web catalog additions** cover **591 native / 590 normalized web display keys**. Existing translations are preserved; answer labels remain distinct. The challenge correctly forms “Un gestor de contraseñas guarda contraseñas únicas de forma segura.”
- Reading pages use two paragraphs, a clear learning goal and an optional **Review privacy habits** / **Repasar hábitos de privacidad** control. This replaces the inaccurate warning-sign label for the privacy advice. The existing native full-width control, web keyboard behavior, large-text wrapping and reduced-motion behavior are retained.
- Support-call and reception examples explicitly say they are example conversations/transcripts. Sample messages remain visually separate from the real answer buttons. Corrective feedback is respectful and permits continuation.
- **118 reviewed English source corrections** clarify what learners should do: verify unexpected requests through a trusted route; do not infer trust from a friendly explanation; treat sample passwords as public examples; use long, random, unique passwords; protect a password manager’s actual unlock and recovery methods; keep sign-in codes private; do not infer a stolen password from the timing of a code alone; use official recovery if locked out, sign out other sessions and check recovery details after unauthorized access.
- Password-manager guidance names **Passwords** on iOS/iPadOS 18 and later, and **Settings → Passwords** on versions 15–17. It no longer implies every manager uses a separate master password. The lesson includes Face ID, Touch ID and device passcodes where applicable.
- Course IDs, lesson ordering, answer tiers/indices and saved-progress structures are unchanged. Seven readings add optional reminder-title metadata. Native and normalized web phase-12 data match after excluding native presentation/text-role metadata. The first title of phase 13 is translated for a clear handoff; its remaining content is still pending.

## Verification

- **405 native Unit-plan checks pass**: 354 XCTest + 51 Swift Testing. The new phase contract checks display coverage, distinct choices, visible-state narration, two-paragraph reading and fill-in grammar. An initial copied assertion incorrectly prohibited a reminder phrase already present in the reading; the final check verifies that expanding the reminder adds exactly one occurrence, and the complete unit plan passes.
- **Four focused UI methods pass on both iPhone 375×667 and iPad 834×1210**, using iOS 27 simulators: all seven lesson openings; expanded/collapsed reminders at regular and maximum text; long password examples at both text sizes; verification-code example with corrective feedback and continuation; the full five-step challenge and phase-13 handoff with the next lesson marked Current.
- **2,502 web component tests across 43 files**, **483 Node checks**, and **13 exporter checks** pass. Production and compiled review builds pass. Lint retains the existing Message Checker hook warning; existing build chunk/import warnings remain.
- Browser review exercised seven phone openings, a tablet reading and two-message example, keyboard open/close of the reminder, maximum-text choice/feedback and reminder continuation, and all five challenge steps through Spanish completion. The reviewed phone pages remain 375 pixels wide without horizontal overflow. The review uses synthetic progress and local callbacks; it does not prove production service integration.
- Release simulator build passes for **arm64 and x86_64**, minimum **iOS 15.0**, iPhone and iPad families. The test runtime is iOS 27; this is not evidence of older-runtime or physical-device acceptance.
- Native lesson-content hash: `f5b7405f748daa4cdcd1ed2c70d36efe2ec9e0e0608e96fb7caf53b4090bbc61`.

Screenshots, hashes and the translation CSV are committed. Full local screenshots, result bundles, correction log and data-parity evidence are in the parent workspace under `research/native-redesign-2026-10-06/spanish-privacy/`.

## References

The adaptive layout and optional reminder follow the project's application of Apple's [layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout) and [disclosure-control guidance](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls). This is not Apple certification.

Content review used Apple's [saved-password instructions for newer and older iOS](https://support.apple.com/en-gb/104955), [password-safety guidance](https://support.apple.com/en-euro/guide/personal-safety/ipsec74bc4cf/web), CISA's [strong-password advice](https://www.cisa.gov/resources-tools/resources/four-cybersecurity-essentials-sltts), and FTC guidance on [two-factor authentication](https://consumer.ftc.gov/articles/use-two-factor-authentication-protect-your-accounts), [account recovery](https://consumer.ftc.gov/articles/how-recover-your-hacked-email-or-social-media-account) and [responding to scams](https://consumer.ftc.gov/articles/what-do-if-you-were-scammed).

## Still open

Spanish phases **13–17**, independent bilingual review, sessions with representative adults 60–80, older physical-device performance and VoiceOver/audio, deployed accounts/deletion and Message Checker, real StoreKit purchases/restoration and the published-app TestFlight upgrade. Publisher bundle/product/build/signing reconciliation remains necessary. No merge, deployment, publisher message or App Store submission occurred.

[Review CSV](../localization/spanish-privacy-review.csv) · [Screenshots](evidence/spanish-privacy/)
