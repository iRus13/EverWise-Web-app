# EverWise web app migration to everwise.tips

Target: the existing learner web app on ChatGPT Sites, separate from the marketing Site.

## Verified on 2026-09-06

- Isolated copy of recovered app-web source prepared; original source preserved.
- Frontend production build passes.
- All 436 unit tests pass, including new D1 persistence and request-adapter checks. All 264 baseline UI tests pass with NODE_OPTIONS=--no-experimental-webstorage on Node 26.
- Squarespace browser access works; everwise.tips is active with default parking DNS.
- Existing API at https://everwise.dexio-games.com/api/billing/plans returns HTTP 522.
- Saved DigitalOcean SSH connection times out.
- This checkout includes an environment template, not live service credentials.

## Required before production cutover

1. The user confirmed the old server is gone. Reconcile billing/partner records using surviving service accounts or backups. Do not paste secrets into chat or commit them.
2. Preserve Firebase identity and existing subscription/customer mappings, used-trial state, partner memberships, and webhook deduplication state.
3. Workers request adapter and D1 snapshot storage are implemented. Generated schema migrations must be applied by Sites. Local Workers health responds; external service functionality still needs live verification. Existing memberships are not reconstructed by an empty database.
4. Configure service secrets, the public app origin, Firebase authorized domains, and Stripe webhook/return URLs for the selected architecture.
5. Validate frontend, authenticated APIs, storage integrity, and service configuration before switching DNS.
6. Publish a separate web-app Site, obtain fresh apex and www verification records, and replace only Squarespace website defaults. Preserve Domain Connect and email security records.
7. Verify normal HTTPS, app loading, login, and backend routes at everwise.tips and www.everwise.tips.

## Hosting preparation

- Separate owner-private Site registered in `.openai/hosting.json`; no DNS changes or public cutover yet.
- Billing is deliberately disabled unless BILLING_RECOVERY_COMPLETE=true, even if Stripe keys are configured. Do not enable this until reconciliation is verified.
- Firebase authentication configuration is retained. Authorized domains, OpenAI, ElevenLabs and Stripe configuration remain to be verified/restored.
- D1 snapshots use optimistic revision checks to preserve existing cross-record business invariants; a 1.5 MB capacity guard fails closed. A later normalized schema may be required for larger deployments.
- Production readiness requires authenticated end-to-end checks, service configuration and data recovery; a successful build alone does not establish readiness.
