# Learning controls and large-text layout

## Reproduced problems

The actual LessonPlayer was rendered with authored content from every currently used activity type. At text size 10, the navigation CSS placed the Skip/Exit wrapper in a 44px grid column. At 320x568, Skip began at x=-42.25 and Exit grew to 222px high. Fixing the wrapper exposed a second problem: fixed navigation/footer left only 52px for ordinary lessons at 667x375, and 41px for a long-title multiselect at 320x568.

The password builder had a separate failure at normal and large text: its horizontal scroller was a shrinking flex child. One measured case left only 9px of visible height for 71.5px choice buttons. Its choices also required horizontal scrolling on narrow phones.

## Changes

- Give Skip/Exit their own full-width row at large text settings.
- On phones up to 700px tall at text sizes 6–10, let the entire lesson scroll so navigation and the footer cannot squeeze out the activity. Taller phones retain the content pane; tablet/desktop retain their existing flowing layout.
- Follow the actual scroll owner when feedback appears or the next question starts. Document scrolling uses document.scrollingElement rather than body; the browser checks require the action and next heading to be visibly in the viewport. This also fixes those transitions in the existing desktop layout.
- Let password-builder columns stack as space narrows, prevent the choices from shrinking, and bring revealed feedback into view.
- Include the real Exit action in the general lesson layout fixture.

## Browser coverage

The new fixture uses the real AppShell and LessonPlayer, with isolated navigation callbacks and actual authored blocks. It selects one block per used type by serialized content size; that is a deterministic stress sample, not proof of the worst possible visible state.

The matrix checks 13 activity types at 320x568, 667x375, 768x1024, 1440x500 and 1440x900, at text sizes 2 and 10. It measures 190 states: initial layouts, flashcard backs, confidence practice, builder/multiselect/true-false feedback, and the next true-false question. It verifies Exit for every type/size, correct automatic feedback/next-question scrolling, and reachable controls through user-scrollable ancestors. Hidden clipping ancestors are never programmatically scrolled to manufacture reachability.

The shared runner executes these checks in WebKit and Linux Firefox CI. A local Chromium run checks the same matrix. All external requests are blocked. This is sampled layout/interaction coverage, not an end-to-end playthrough of all 1,309 activities, live progress persistence, audio quality, physical-device touch/VoiceOver or standalone challenge/exam acceptance.

## Validation

Local lint, all 1,730 UI tests, production build, Capacitor sync and iPhone 18 Pro simulator build/install/launch passed. The final Chromium and WebKit runs each passed all 190 states, including viewport-visible feedback and next-question assertions, with no uncaught browser errors. The integrated WebKit runner also passed its 184 general layouts, 24 dashboard cases and both public keyboard/navigation journeys. Desktop and large-text phone screenshots were reviewed. New-head CI results will be recorded in the PR after their logs are verified. Existing CI 35499501475 passed all three jobs at the preceding head 9340c3f; it does not validate this follow-up.

## Exact publication manifest

1. `src/index.css`
2. `src/components/blocks/BlockShell.jsx`
3. `src/components/blocks/BuilderBlock.jsx`
4. `tests/fixtures/app-layout.jsx`
5. `tests/fixtures/learning-layout.html`
6. `tests/fixtures/learning-layout.jsx`
7. `scripts/qa-learning-layout.mjs`
8. `scripts/qa-webkit.mjs`
9. `docs/qa/2026-09-20-learning-layout.md`

The preexisting package.json dependency-script approvals, sources/, credentials, production service configuration and deployment workflows are not changed by this publication. No deployment, merge, purchase or production account mutation is included.
