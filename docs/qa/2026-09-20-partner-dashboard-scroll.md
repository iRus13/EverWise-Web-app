# Partner dashboard phone scrolling

The real App admin route displayed a dashboard taller than its phone viewport inside the global overflow-hidden root. Its main element grew to the full report height instead of becoming scrollable. At 390 × 844, the synthetic report placed Replace learner link at y=3321–3381. Actual WebKit wheel input left the button at the same off-screen position. Download aggregate CSV and later report content were inaccessible too.

The dashboard now owns a viewport-height vertical scroll area. This applies to the standalone dashboard route, which does not use the learner AppShell.

## Verification

The new real-App browser check uses only synthetic admin tokens and report responses, with external requests blocked. It covers full reports, privacy-suppressed reports and rejected admin links at 320 × 568, 667 × 375, 768 × 1024 and 1440 × 900, using standard and largest text sizes: 24 combinations per browser. WebKit and Chromium passed all combinations locally. The check uses actual wheel input before clicking controls; automatic locator scrolling cannot conceal the original overflow-hidden bug. It also checks horizontal layout, token removal from the address bar, suppression of tables and invitation-change cancellation.

The suite is integrated into the WebKit CI runner. Local lint and production build passed. The integrated WebKit runner passed its 184 existing layouts, all public/keyboard journeys, and these 24 dashboard cases without uncaught browser errors. CI verification of this dashboard change remains pending at report creation. No live report, invite rotation, account change, deployment or merge was performed.

## Exact manifest

- src/index.css
- scripts/qa-partner-dashboard.mjs
- scripts/qa-webkit.mjs
- docs/qa/2026-09-20-partner-dashboard-scroll.md

The preexisting package.json script-approval change remains excluded.
