# Earned honors in the badge gallery

## Observed behavior

At 390×844, a synthetic learner with Welcome Aboard, Communication Champion and Communication Master saw “2 of 114 earned.” The Master honor appeared after all 17 phase groups: its section heading started 15,287px below the viewport top. The counter describes the fixed course catalog, which does not include that additional honor.

Additional exam honors now appear before the phase catalog; the same heading starts at 197px in the verified phone layout. The visible counter and progress-bar name explicitly say course badges. A saved profile containing only an additional honor no longer receives the first-badge empty message. Badge storage and catalog membership are unchanged.

## Validation

WebKit and Chromium each passed 24 gallery combinations: empty, mixed earned, and honors-only profiles; 320×568, 667×375, 768×1024 and 1440×900; normal and largest app text sizes. Checks cover course counts, the empty message, honor ordering/presence, readable badge names, horizontal overflow and usable content height. Uncaught browser errors fail; external requests are blocked. The new checks run in the existing WebKit/Firefox CI entrypoint.

The 390px before/after screenshots were reviewed. Lint, production build, Capacitor asset synchronization and iPhone 18 Pro simulator build/install/launch passed (PID5359). Physical-device or VoiceOver usability is not claimed. New-head CI results belong in the PR after final logs are read.

## Exact publication manifest

1. src/screens/Badges.jsx
2. tests/fixtures/app-layout.jsx
3. scripts/qa-badges.mjs
4. scripts/qa-webkit.mjs
5. docs/qa/2026-09-20-badge-gallery.md

Preexisting package.json script approvals and sources/ are excluded. No merge, deployment or live account/payment action is included.
