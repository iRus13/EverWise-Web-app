# EverWise quality refinement — 23 September 2026

## Goal and evidence standard

Make the whole iOS and web app feel deliberately designed and reliable: clear hierarchy, readable typography, consistent controls, accessible layouts, and working end-to-end journeys. Passing geometry checks alone does not establish visual quality or completion. The overall goal remains active.

The previous goal turn opened and visibly verified the existing iPhone app. This turn changes product code and verifies the revised experience; it is a progress turn, not a status-only continuation.

## Apple guidance reviewed

- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout): order by importance, group related information, align content deliberately, respect safe areas, and adapt when text or window sizes change.
- [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons): distinguish the preferred action using visual emphasis, retain generous hit regions, and show a pressed state.
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography): use legible weights, a coherent type hierarchy, and accommodate enlarged text. The app's custom text-size control is not proof of support for the system Dynamic Type setting.

These principles inform the work. This is not a claim of Apple certification or complete HIG compliance.

## Implemented in this pass

- Welcome: quieter brand header, a two-tone headline, one grouped explanation of the learning process, aligned actions, and a two-column layout on larger windows.
- Home: one learning card combines context and the main action. Message checking is a secondary tool. Real lesson and badge counts have a separate section; no invented progress or success metrics.
- Home: a single primary heading replaces separate mobile and desktop headings. Completed learners retain their review route. Partner attribution and all existing destinations are preserved.
- Shared buttons: flat surfaces replace raised shadows, primary and secondary labels share a type size, and a 56px minimum height retains generous tap targets. Both styles have pressed feedback.
- Text controls: keep practical targets instead of enlarging their symbols and buttons excessively on desktop.
- Welcome/Home: scalable text, stacking layouts, scrollable content, and safe-area matching. iPad compatibility-window top clearance is retained.
- Keyboard: scroll the actual form pane when the native keyboard changes its available height. Native before/after and typing captures verify the profile-field fix; Chrome/WebKit also cover login fields.
- Settings (24 September): grouped rows, semantic section headings, consistent typography and desktop alignment. The text-size control wraps without cramping its explanation. Destructive actions have distinct styling.
- Settings accessibility: deletion confirmation receives focus and reveals its warning, Cancel restores focus and clears the password, and row hints are accessible descriptions. Errors are beside their account or billing controls.
- Account entry (24 September): shared branded layout for login and password recovery, evenly spaced labeled fields, and actions next to the form instead of across a large empty gap. Recovery keeps Back visible while its heading receives focus.
- Onboarding: consistent field, choice, message, reading-control, and progress styles. Shorter headings avoid repeating the example message and breaking long words at the largest app text size. Skip now has space for its full label. The inner pane no longer creates a second main landmark.
- Login: empty-field validation identifies and focuses the missing field; repeated pending submissions are ignored. Passwords are passed unchanged, including spaces, consistently with account creation. Identifier capitalization/spelling behavior and the age numeric keyboard are explicitly configured.

## Verification

Results and captures are recorded in `../../../qa-design-refinement` (the sibling QA evidence directory), with the final local verification summary in `verification.md` there. The current pass is not published or deployed.

The Settings continuation is recorded in `../../../qa-settings-refinement/verification.md`: 466 Node/backend/browser tests, 1,759 UI tests, 112 Chrome and 56 WebKit Settings layout combinations, followed by focused checks for the final confirmation-scroll adjustment. The iOS simulator build was installed and launched; native Settings interaction acceptance remains incomplete. The prior turn opened and verified the simulator, providing current runtime evidence. This continuation is a progress turn with product changes and completed verification.

The account/onboarding continuation is recorded in `../../../qa-account-refinement/verification.md`. It retains the first screenshots that exposed broken heading/Skip words, then checks whole words as well as reachability in the final eight-step sweep. It adds regression coverage for duplicate submissions, field focus, and unchanged passwords. Apple’s [text-field guidance](https://developer.apple.com/design/human-interface-guidelines/text-fields) was read via its official documentation data: persistent labels, consistent field widths/spacing, logical focus order, secure passwords, and appropriate keyboards informed this pass. This is design guidance, not a claim of full HIG compliance.

The subscription continuation (24 September) is recorded in `../../../qa-paywall-refinement/verification.md`. It unifies the paywall design, keeps trusted price/trial terms prominent, adds native purchase/restore/retry feedback and request guards, and removes a duplicate main landmark. Screenshot inspection found an offscreen restore error at the largest text size; final browser checks now assert feedback visibility. Final evidence: 1,765 UI tests, 13 browser geometry tests, 248 static layouts and 336 final state captures, with scope/timing distinctions in the report. The unsigned iOS build launched successfully; App Store/native interaction acceptance remains open. Apple's official [purchase guidance](https://developer.apple.com/design/human-interface-guidelines/apple-in-app-purchase) informed the revision.

The course-path continuation (24 September) is recorded in `../../../qa-course-refinement/verification.md`: 17 browsable phases replace the oversized absolute-position trail, with all 133 full step titles, accurate counts, preserved unlock/replay/quick-check routes and accessible disclosure. Evidence includes 1,792 UI tests, 461 Node/backend/browser tests, 124 layout combinations, 144 progress states checking every step, two mobile hover regressions and a successful iOS build. Baguette direct gestures now work on the existing iPhone 18 Pro: Home/course/disclosure/open Welcome/Exit back to course were visually verified without completion. VoiceOver and full native acceptance remain open. The two removed files are the now-unused path pixel-metric utility and its five tests; behavioral and rendered-layout checks replace that evidence. See report timing distinctions for final CSS checks.

The lesson continuation (24 September) is recorded in `../../../qa-learning-refinement/verification.md`: shared navigation/typography/answers, explicit feedback, question/card focus and scroll recovery, complete scam-warning narration, flashcard accessible descriptions, and visible narration failure/retry feedback. Evidence includes 1,803 UI and 461 Node tests, 806 responsive cases, 250 activity states in each browser engine, 12 final narration recovery layouts, the broader WebKit app suite, and a successful final native build/install. Native Home/course/Welcome/Exit was directly verified at 0/133 completed steps. The report preserves the landscape error-visibility failure and distinguishes broad checks before the final error-scroll effect from targeted final verification. The overall product goal remains active.

The completion/badges/assessment continuation (24 September) is recorded in `../../../qa-achievements-refinement/verification.md`: shared summaries, changeable exam choices with exact submission scoring, focus recovery, readable/filterable badge rows and persistent Home navigation. Verified: 1,808 UI tests, 461 Node tests, every authored lesson completion (444 captures), 372 responsive cases, full challenge/exam/retake journeys in both engines, 96 final badge captures and 60 final exam-selection checks. Native badge filters, scrolling and return navigation were directly tested. The report retains the word-wrap, selection-marker and disappearing-navigation findings and distinguishes broad runs from final targeted CSS verification. The full product goal remains active.

The Scam Checker continuation (24 September) is recorded in `../../../qa-scam-checker-refinement/verification.md`: a quieter single-column form/result design, visible privacy guidance, cancel/edit/clear flows, focus recovery and timeout/request-ownership fixes. Final evidence: 1,813 UI tests, 200 interactive state captures and 124 responsive entry cases across Chrome/WebKit, successful iOS build/install, and direct native keyboard/typing/scroll-to-action/return navigation. No native or live-provider message was submitted. The report retains the clipped risk-label finding and its corrected final captures. Full app acceptance remains open.

The native iPad continuation (24 September) is recorded in `../../../qa-ipad-refinement/verification.md`: universal iPhone/iPad builds, four iPad orientations, full native window layouts, welcome centering and a UIKit-derived inset for system window controls. Real resizing preserved a displayed draft and restored the sidebar. Evidence: 1,818 UI tests, 188 native matrix captures and 912 browser cases, with intermediate/final timing distinctions in the report. Native inspection caught duplicated compact bottom padding and window-control overlap; both have final captures. The full product goal remains active.

The status/startup continuation (24 September) is recorded in `../../../qa-status-refinement/verification.md`: shared subscription/sponsored/deletion recovery, focus and busy-state behavior, immediate startup after auth readiness, and an immediate, simpler personal plan. Verified: 1,829 UI tests, 461 Node/backend/browser tests, 960 browser cases, 112 native cases and final native build. The report separates broad/final runs and retains the rejected Safari test-setup captures. Real iPhone Settings, plan-unavailable recovery, free-learning return and text-size adjustment/restoration were observed. The overall goal remains active.

The partner reporting continuation (24 September) is recorded in `../../../qa-partner-refinement/verification.md`: responsive summaries/tables, guarded and session-owned invitation replacement, stable report timestamps, valid public native URLs and report-pane focus/scroll recovery. Final evidence: 1,837 UI tests, 472 Node tests, 384 browser interaction captures, 24 targeted native captures and a successful build. Direct iPhone standard/largest-text jump → confirmation → Cancel was observed. The report retains fragmented-table and hidden-heading failures, separates broad/intermediate/final runs, and leaves live providers, native clipboard/export and broader app acceptance open.

The system text-size continuation (24 September) is recorded in `../../../qa-system-text/verification.md`: UIKit-derived body/title metrics, live native updates, preserved in-app preferences and accessibility-size reflow for lessons/onboarding/flashcards. Verified: 1,850 UI tests, 472 Node tests, 464 applicable browser layouts, 48 native largest-category layouts and all 12 system categories on both iPhone/iPad without page reload. Real signed-in Settings changes were observed and reversed; original system settings and progress were preserved. The report retains clipping and stale-category attempts, records final-check timing, and leaves older/physical devices, VoiceOver and full native acceptance open.

The native journey/validation continuation (24 September) is recorded in `../../../qa-native-journeys/verification.md`: actual emulator-backed iPhone signup → plan → free access → Welcome completion → restart → logout/login retained saved progress. Validation now focuses missing fields/choices and reveals them; large-text web forms no longer squeeze the question area. Evidence: 1,862 UI tests, 220 validation checks across 20 browser combinations, 36 shared keyboard checks, actual iPhone and iPad keyboard captures and a final installed simulator build. Initial responsive failures are retained. Full native lesson/assessment, accessibility, physical-device and billing acceptance remains open.

The native learning continuation (24 September) is recorded in `../../../qa-native-learning/verification.md`: the real iPhone app completed Internet's 14 teaching blocks, eight quiz questions and mistake review with emulator-backed progress; exit/restart resumed the correct teaching step. Fixed contradictory success praise on incorrect multi-select answers and clarified saved lessons with Resume instead of a misleading quick-check offer. Evidence: 1,869 UI tests, 500 activity states, 40 final course states, eight targeted native iPad layouts and a final installed iPhone build. Actual account/provider/payment acceptance and broader native assessment/accessibility review remain open.

## Remaining work toward the full goal

1. Complete a coherent end-to-end visual review. Partner reporting and shared learner recovery surfaces are now refined; broader native Settings, account/onboarding and authenticated lesson/assessment acceptance remain.
2. Verify keyboard appearance, focus progression, validation, error recovery, and loading feedback on native iOS as well as web. Use the now-verified Baguette gesture/screenshot workflow; preserve the signed-in simulator data.
3. Extend the now-verified native system text-size integration to older/physical devices and additional authored-content/keyboard states. Verify VoiceOver, Bold Text and Display Zoom separately; the app and system size preferences remain independent.
4. Measure native cold starts and investigate any remaining blank/slow launches. The artificial three-second launch/plan waits were removed and verified, but this is not a complete startup benchmark.
5. Extend the now-working universal iPad and resizable-window support to older iPadOS versions, physical devices and broader native interaction journeys. Current iPad Pro/iPad mini layout and resize evidence is in the iPad report; it is not full multi-app or hardware acceptance.
6. Complete physical-device, VoiceOver, live-provider, and sandbox payment acceptance when the necessary environments are available. No real purchase or production-account mutation is authorized by a screenshot review.
7. Review the finished experience across all screens and journeys before declaring the overall goal complete.


## September 24 — unfinished challenges and exams

Device-local assessment drafts now preserve reached challenge activity, submitted exam answers, editable current choice, and pending completion/results. The course path offers Resume for the current saved assessment. Authored content revisions invalidate stale drafts; retry, completion and identity cleanup clear them. Existing entitlement and guarded progress recording are unchanged.

Verified: 476 Node and 1,875 UI tests, 20 Chromium/WebKit responsive resume journeys, 8 native iPad path layouts, complete native iPhone challenge and exam fail/retry/perfect flows with emulator-authoritative outcomes. Updated regular iPhone app restored to original Rty account (0 lessons / 0 badges). Full evidence and limits: ../qa-native-assessments/verification.md. Current-block internal challenge answers remain activity-level rather than individually saved; cross-device drafts and physical-device/live payment acceptance remain outside this pass.


## September 24 — persistent course navigation

Confirmed in the full native app that automatic course resume hid Home at y=-517. Home now stays above the compact scroll pane; larger layouts retain a toolbar below measured primary navigation. Current step reopens the current phase and focuses/reveals its action without starting it. At extreme text sizes the toolbar uses 48-point icons with preserved accessible labels, and very tall rows reveal their beginning. Resize observer writes are deferred to avoid warnings.

Final verification: 1,877 UI tests; 72 navigation journeys; 144 course states, each checking 133 steps; 16 emulated system-text layouts; 12 native iPad layouts; real iPhone standard/maximum app text and maximum system+app text navigation. Both system text settings restored to large; regular Rty app restored with 0 lessons/0 badges. Evidence and limitations: ../qa-course-navigation/verification.md. Continue reviewing content hierarchy at combined extreme text sizes; metadata can still precede a title across multiple screens.


## September 24 — activity titles before status

Course activity titles now lead their rows, followed by secondary status. Extreme accessibility text stacks details and omits decorative icons; normal Safari text avoids automatic hyphenation. Existing access, navigation and resume behavior remain.

Verified: 1,878 UI tests, 96 final reading-layout cases, 144 complete course states checking all 133 rows, 12 final native iPad layouts, actual native iPhone lesson entrance/return and maximum system/app text navigation. Updated regular app installed; Rty remains at 0 lessons/0 badges. Evidence: ../qa-course-reading/verification.md. The full goal remains active.


## September 24 — native Settings controls

Actual iPhone interaction revealed that disabled account deletion looked enabled. Corrected the disabled surface and restricted destructive hover/pressed styling to enabled actions. Native text preference survives restart; typing enables confirmation, Cancel clears it, reopening disables it again, and Home works. No deletion submitted. Twelve Chromium/WebKit state/cancel cases passed, with final native build installed. Evidence: ../qa-native-settings/verification.md. Physical devices, software-keyboard coverage, providers and full accessibility acceptance remain.


## September 24 — keyboard test coordinate correction

Corrected the native QA driver to normalize input against the full simulator screen when the keyboard reduces the WebView viewport. A reduced-viewport probe covers both taps and swipes. All 36 browser keyboard-layout and cancellation checks pass. Actual iPhone software-keyboard acceptance remains inconclusive: one native capture has a black keyboard region; others do not show the software keyboard. No shipping app change in this pass. Evidence and environment restoration: ../qa-native-keyboard/verification.md. Continue broader independent native review while retaining this explicit gap.


## September 24 — a concrete next activity on Home

Home now names the next lesson/challenge/exam, shows its phase and offers direct Start/Resume with a separate View course route. Completed learners get Review course. Existing prerequisites, access checks and saved positions remain authoritative. Pending requests prevent duplicate taps, late responses cannot navigate after leaving, errors reveal themselves, and enlarged titles hyphenate correctly.

Evidence: 1,885 UI and 477 Node tests, 144 baseline browser states, 24 final pending/error/system-text states, 24 final large-title layouts, 12 baseline native iPad layouts, and native iPhone direct start/save/resume/restart plus final large-text error handling. Final build installed; report timing and limits: ../qa-home-next/verification.md. Next visual review should examine the web install prompt without treating the automation browser as actual Safari. Full app acceptance remains open.


## September 24 — optional web installation help

Moved installation guidance below Home activities and made it expandable. Corrected cancellation, duplicate-request and failed-prompt handling; numbered Safari instructions explain the toolbar/menu location of Share. Native/standalone suppression and explicit dismissal remain.

Verified 1,890 UI tests, 120 browser states, 24 final iOS wording/layout combinations, four natural error-reveal captures, and actual iPhone Safari swipe/expand/dismiss/reload behavior. Final native build installed and regular Rty app restored. Timing and coverage limits: ../qa-install-help/verification.md. Next review: retained hover styles on touch controls, full native iPad flows, remaining physical-device/accessibility/payment gaps. Overall goal remains active.


## September 24 — touch and pointer feedback

Restricted generated and custom hover styling to hover-capable devices. Touch controls retain pressed feedback; current navigation and selected onboarding choices keep their selection colors. Shared Back/narration/text controls now have separate pressed feedback, while disabled controls avoid interaction tints.

Verified: 1,890 UI tests; 64 final browser scenes inspecting 296 controls; 24 selection/disabled-control states; all 23 compiled hover rules guarded; actual iPhone Safari held/released visuals; full native Home-to-course-to-Home journey with saved resume intact. Final build installed and original Rty account restored. Evidence, timing and the explicit Chromium mixed-input automation limitation: ../qa-touch-feedback/verification.md. Prioritize full native iPad learning journeys next; the full quality goal remains active.


## September 24 — iPad lesson journey and readable paragraphs

Completed native iPad login/start/save/restart/resume, Online Banking teaching/quiz/correction and persisted completion. Authored reading now preserves paragraphs; visible feedback avoids unnecessary scrolling; larger Home layouts omit duplicate sponsor attribution. The landscape-left native driver was verified against trusted input.

Final evidence: 1,890 UI tests, 500 browser activity states, 24 paragraph layouts, four native portrait/landscape and standard/maximum-text reading transitions, and an installed regular iPhone build with matching packaged assets. Synthetic progress advanced exactly once and survived restart; original Rty remains at zero lessons/badges. Evidence timing, initial failures and remaining full-goal gaps: ../qa-ipad-journey/verification.md. Native cold-start measurement, full native keyboard/accessibility, physical devices and provider/payment acceptance remain open.


## September 24 — launch surface continuity and measured startup gap

Aligned the native launch storyboard, Capacitor/WebView background and pre-JavaScript web background with the current first-screen color. Removed the oversized launch-logo presentation. Verified three regular iPhone restarts before/after, an actual Home Screen icon launch, native Home/course/Home, iPad portrait/landscape startup, twelve browser boot/background cases and matching installed assets on both devices.

This is a visual continuity fix, not a speed fix: instrumented Home observations remained roughly 3–5 seconds and the recorded icon launch reached Home around six seconds. Profile/auth/access bootstrap timing and slow/offline recovery are next. Full evidence, capture overhead and failed harness attempts: ../qa-startup-continuity/verification.md. Rty remains at zero lessons/badges; full app acceptance remains open.


## September 24 — startup stages and stalled profile recovery

Added isolated QA startup timing and compared three Debug/Release native launches. Most local elapsed time precedes document startup; no meaningful speed improvement was proved. Fixed indefinite profile reads with a 15-second deadline into existing Retry/Log out recovery, retaining identity/access guards and ignoring late results.

Verified 1,892 UI tests, four full browser timeout/retry journeys, real iPhone/iPad timeout and native Retry, unchanged synthetic progress and an installed Release iPhone app with matching assets. Original Rty remains at zero lessons/badges. Evidence and current Release-build defaults: ../qa-startup-path/verification.md. Continue native initialization profiling and unresolved initial-auth/slow-network recovery; full app acceptance remains open.


## September 24 — initial-auth recovery and enlarged status text

Initial authentication now offers an explicit reload after 15 seconds without assuming signed-out state, forcing logout or automatically restarting. Normal late authentication still wins. Shorter action copy and wrapping fix keep the recovery control/status readable at extreme text settings. Native test taps now avoid system gesture edges.

Verified 1,895 UI tests, four full browser held-auth/reload journeys, real iPhone/iPad session recovery, 36 final responsive/text-scale layouts and two actual maximum-text native reloads. Final Release app installed on iPhone with 25 matching web assets and original Rty Home restored. Evidence timing, initial visual/test-tool failures and remaining gaps: ../qa-auth-startup/verification.md. Full app acceptance remains open; continue native startup profiling and remaining slow/offline bootstrap stages.


## September 24 — bounded account and billing token reads

Routine partner-access and web-billing token acquisition now expire after 15 seconds without sending a late abandoned request. Existing HTTP deadlines and identity/access rules are preserved. Billing timeouts are temporary unavailability rather than invalid-login claims. Settings uses neutral checking feedback during pending verification, then an error with Retry if needed.

Verified 1,899 UI tests plus 482 unit/service/browser-gate tests (2,381 total), eight partner-access browser recovery journeys, four native iPhone/iPad recovery journeys and four final web-billing Settings-to-plan journeys. Final regular Release iPhone app has 25 matching packaged assets and original Rty Home. No progress or production action changed. Scope, QA fault injection, timing and remaining issues: ../qa-access-startup/verification.md. Legacy subscription-normalization writes can still block startup; forced-refresh claim/deletion token paths, native cold-start latency and physical/provider acceptance remain open. Full goal stays active.


## September 24 — remove legacy startup writes

Startup subscription-mirror normalization is now local and synchronous. Old profile metadata can no longer trap startup behind a pending database write or later overwrite a newer verified Apple mirror. Authoritative access, purchase/restore and progress writes are unchanged.

Verified 1,904 UI tests, 12 access-policy tests, 12 browser legacy-profile/gating journeys and six real native iPhone/iPad tap journeys. Missing/expired/stale-active profile variants opened Home without a profile update, retained the paid gate and returned safely. Final regular Release app is installed with 25 matching assets and original Rty Home restored. Evidence: ../qa-legacy-startup/verification.md. Next review the paywall free-exit wording/destination: it currently returns Home even when Up next remains paid. Full app acceptance remains open.


## September 24 — paywall free introduction destination

The paywall free action now opens Welcome directly and clears the pending paid-content return intent. Closing returns Home; confirmation/error Home actions now use accurate labels. This removes the returning-learner loop from free exit to paid Up next.

Verified 1,910 UI plus 482 unit/service/browser-gate tests (2,392), 336 responsive paywall state captures, eight full browser journeys including blocked APIs/unavailable billing, and actual iPhone/iPad tap journeys. All preserve completed progress and make no extra access request on free entry. Updated Release app installed with 25 matching assets; original Rty Home restored. Evidence: ../qa-free-introduction/verification.md. Full app quality/device/provider acceptance remains open.


## September 24 — truthful deletion and billing guidance

Replaced the false universal subscription-cancellation promise in Settings with guidance matching native, public web and sponsored deletion paths. A separate billing panel links directly to Apple subscription management before password confirmation. Immediate deletion remains available; backend deletion semantics are unchanged.

Verified 1,916 interface tests, 96 responsive confirmation/management/cancel journeys, 36 focus/keyboard-sized viewport checks and four real iPhone/iPad standard/maximum-text cancellation journeys. Visual inspection found and corrected a broken button word at 320 points/max text; final label is Open Apple billing. Final Release iPhone build has 25 matching assets and original Rty Home restored. Evidence: ../qa-deletion-billing/verification.md. Token/reauthentication stalls, physical/provider acceptance and broader quality work remain open.


## September 24 — forced-token recovery and visible Settings errors

Bounded the three forced token reads used by sponsored signup/recovery/deletion. Initial token failure preserves the same-account recovery without submitting a claim; recovered claims recheck account ownership before sending, preventing a late claim after sign-out. Deletion preflight failure now explains that progress remains intact and restores controls. Settings reveals the error using its actual scroll owner and handles reflow.

Verified 1,920 interface tests, 482 unit/service/browser-gate tests on the token changes, 48 final recovery layouts, four full browser held-token journeys and two actual iPhone/iPad native recovery journeys. No deletion occurred; progress is unchanged. Updated Release iPhone app has 25 matching assets and original Rty Home restored. Evidence: ../qa-fresh-token/verification.md. Reauthentication and uncertain mutation waits, native performance and physical/provider acceptance remain open.

## September 24 — small iPad review and destination scroll isolation

Actual iPad mini landscape use revealed that the course's current-step scroll carried over to other destinations. At maximum text, Home opened 690 points down with its greeting and lesson content offscreen; WebKit reproduced 730 points. AppShell now clears the document/main-canvas scroll before destination effects while preserving sidebar position and same-screen reading position. The course still locates the current activity.

Verified 1,923 interface tests, 20 full-App Chromium/WebKit journeys across five viewports and two text sizes (120 destination observations), and four real iPad mini portrait/landscape standard/maximum-text journeys through Home, course, lesson entry/exit, Settings, Badges and Scam Checker. Completed progress remains 26 lessons/30 course items/two badges. Final Release iPhone build has 25 matching assets; original Rty Home restored. Evidence: ../qa-mini-journey/verification.md. Broader device/accessibility/provider/performance acceptance remains open.

## September 24 — readable, quieter tablet navigation

Reworked the wide sidebar's hierarchy: compact wordmark, full-width partner attribution, lighter active-row treatment, aligned targets and simple dividers in place of secondary boxes. Its width adapts to larger text without reducing navigation-label scaling. At maximum app text on the mini, all five destinations and the text controls now fit; previously Settings was below the viewport. Selected-label contrast is 5.14:1.

Verified 1,923 interface tests, 72 sidebar/name/viewport cases, 60 emulated large-system-text layouts, two real mini standard/maximum-app-text journeys, a real largest-system-text journey through all five destinations and six open/dismiss disclosure interactions. Corrected the QA helper's WebKit closed-details false positive without changing installation-help behavior. Final Release iPhone assets match all 25 web files; original Rty Home and mini standard-text portrait Home restored, completed progress unchanged. Evidence: ../qa-tablet-navigation/verification.md. Full quality/device/provider acceptance remains open.

## September 24 — readable, reliable password controls

Added shared Show/Hide controls to login, signup and deletion confirmation. Targets are at least 44 points and wrap below long labels at large text. Passwords start concealed and conceal again on leaving the field, clearing/disabling it or backgrounding the app. Autocomplete semantics are retained; autocorrection stays off. Actual Chromium checks found a cursor reset after changing input type, corrected by restoring selection after the controlled-value update.

Verified 1,927 interface tests, 72 final browser password cases, 36 keyboard-sized layout checks, four real standard/maximum-text iPhone/iPad journeys and two final-code native background/return journeys. Updated Release iPhone app has 25 matching assets; original Rty Home restored, synthetic progress unchanged. Evidence: ../qa-phone-forms/verification.md. Actual software keyboard, VoiceOver, physical devices, password-manager autofill and broader provider/performance acceptance remain open.

## September 24 — earned-first badges and phase browsing

The badge gallery previously opened 114 course cards, burying a learner's few earned awards among locked entries. It now opens Earned for learners with awards; All badges groups the catalog into 17 expandable phases with counts. New learners see Foundations open immediately. Expanded groups use separated rows, preserve choices across filters and expose keyboard/expanded-state semantics. Narrow maximum-text layouts give phase titles the full width without reducing text size.

Verified 1,929 interface tests, 48 complete-collection browser journeys, 144 captured browser states, 16 emulated largest-system-text layouts, four standard/maximum-text native journeys and two additional final-code native journeys. Narrow-layout checks caught and drove fixes for broken words and inherited button width. Updated Release iPhone app has 25 matching assets; Rty Home and standard-text QA Home restored, completion/badges unchanged. Evidence: ../qa-badge-disclosure/verification.md. Broader accessibility/device/provider/performance acceptance remains open.

## September 24 — measured native startup instead of speculative optimization

Captured the installed regular Release app with Instruments App Launch and Time Profiler. Both traces concentrate early native CPU samples in simulator/framework dynamic-loader parsing before Capacitor controller initialization. The App Launch lifecycle table is empty and its sampling configuration warns; a simpler second recording removes the sampling-period mismatch but still lacks complete lifecycle coverage. Neither trace measures time to Home or proves a speed improvement. WebContent JavaScript is outside these native-process samples.

Reviewed current startup resources: local swapping fonts and already-deferred full learning content. No measured app-code hotspot justified changing startup behavior. Product code/binaries stay unchanged; all 25 installed assets match, Rty Home restored and synthetic progress unchanged. Evidence: ../qa-launch-profile/verification.md. Next performance acceptance needs synchronized native/document/first-render timing and physical hardware; broader design/behavior work remains active.

## September 24 — recover from stalled deletion password verification

Both account-deletion paths now stop waiting after 15 seconds when password verification stalls, before billing/seat/deletion mutations. The password clears and Settings explains that nothing was deleted. Late authentication settlement cannot resume the abandoned deletion; only a fresh explicit confirmation starts another attempt. Public accounts also receive the existing specific wrong-password/network/throttling messages.

Verified 1,935 interface plus 482 unit/service/browser-gate tests, eight real-deadline full browser journeys, 48 responsive error/cancellation checks and two actual native recovery journeys. Fixed a diagnostic-wrapper URL-order issue and separately proved navigation remains native. Final Release iPhone assets match all 25 web files, QA hooks are excluded, Rty Home restored and synthetic progress unchanged. Evidence: ../qa-password-wait/verification.md. Post-submission mutation uncertainty and broader accessibility/device/provider/performance acceptance remain open.


## September 24 — searchable course catalog

Added local course search across all 133 activities, with phase/title/type matching, accent/case/word-order normalization, clear/empty states and the original completed/current/locked row behavior. Closing restores reading position and phase disclosure choices; Current step exits search and finds the active lesson. Reproduced and fixed WebKit Escape scrolling by ending input focus before removing the field.

Verified 1,941 interface tests, 48 final browser search journeys, 32 largest-system-text emulation journeys, 72 existing navigation journeys, four standard/maximum-app-text native journeys and two final-code native search-to-lesson/exit journeys. Actual iPad software keyboard was visible and usable; full keyboard/VoiceOver/physical acceptance remains open. Final Release iPhone has 25 matching assets and original Rty Home restored, synthetic completed progress/badges unchanged. Evidence: ../qa-course-search/verification.md. Broader app-quality goal stays active.


## September 24 — quieter Home hierarchy and aligned progress

Home now uses one main learning card, an unboxed message-checking row and a compact aligned progress pair. Removed generic tagline/secondary heading clutter. Independent tablet supporting sections fix stretched gaps; larger text stacks progress and frees space for labels. Final iPhone Home shows the progress pair without scrolling.

Verified 1,941 interface tests, 120 final browser Home journeys, 80 final largest-system-text emulation journeys, 16 input-mode scenes/96 controls, six normal/large-app-text native journeys and two final-code actual largest-system+app-text journeys. Corrected overflow labels exposed by extreme sizing. System/app preferences restored; 25 installed Release assets match, original Rty Home restored, synthetic completion/badges unchanged. Evidence and intermediate/final distinctions: ../qa-home-hierarchy/verification.md. The broader quality/device/provider/accessibility goal remains active.


## September 24 — persistent paywall Close and catalog recovery

The subscription header remains visible after scrolling on compact and wide layouts, including native safe areas. Opaque top spacing prevents content leaking above it. Native product reads now expire after 15 seconds; failed Retry returns an actionable error and releases controls. Only the latest startup/Retry read can own catalog state. Purchase/restore semantics, trusted prices/trials and free access are preserved.

Verified 1,949 UI tests + 482 Node/backend/browser tests, 240 final browser dismissal journeys, 240 additional extreme-system-scale journeys, 336 operation-state captures and 14 native journeys on iPhone 18 Pro, iPad mini and iPad Pro 13-inch. Native checks include portrait/landscape, actual largest system/app text and two held-catalog recovery flows. Final Release installed assets match all 25 web assets and exclude QA hooks. Text settings/orientation restored, original Rty Home foreground, saved completion/badges unchanged. Evidence and harness corrections: ../qa-paywall-recovery/verification.md. Whole-app quality, physical devices, VoiceOver and live provider acceptance remain open.


## September 24 — visible logout feedback and safe retry

Logout now shows waiting/failure feedback beside the action in Settings and account recovery. One pending request is shared across screen visits; late results cannot clear a different account. A 15-second message acknowledges a longer wait without pretending cancellation.

Verified 1,954 interface tests plus 482 Node/backend/browser checks, 24 full-App browser logout/retry/login journeys, 576 final feedback layouts, eight native functional journeys and three final-copy native waiting checks. All 25 installed Release assets match and exclude QA hooks. Original Rty Home restored; synthetic completion/badges unchanged. Evidence: ../qa-logout-recovery/verification.md. Broader quality, physical-device, VoiceOver and live-provider acceptance remain active.


## September 24 — persistent Settings and Scam Checker navigation

Both utility screens now keep a compact labeled Home control outside phone scrolling content. Large headings scroll normally. Wider windows use primary navigation; enlarged medium-width layouts retain a compact return control after their main menu scrolls away. The change preserves deletion-busy and logout-waiting behavior.

Verified 1,954 interface tests, 280 final responsive/text-stress captures, 28 full-App browser journeys and 13 native iPhone/iPad mini journeys including iPad landscape and actual largest UIKit text. Software-keyboard attempts did not display a keyboard and are explicitly unverified. A concurrency-related existing badge-test timeout passed with two workers; no test threshold changed. All 25 installed regular Release assets match, QA hooks excluded, Rty Home restored and synthetic saved completion/badges unchanged. Evidence: ../qa-utility-navigation/verification.md and comparison.html. The full quality/device/provider/accessibility goal remains active.
