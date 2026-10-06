# Older-browser foundations — October 6, 2026

The current web build assumed browser features newer than the native app's iOS 15 deployment minimum. Adults 60–80 may keep older devices, so core account, learning and navigation behavior must not depend on those conveniences.

## Observed failures and changes

With `Array.prototype.at` disabled, email validation, phase position and completed-course standing each threw a TypeError. The source also used `Object.hasOwn` 23 times across 15 files, including Spanish rendering, account/billing validation and resume storage. Both methods arrived in [Safari 15.4](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/).

- Replaced the own-property calls with one compatible helper that preserves inherited-property rejection, including null-prototype and shadowed objects. Replaced the three last-element accesses with indexes; the generated course catalog and its generator remain in sync. Scoring, saved data and access decisions are unchanged.
- Set production JavaScript/CSS targets explicitly to Safari/iOS 15, Chrome/Edge 96 and Firefox 91. [Vite's default baseline is newer, and syntax transforms do not provide API polyfills](https://vite.dev/guide/build). This configuration is a compatibility target, not a claim of full runtime acceptance.
- Centralized viewport height. Modern browsers retain native dynamic viewport units; browsers without them use a measured, resize-aware fallback. Navigation ownership and Settings value wrapping use explicit classes, without requiring CSS parent selectors.
- Added a normal visible focus ring when `:focus-visible` is unavailable. Modern browsers keep their existing focus heuristic. Added guarded heading-size enhancements and readable stacked partner-table rows when container support is missing. Native system text remains uncapped by the web-only container sizing rule.
- Localized the shared entry-flow Back control, which had remained English in Spanish login/password-reset screens.

## Validation and visual review

- The 2,416 existing component checks pass. Nine new checks cover missing APIs, own-property safety, Spanish labels, account-scoped lesson/assessment resume, final-course standing, email validation, measured viewport cleanup/resizing and the entry-flow language switch. The first new Back-label assertion expected a different Spanish word; it was corrected to the existing catalog's “Atrás”, and all nine passed in the focused rerun. No translation was changed to satisfy the test.
- 77 relevant Node checks pass across validation, catalog generation, course progression, resume storage, partner recovery/access and billing access. An initial catalog consistency failure exposed the generator's old `.at` expression; both generator and generated output are fixed.
- Production build and lint pass. Existing React-hook and bundle-size warnings remain. All 28 compiled JavaScript chunks were scanned: no `Object.hasOwn()` or `.at(-1)` calls remain. This narrow scan is not a universal compatibility audit.
- Production-compiled AppShell, Settings, LessonPath, lesson/feedback/completion, login and personal-plan components were exercised in a local fixture. Before imports, the fixture removes both newer collection APIs; it also omits selected newer CSS rules and declarations. Its DOM confirms both APIs are undefined. It uses synthetic accounts, progress and local callbacks; login deliberately returns a local error and sends no credentials.
- Visually reviewed 375×667 phone, 667×375 landscape and 834×1210 tablet. Measured navigation bounds end at the viewport edge, with no document horizontal overflow in the recorded cases. Maximum app text keeps Settings values, reading and completion content scrollable. The partner table fixture uses the real stylesheet with synthetic markup. Modern-browser comparison and synthetic system-title scaling were also checked; the latter retained the expected 105.84px test heading without applying the container cap.

This feature-removal review runs in the current browser. It does **not** reproduce Safari 15's engine, native text rendering, touch keyboard or operating system. Only iOS 27 simulator runtimes are installed. Actual older Safari/iOS devices, physical VoiceOver/audio, production services/purchases, independent Spanish review and TestFlight upgrade acceptance remain open. The separate Swift application code was not changed or rebuilt in this increment.

Original screenshots and SHA-256 hashes are under `docs/design/evidence/older-browser/`. Full local captures, fixture sources/builds and logs are in the parent workspace's `research/native-redesign-2026-10-06/older-browser/` and ignored `.superpowers/older-*` files. No merge, deployment, publisher message or App Store submission occurred.
