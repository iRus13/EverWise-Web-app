# Communication in Spanish — October 6, 2026

Spanish learners previously entered English lessons after Safe Internet Habits. All seven Communication lessons and their final challenge now have Spanish reading, choices, explanations, flashcards, completion copy and contextual fill-in answers. This covers Safe Texting, Video Calls, Email Basics, Blocking Numbers, Reporting Spam, Sharing Photos and Sharing Location.

The language notice and path now identify Communication as translated, while still disclosing English content in later stages. The writing uses short, familiar Spanish for adults 60–80. Product names and example addresses remain literal. Canonical course IDs, answer values, choice order, lesson order and scoring are unchanged. The dictionary remains deferred with the activity players.

## Content corrections

The same reviewed English corrections are included in the native app:

- Green iPhone bubbles can use RCS as well as SMS/MMS; color is not a trust check. [Apple messaging reference](https://support.apple.com/en-in/104972).
- Camera and microphone effects are conditional on the other control's state.
- Blocking on iPhone can still allow voicemail without a notification. Known people may also be blocked if they harass or threaten the learner. [Apple blocking reference](https://support.apple.com/en-sg/111104).
- Reporting a message is separate from blocking in iPhone Messages; the lesson describes report-data sharing and tells learners to read the app's notice. The former contradictory count-the-warning-signs rule is replaced with a clear verification step. [Apple reporting reference](https://support.apple.com/en-am/guide/iphone/iph3f94d910d/ios).
- A one-time location is a fixed snapshot; live sharing updates until its time limit ends or it is stopped. The learner is told to use the stop-sharing control. [Apple location reference](https://support.apple.com/en-us/105104).

## Validation and visual review

- All 869 normalized web Communication display keys have Spanish coverage. Contextual word-bank keys keep sentence grammar without changing stored answers.
- Final localization suite: **124 passed**, including all seven opening/completion pairs, all eight fill-in blocks, distinct choices, translation-boundary notices and exam handoff.
- Broader component run: **2,343 passed, one failed** because the new completion test expected the abbreviated exam label instead of the existing descriptive label. Corrected only that expectation and reran all 124 localization checks successfully. No application assertion was removed. Other component tests were not repeated afterward.
- Lint and production build passed. The Node suite was not rerun for this content increment.
- Actual production components reviewed in a local browser harness: reading/Continue and three sequential text-message fill-in answers at 375×667 (including text scale 2); corrected location reading at 834×1112; all five challenge activities through the translated completion screen. The small-phone view had document width 375 with all answer buttons inside the viewport.
- The local harness is excluded from Git and the production build. It does not exercise production authentication, network services, purchases or saved-account synchronization.

The bilingual review CSV is at `docs/localization/spanish-communication-review.csv`; it records the 897 native display keys and their locations, including the native story/question presentation keys. Native and normalized web content have different representations. Screenshots are under `docs/design/evidence/spanish-communication/`.

Later lessons/challenges and independent Spanish review remain open. This is development source, not a deployed release or confirmation of App Store readiness.
