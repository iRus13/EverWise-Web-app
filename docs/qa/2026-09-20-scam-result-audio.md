# Spoken scam-checker guidance

The result screen displayed an optional urgent “Act now” instruction and a
reminder to verify contact details independently, but omitted both from
“Read this result aloud”. A learner relying on narration therefore received
less guidance than a learner reading the result.

Narration now includes the urgent instruction before warning signs and next
steps, and concludes with the same verification reminder displayed on screen.
The reminder uses a shared string so the two forms stay consistent. Results
without an urgent instruction omit that section cleanly.

## Verification

Two integration tests failed against the previous implementation because the
spoken guidance omitted the displayed reminder. The captured old narration
also lacked the urgent instruction. After the repair, all 14 scam-checker and
ReadAloud tests passed, including malformed results, request timeout, stop,
changed content and playback fallback.

The new tests render the real ScamChecker and ReadAloud components, request
narration, force a synthetic audio-provider failure, and inspect the device
speech utterance. They verify that the provider request and device fallback
receive identical text, including summary, optional urgent action, warning
signs, next steps and the displayed verification reminder. No message or audio
request reaches a live provider. These tests prove narration content and
fallback wiring, not audible playback quality on a physical device.

Lint, patch checks, production build, Capacitor synchronization and simulator
build/install passed. Evidence: `/tmp/everwise-scam-audio-before.log`,
`/tmp/everwise-scam-audio-after.log` and
`/tmp/everwise-scam-audio-build.log`. Final branch CI results belong in PR #3.

## Exact publication manifest

- `src/screens/ScamChecker.jsx`
- `tests/scam-checker-audio.test.jsx`
- `docs/qa/2026-09-20-scam-result-audio.md`

The preexisting local `package.json` approval map is excluded. No service
configuration, live provider, account or payment state is changed.
