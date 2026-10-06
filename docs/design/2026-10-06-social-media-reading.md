# Social Media reading and Spanish — October 6, 2026

EverWise is for adults 60–80. This increment extends the established readable lesson system through Social Media, completes that stage's Spanish presentation and repairs an inconsistent web question hierarchy.

## Visible changes

- All seven Social Media lessons and their final challenge now have Spanish reading, instructions, options, explanations, word banks and completion copy: privacy, friend-request scams, giveaways, fake news, political misinformation, deepfakes and reporting accounts.
- 724 Spanish catalog entries were added in each app. Existing translation values were preserved. The coverage notice explicitly says later lessons and AI results remain English.
- The web now presents 173 example-based choice exercises as readable body text followed by a short decision heading, using the existing scenario typography and controls. The progress header says Practice. Two direct questions and unknown future content keep their complete question heading. Narration follows the visible story-then-question order.
- Native lessons continue using their authored question/supporting-text roles and shared typography. Spanish answer buttons wrap; accessibility text scrolls in the content flow.

## Content accuracy

Thirty-three native string locations (25 distinct replacements, mirrored in web source) were corrected without changing lesson identity, order, block counts, answer indices, canonical fill values or saved-progress structure. This is a deliberate content change, not translation-only work.

Privacy copy now explains that tagging can expand audiences and that screenshots may survive deletion. Blocking limits contact from a profile without guaranteeing total invisibility. A familiar photo or mutual friend does not confirm a requester's identity. Election information points to the responsible office; repeated posts do not establish independent confirmation.

Four image-description exercises now ask what can be concluded. Natural details cannot prove authenticity; odd details suggest verification rather than proving AI. Distractors are distinct from the correct answer. A source's origin provides context, not an automatic truth guarantee. Spanish wording avoids jokes about age or forgetfulness.

References: [Meta tagging audiences](https://www.facebook.com/help/124970597582337/r.php/), [Meta blocking limits](https://www.facebook.com/help/116140961805074/), [USA.gov election offices](https://www.usa.gov/election-office), [FTC cloned family voices](https://consumer.ftc.gov/consumer-alerts/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes), [NIST deepfake guidance](https://www.nist.gov/document/deepfake-desktop-version).

## Verified scope

- Native: 394 Unit-plan checks passed (345 XCTest + 49 Swift Testing). Four Social Media UI methods passed on each 375×667 phone and 834×1210 iPad simulator. After clarifying the two natural-image distractors, the two affected phone methods were rerun successfully; iPad used the final wording. Tests cover seven reading openings, maximum text exercises, all four image decisions and the five-part challenge through the assessment handoff.
- Native Release simulator build passed for arm64/x86_64, with minimum iOS 15.0 and iPhone/iPad families retained. Both tested simulators run iOS 27; these results do not establish older-runtime or physical-device acceptance.
- Web: 2,416 component checks across 37 files, lint and production build passed. Real AppShell/learning components were visually checked at 375×667 and 834×1210, including maximum phone text, four image decisions and the full tablet challenge. The local harness supplies synthetic progress/callbacks; it does not establish production-account acceptance.
- Catalog checks cover 800 native and 770 normalized web display keys, preserve prior translations and verify sentence blanks and scoring identity. The review CSV is supplied for bilingual review.
- All fourteen native reading openings and representative exercise/completion captures were visually inspected. Curated originals and SHA-256 hashes are in `docs/design/evidence/spanish-social-media/`. Local result bundles and the full gallery are in `research/native-redesign-2026-10-06/spanish-social-media/` in the parent workspace.

Existing React-hook/bundle-size and local Xcode environment/test-framework warnings remain. The translation has not had independent bilingual acceptance. Speech audibility, VoiceOver, physical and older devices, production services/accounts/StoreKit and a TestFlight upgrade remain open. Native deployment target alone does not prove runtime compatibility; older Safari also needs its own acceptance. No release archive, publisher message, merge, deployment or App Store submission was made.
