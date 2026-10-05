# Connected course path for adults 60–80

EverWise's primary learners are adults aged 60–80. The Course screen now presents a connected path with completed, current and locked stops. Full lesson titles and written status labels remain readable, the entire lesson label opens the activity, and the existing Current step shortcut finds the recommended activity. Completed connections are solid; upcoming connections are dashed. Search continues to present concise results rather than forcing a path into filtered topics.

The overview uses a quieter heading and fewer repeated instructions, so the first lesson is visible on a 375 × 667 viewport. Circles are 76 CSS pixels. At reading levels 7–10 or expanded system text, the route straightens and labels use the available width. The line sits behind opaque text surfaces. A legacy small-screen panel background was removed from the path after actual screenshot review. Keyboard focus and reduced-motion behavior are retained.

Curriculum content, saved progress, resume, quick checks and access rules are unchanged. The web course still unlocks sequentially. Native iOS currently permits exploration inside an unlocked phase; that preexisting difference is recorded instead of being silently changed in a design update.

Apple's [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) and [layout](https://developer.apple.com/design/human-interface-guidelines/layout) guidance informed readable states and reflow. [Duolingo's guided path](https://blog.duolingo.com/new-duolingo-home-screen-design/) is a visual/navigation reference, not a claim of validated learning outcomes for EverWise.

Validation: 45 existing course-path interface tests pass, including lesson/challenge/exam routing, resume, quick checks and locked access. Production web build and focused lint pass. Browser screenshots were inspected at 375 × 667, 320 × 568 with reading size 10, and 1024 × 768. The checked 320 and 1024 layouts have no horizontally overflowing path buttons/titles; the checked 320 layout has no enabled path controls below 44 × 44 pixels. Search opened, returned five password-related results and closed back to the path. These browser fixtures use production screen components and synthetic progress, not a live account or payment provider.

The first test attempt under heavy simultaneous simulator load timed out in four tests; the subsequent single-worker run passed all 45 without modifying timeouts. Existing production chunk-size/dynamic-import warnings remain. This pass does not establish performance on older physical devices or full app/VoiceOver acceptance.

Screenshots and local gallery: `research/native-redesign-2026-10-05/accessible-learning-path/` in the parent EverWise workspace. No App Store release or web deployment is included.
