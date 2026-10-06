# Lesson geometry checks and entrance animations

The expanded lesson run at `25b5f0e09b67cab95361004c35f526af6b9a92e5`
failed its lesson jobs in Chromium, WebKit and Firefox. The failures measured
the top edge of confidence/final-boss controls between roughly 1 and 3 pixels
above the viewport while their entrance transform was still changing.

The reachability helper waited two frames for React scroll effects, scrolled
the target to an edge, then measured one frame later. That was insufficient
for the 500 ms entrance animation. A real-browser regression reproduced the
same false failure on a scrollable animated control: its top moved to
`-3.331787109375` between scroll and measurement.

## Change

Wait for finite document animations before scrolling and measuring, using the
same approach as the existing learning-layout audit. Infinite decorative
animations continue running. Keep the one-pixel geometry tolerance, both-edge
checks and the rule that hidden/clip ancestors cannot be scrolled by the test.
No application code or curriculum changes are included.

The new browser regression requires the moving control to become reachable
and receive one click. It also checks that top, bottom and horizontal clipping
still fail before clicking. Each browser's shard 0 runs this regression before
the quiz recovery and complete lesson journeys.

## Validation

- Before the helper change, the moving-control regression failed in Chromium.
- After the change, all four reachability cases passed in local Chromium and
  WebKit, including rejection of the three truly clipped controls.
- Lint passed. Chromium and WebKit each passed 10 complete targeted lesson
  journeys at 320px/largest text and 1440px/normal text: 72 authored blocks and
  20 confidence-practice questions per engine. These cover all five lesson IDs
  implicated in the Chromium/WebKit failures. Each engine also passed four
  quiz recovery paths covering Back, changed answers, Skip and reload.
  Both runners exited 0, with external requests blocked and no page errors.
- The failed remote run is evidence of the old measurement problem, not a
  successful full-curriculum check. New-head CI must pass separately.

## Exact publication manifest

1. `scripts/qa-assessments.mjs`
2. `scripts/qa-reachability.mjs`
3. `scripts/qa-lessons.mjs`
4. `docs/qa/2026-09-20-animation-geometry.md`

The preexisting local `package.json` script-approval edit and read-only
`sources/` are excluded. No merge, deployment, account or payment action is
part of this change.
