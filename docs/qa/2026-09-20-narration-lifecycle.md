# Narration ownership across Stop and navigation

Two stale-callback failures were reproduced in ReadAloud:

- After stopping device speech and starting new narration, the canceled
  utterance's delayed end/error callback changed the button back to “Read
  aloud” even while the newer device voice or recording was playing. The
  learner lost the Stop control for current playback.
- After a recorded lesson screen unmounted, its delayed ended callback could
  still call the old cleanup function and cancel device speech on the newly
  opened screen.

Device utterances now have explicit ownership, matching the existing recorded
audio guard. End/error callbacks update the controls only for the current
utterance. A shared cleanup invalidates request, recording and speech ownership
before aborting, pausing or canceling. Stop, changed lesson text and unmount all
use that cleanup. A canceled callback cannot take ownership back.

## Verification

Six new tests failed against the previous implementation: delayed end/error
after restart into device or recorded playback; changed lesson text; and an
unmounted recording attempting to cancel the new screen's device speech.
The first five lost the Stop control; the sixth made an extra global speech
cancellation. All pass after the repair, including checks that current playback
can still stop and the current utterance can finish normally.

- All 20 focused ReadAloud/scam-checker tests passed, retaining timeout,
  malformed-result, duplicate-fallback and complete spoken-guidance coverage.
- All 1,716 UI tests in 21 files passed locally.
- Lint, patch checks, production web build, Capacitor synchronization and
  iPhone 18 Pro simulator build/install/launch passed.

Tests control provider promises, audio and speech events. They prove the state
and resource-ownership behavior; they do not establish audible playback quality,
native interruption handling or physical-device acceptance. No live narration
provider was called. Current full CI results are recorded in draft PR #3.

Local logs: `/tmp/everwise-speech-lifecycle-before.log`,
`/tmp/everwise-speech-lifecycle-after.log`,
`/tmp/everwise-speech-lifecycle-ui.log` and
`/tmp/everwise-speech-lifecycle-build.log`.

## Exact publication manifest

- `src/components/ReadAloud.jsx`
- `tests/read-aloud.test.jsx`
- `docs/qa/2026-09-20-narration-lifecycle.md`

The preexisting local `package.json` approval map is excluded. No service,
credential, account, payment or deployment state is changed.
