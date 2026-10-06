# EverWise visual redesign — local delivery

The local iOS and web application now use a shared, quieter visual system. This delivery changes the product itself; the simulator is running the regular `com.everwise.app` build, with the original Rty profile at Welcome, zero completed lessons and zero badges.

## The ten priorities addressed

1. **Competing decoration:** replaced the beige/gradient-heavy surfaces with neutral grouped backgrounds, white content, restrained separators and one consistent accent.
2. **Unclear Home hierarchy:** rebuilt Home around Today, the next lesson, a compact Scam Checker entry and truthful progress.
3. **Inconsistent typography:** introduced system typography with separate page, question, body and supporting-text sizes.
4. **Fragmented navigation:** added consistent Home, Course, Checker, Badges and Settings destinations; wide layouts use a sidebar.
5. **Inconsistent controls:** standardized button sizing, fields, answer selection, pressed/disabled states and feedback.
6. **Excessive cards:** simplified course groups, Settings sections and memory reviews; retained containers where grouping helps comprehension.
7. **Onboarding/account clutter:** aligned forms, progress, narration, spacing and primary actions across setup and account screens.
8. **Paywall hierarchy:** clarified benefits, plan selection, prices and renewal terms while retaining metadata-driven billing and the free-learning exit.
9. **Checker density:** separated message entry, privacy guidance, verdict and recommended next steps; made error/retry states consistent.
10. **Uneven learning presentation:** normalized lesson chrome and question type; repaired overlaid/reversed flashcard faces, added labeled card navigation, made answer selection visible, and simplified memory reviews and the practice-password result.

## Context and boundaries

The attached brainstorm was read in full. The product interpretation and contradictions are recorded in [the product-context analysis](2026-09-24-product-context.md). It supports an adult, reassuring learning experience that builds independence, without treating every historical feature idea or price as an approved requirement.

Curriculum, progress, account authentication and billing semantics were intentionally preserved. No new health questions, fabricated statistics, streak pressure or unimplemented protection promises were added. Existing React/Capacitor architecture remains; this is not a UIKit rewrite. No deployment, merge, push or live purchase was performed.

## Evidence

Main app comparisons: `/Users/qwertyx/Documents/Codex/EverWise/qa-premium-redesign/comparison.html`. Learning comparisons: `/Users/qwertyx/Documents/Codex/EverWise/qa-learning-polish/comparison.html`.

The main design pass covered landing, onboarding, login/signup/reset, personal plan, Home, Course, lesson, completion, Badges, Scam Checker, Settings, account and paywall. Its evidence includes 1,954 UI tests, 130 responsive layouts, actual iPhone/iPad screenshots, native navigation, and checker/loading/billing error states; see `qa-premium-redesign/verification.md` for the exact scope and timing.

The final learning pass inspected all 13 authored activity types in WebKit on phone and tablet. It exercised flashcard turning and previous/next, scenario correction and builder selection with native gestures on iPhone 18 Pro and iPad mini. A further 56 viewport/text-size combinations passed horizontal-fit and minimum-touch-size checks, including one-visible-face flashcard assertions and builder continuation. Focused learning behavior tests: 33 passed. Lint, web/Capacitor sync and Release simulator build passed. All 25 packaged web files match the built assets; the regular app contains no QA controller.

Screenshots demonstrate the rendered layouts at the recorded sizes. They do not establish perfection on every physical device, every OS release, or production payment-provider behavior.
