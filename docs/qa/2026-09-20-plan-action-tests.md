# Account tests select the plan action

CI at `d9e817dd4aca1d71349933c826dc58fc13070ad6` passed all 465
unit/backend/browser tests, but 16 UI cases still expected the removed
Settings hint “Start free trial”. These account-switch, sponsored-access
and deletion-recovery tests intend to verify the presence or absence of
the public plan action, not eligibility for an introductory offer.

The existing positive and negative assertions now locate the button with
the exact accessible name “View plans”. All account identity, receipt,
storage, compensation and stale-response assertions are retained. Checking
the actual action also keeps the sponsored-account negative assertions
meaningful after the hint wording change.

The complete local UI suite passes: **22 files, 1,749 tests**, zero failures.
No application source changed in this follow-up. The current application's
39 focused component tests, 24 browser layout cases and iPhone simulator
build/launch evidence remain applicable. New-publication CI is recorded
separately after its final logs are inspected.

## Exact publication manifest

1. `tests/partner-client.test.jsx`
2. `docs/qa/2026-09-20-plan-action-tests.md`

The preexisting dependency-script approval edit and read-only `sources/`
are excluded. No merge, deployment or live account/payment action is included.
