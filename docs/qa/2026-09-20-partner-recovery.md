# Partner report and invitation recovery

## Reproduced problems

A temporary report failure was shown as an invalid admin link with no recovery action. The App intentionally removes the token from the address bar on entry, so reloading that scrubbed page cannot recover the same admin session.

A failed invitation replacement removed every replacement action and said the link could not be replaced. A lost response can occur after the server changes the invitation, so that message overstated what the browser knew.

Two new UI regressions failed before repair (138 existing tests passed). With the repair, all 140 partner tests pass.

## Resulting behavior

- Temporary report errors offer an in-place retry using the existing in-memory admin token. Explicit INVALID_ADMIN responses remain generic and reveal no partner data or retry controls. Retrying a report does not rotate an invitation.
- Failed replacements state that the outcome could not be confirmed. Review replacement opens a fresh confirmation; neither opening nor cancelling it submits a request. A new replacement is sent only after the user explicitly confirms it.
- Error screens use a shorter heading and flow from the top when their content is taller than the viewport. At maximum text, the initial error layout cut off its logo by about 72px on a 320x568 phone and 33px in 667x375 landscape. Auto margins now center content only when it fits, preserving scroll access otherwise.

## Browser checks

The real App admin route is exercised with synthetic API responses. Eight recovery cases cover four viewport sizes and two text settings. Checks verify the scrubbed URL, correct token on every request, recovery after a 503 report error, truthful uncertain-write feedback, fresh confirmation, cancellation without an extra write, successful explicit retry, and visible top content. Controls must be reachable using actual wheel input before they are clicked. The existing 24 dashboard/privacy/layout cases remain in the same runner.

React StrictMode repeats initial read effects in development. The browser fixture keeps the synthetic outage active until the Retry action rather than consuming a single failed request and accidentally allowing the second mount to succeed.

All traffic stays on the local test origin; no live invitation is replaced. These checks do not prove hosted partner credentials or production-provider behavior.

## Validation

Final local Chromium and WebKit each passed the 24 existing dashboard cases and eight recovery journeys, with zero uncaught page errors. Before/after screenshots were reviewed. All 1,732 UI tests, lint, production build, Capacitor sync and iPhone 18 Pro simulator build/install/launch passed. Native launch does not prove device interaction. New-head CI results will be recorded in the PR after their logs are verified. Earlier CI 35501349974 validates the preceding assessment head, not this change.

## Exact publication manifest

1. `src/screens/PartnerDashboard.jsx`
2. `src/index.css`
3. `tests/partner-client.test.jsx`
4. `scripts/qa-partner-dashboard.mjs`
5. `docs/qa/2026-09-20-partner-recovery.md`

The preexisting package.json script-approval map and sources/ are excluded. No deployment, merge, live invitation rotation, production account or provider change is included.
