# Digital Finance in Spanish — October 6, 2026

All seven Phase 4 lessons and the final challenge now have Spanish reading, practice, choices, feedback, flashcards and completion copy. This adds **847 learning translations** and preserves every existing entry. Coverage includes **869 distinct normalized web display keys**, with shared title/award strings resolved through the existing interface dictionary. The language selector now names Digital Finance as translated; the English-content notice begins with Phase 5.

The lessons are Online Banking, Credit Cards, Mobile Payments, Payment Apps, Online Shopping, Refund Scams and Fake Websites. Contextual word translations keep Spanish fill-in sentences grammatical while scoring retains the original answer values. The CSV in `docs/localization/spanish-digital-finance-review.csv` records the translation review material.

Eleven matched English source corrections clarify encrypted connections versus seller trust, credit-card interest/grace-period conditions, Express Mode exceptions, protected purchases versus personal transfers, and unexpected callers requesting one-time codes. No lesson IDs, activity ordering, answer identities or saved-progress structures changed. References: [CFPB](https://www.consumerfinance.gov/ask-cfpb/what-is-a-grace-period-for-a-credit-card-en-47/), [FTC payment apps](https://consumer.ftc.gov/articles/mobile-payment-apps-how-avoid-scam-when-you-use-one), [Apple Express Mode](https://support.apple.com/en-us/105123), [PayPal](https://www.paypal.com/us/digital-wallet/buyer-purchase-protection) and [Zelle](https://www.zelle.com/security).

## Checked behavior and appearance

- Final component suite: **2,372 tests across 37 files passed**. Lint and production build passed; existing bundle-size/dynamic-import warnings remain. The earlier non-browser Node suite was not rerun for this presentation/content increment.
- The first focused localization run had 140 passes and one stale coverage-boundary expectation. The expectation was updated to include Phase 4, and the subsequent complete suite passed.
- In an actual-component browser harness, three banking fill-in questions were completed at 375×667 with the maximum in-app text size. Sentences used the expected Spanish grammar and advanced normally; the document remained 375 pixels wide.
- At 834×1112, the credit-card reading was visually reviewed and all five challenge activities were completed through the translated handoff. Captures include multiple-answer review and completion. This uses synthetic progress and callbacks, not a deployed account.
- Curated raw screenshots and SHA-256 hashes are in `docs/design/evidence/spanish-digital-finance/`. The parent workspace holds the full gallery and logs at `research/native-redesign-2026-10-06/spanish-digital-finance/`.

The native companion passed 387 Unit-plan checks, three UI methods on each small-phone/iPad simulator and an arm64/x86_64 Release simulator build retaining the iOS 15.0 minimum. Native screenshots include all seven reading openings and maximum-text practice.

Later-course translations, independent Spanish review, real speech/assistive-technology use, production services, real purchases and release upgrade acceptance remain open. No merge, deployment or App Store submission occurred.
