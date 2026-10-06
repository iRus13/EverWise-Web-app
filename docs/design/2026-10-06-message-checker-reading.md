# Message Checker reading — October 6, 2026

Message Checker now uses the same calm reading hierarchy as the native app. The editor has a clear, bordered input; the result leads with the assessment and practical next steps. This is intended for adults 60–80 who need legible explanations and an obvious next action.

## Visible changes

- Replaced the all-caps slogan and oversized heading with a small screen label and a 24-point base heading. Body text remains 17 points; privacy, status and safety guidance increases from 13 to 15 points before user scaling.
- Removed the outer form card and inset verdict card. A 720-pixel maximum reading container, regular spacing and fewer separators keep the result readable on tablets without stretching across the screen.
- Urgent advice appears first when present, followed by numbered next steps, then warning signs. The verdict explicitly says that the AI assessment is not a guarantee. Lower-risk and uncertain wording remains cautious.
- Added an optional “Message you checked” disclosure with selectable, unmodified text. Text is never rendered as HTML or turned into links.
- Standardized the feature name on Home and in accessible navigation. Spanish navigation uses “Revisor.”
- Read-aloud text follows the visible order and translates authored headings, disclaimer and safety guidance when the app language changes. Provider prose remains verbatim. The audio icon keeps its width when its label wraps.

The existing cloud submission/audio services, cancellation, draft preservation, focus restoration and routing are retained. A result's original private message is not included in the read-aloud request.

## Evidence

- Final component suite: **2,375 tests across 37 files passed**. Lint and production build passed. Existing bundle warnings remain; no performance benchmark is inferred from a successful build.
- All **four responsive-navigation Node checks passed**. The earlier full non-browser Node suite was not rerun for this increment.
- The actual production component and AppShell were reviewed in a local harness at 375×667 and 834×1112, in English and Spanish, including maximum app text size. Form, result, original disclosure, editing, pending cancellation and unavailable-service recovery were exercised. Narrow enlarged Spanish content remained within the 375-pixel viewport.
- Curated screenshots and SHA-256 hashes are in `docs/design/evidence/message-checker-reading/`. Before captures use the parent source; after captures use this increment. Before isolated-component captures do not include app navigation; the final after captures do. Synthetic messages and service responses are used throughout.
- Full browser captures, test logs and the local comparison gallery live in the parent workspace at `research/native-redesign-2026-10-06/checker-reading/`.

This follows Apple's guidance on [legibility and direct controls](https://developer.apple.com/design/tips/) and [layout that remains usable with larger text](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria). These are design references, not an Apple certification.

Production service behavior, real provider output language, cloud audio playback, VoiceOver, older devices and physical usability sessions remain release checks. No merge, deployment or App Store submission occurred.
