# Subscription recovery layout repair

At 320 × 568 with the largest text setting, the subscription error and confirmation screens centered content taller than their fixed-height container. The application content frame clips overflow, and these screens had no scrollable container. Retry, Manage billing, and Back to free lessons could be unreachable.

Before the fix, a WebKit probe measured Retry at y=686.75–791.28 on the temporary-error screen and Back to free lessons at y=804.78–1032.38, below the 568px viewport. The timeout screen placed its heading above the viewport and all three actions below it. Both inactive and checking states were affected too.

The screens now own vertical scrolling, allow flex shrinking at the viewport boundary, and center the card with automatic margins only when it fits. The card itself retains its full content height.

## Coverage

The synthetic browser fixture now includes the actual App screen-content frame and seven additional states: temporary subscription error, inactive subscription, checking, timeout, sponsored access failure, incomplete sponsored cleanup, and personal plan. The plan waits for its real preparation delay.

The checks move only user-scrollable containers, then compare headings and actions against the viewport and every clipping ancestor. They deliberately avoid scrollIntoView because it can programmatically move overflow-hidden containers that users cannot scroll. Desktop checks also exercise document scrolling.

Each new state runs at 320 × 568, 667 × 375, 768 × 1024, and 1440 × 900, at standard and largest text sizes, in Chromium and WebKit.

## Local verification

- WebKit: 184 responsive combinations passed, plus public onboarding/login recovery and keyboard navigation at 390px and 1440px; external requests blocked.
- UI tests: 1,716 passed, zero failures.
- Lint and production build passed. Existing large-chunk and ineffective-dynamic-import warnings remain.
- Chromium: the 56-case subscription/sponsored/plan matrix passed on the targeted rerun. The other 11 browser tests passed in the preceding run. The initial new-test failure was a moving personal-plan heading; the fixture now waits for its finite entrance animation before measuring, preserving the actual animation and preparation delay.

This verifies local browser layout and simulated screen data. Physical-device accessibility, live subscription verification, and real purchase/restore flows remain separate acceptance checks. These results were recorded before publication; no deployment was performed.

## Change manifest

- src/screens/BillingAccessError.jsx
- src/screens/BillingConfirmation.jsx
- tests/fixtures/app-layout.jsx
- tests/paywall-layout-browser.test.js
- scripts/qa-webkit.mjs
- docs/qa/2026-09-20-subscription-recovery-layout.md

The preexisting package.json script-approval change is excluded.
