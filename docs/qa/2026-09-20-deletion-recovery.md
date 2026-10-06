# Account deletion recovery

Deleting an account first removes its profile, then its Firebase Auth login.
If deleting the login fails, the app restores the cached profile. A profile
containing an active/trial subscription mirror could not be recreated because
the database's creation rule requires `subscriptionStatus: "expired"`,
`trialStartedAt: null`, and `plan: null`. The account could therefore remain
usable while its saved progress was lost.

## Reproduction and repair

The actual App running against local Auth/Firestore emulators reproduced this
at 390px. After a completed lesson and reload, the test updated the profile's
subscription mirror, then intercepted only the Auth deletion request with a
synthetic failure. Auth lookup still succeeded. Firestore rejected the original
restoration and the app showed “your saved profile could not be restored”.
Evidence: `/tmp/everwise-delete-repro.log`.

Both public and sponsored deletion recovery now recreate the learner's profile
with all its learning and personal data, resetting only the three subscription
mirror fields required by the creation rule. These mirrors do not authorize
access: billing, StoreKit and partner services remain authoritative. Web billing
may already have been cancelled, so recovery must not imply it reactivated a
subscription. No database rule was weakened or deployed.

## Verification scope

- The 138-test account/partner UI suite passed, including active and trial
  restoration, preservation of progress, and the existing sponsored recovery
  and account-switch guards.
- Browser journeys use real local Auth/Firestore and the application's Settings
  deletion flow. An incorrect password cannot reach billing cancellation; the
  injected Auth failure must restore progress and badges on the server; reload
  must retain them; a successful retry must remove both the profile and login.
  These journeys passed at 390px and 1440px, together with all 15 service
  scenarios and the parent's completion-proof check. Evidence:
  `/tmp/everwise-delete-recovery.log`.
- Billing cancellation is an explicit synthetic API response. No real
  subscription, customer, purchase or production account is changed.
- Lint, patch checks, the production build, Capacitor synchronization and native
  build/install passed. Final CI results are recorded in PR #3. Native build
  success does not close the rendering issue described below.

The native rendering investigation remains open. WebKit's own page snapshot
contained the full welcome screen while ordinary simulator capture had been
blank. Opacity, safe-area overlay and compositing trials failed repeated cold
launches and were reverted. A Device Hub UI-query timeout was also observed,
but a process sample showed an idle main run loop; that does not prove the
preview app caused the rendering issue. No native workaround is included here.

## Exact publication manifest

- `src/App.jsx`
- `src/utils/profileRecovery.js`
- `scripts/qa-firebase-browser.mjs`
- `tests/partner-client.test.jsx`
- `docs/qa/2026-09-20-deletion-recovery.md`

The preexisting local `package.json` script-approval map is excluded. `sources/`
is untouched. This is a draft-branch update, with no merge or deployment.
