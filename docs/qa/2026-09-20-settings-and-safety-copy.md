# Settings offer wording and scam-checker list layout

A visual review of the web/native paywalls, Home, course path, badges,
Settings and scam checker at 390px and 1440px found two remaining details:

- Settings displayed “Start free trial” for accounts without a subscription
  and accounts whose subscription could not be managed. Settings does not
  know the selected product's trial eligibility. Both links now say “Compare
  plans and pricing”; the paywall still presents the verified offer.
- The narrow desktop scam-checker sidebar allowed the numbers in its safety
  list to shrink, wrapping the period below the digit. The number spans now
  retain their width and stay on one line while the guidance wraps normally.

## Validation

- Existing Settings billing tests: 29 passed.
- Existing scam-checker and narration tests: 10 passed.
- Chromium and WebKit: 12 layout cases each, covering both screens at
  320x568, 390x844 and 1440x900, at normal and largest app text sizes.
  Checks verify no horizontal overflow, controls within bounds, neutral offer
  wording and one-line safety numbers. No page errors; external requests
  blocked. Before/after screenshots were inspected.
- Lint, production build and Capacitor synchronization passed.
- The updated iPhone 18 Pro simulator build installed and launched
  successfully, process 30180. This does not establish physical-device or
  VoiceOver acceptance.

These are local component/browser fixtures using synthetic account and
subscription data. The displayed Apple prices are fixture values, not a
claim about configured App Store products. Full CI for the new publication
is reported separately after final logs are inspected.

The preceding animation-fix revision completed all 111 lessons in Chromium
at each required viewport: 222 journeys, 2448 blocks, 748 quiz questions,
240 confidence-practice questions and four quiz-recovery paths. Unique IDs
were checked against the authored curriculum. WebKit and Firefox lesson
jobs for that revision were still running/queued when this report was made.

## Exact publication manifest

1. `src/screens/Settings.jsx`
2. `src/screens/ScamChecker.jsx`
3. `docs/qa/2026-09-20-settings-and-safety-copy.md`

The existing local dependency-script approval map and read-only `sources/`
are excluded. No merge, deployment, purchase, account or provider change is
included.
