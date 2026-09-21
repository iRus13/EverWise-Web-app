# Device layout audit — September 20, 2026

This audit uses the running web app and native WKWebView, screenshot review, control geometry, and interaction checks. It does not certify every physical device, pixel, account state, or payment-provider outcome.

## Repairs

- Bundle Source Sans 3 and its OFL license locally. Holding the old Google stylesheet reproduced an empty app root; the repaired app renders and opens onboarding with all external requests blocked.
- Fit the normal-size login form and its signup action at 320 × 568. Preserve scrolling for enlarged text, validation messages, and keyboard resizing.
- Increase the course Back button, installation-banner dismissal, signup and login shortcuts to at least 44 CSS pixels.
- Make the desktop sidebar independently scrollable. The initial matrix exposed inaccessible text-size controls in 10 screen states at 1024 × 768 with largest text.
- Show installation guidance in iPad Safari with a desktop user agent and in landscape/wide layouts. Native apps, installed web apps, dismissed banners and ordinary desktop browsers retain their intended behavior.
- Scale paywall benefits, headline, plan labels, prices and primary action with the learner's text preference. Cap only the narrowest headline to preserve whole words; terms remain readable and scrollable.
- Stack the final-challenge trophy above the enlarged title on phones, avoiding a single trailing letter on its own line.
- Reserve native safe-area space around the partner report and shorten its numeric column heading to avoid an orphaned final letter.
- Bound billing and exam headings by their content width, avoiding broken ordinary words at enlarged text. Body copy retains the full text preference. A range-based check verifies whole words across all five authored exam titles and four billing states.
- Match fixture fonts, password recovery action, safe-area container and scroll hierarchy to production. Fake-clock account tests explicitly settle lazy imports before asserting the loaded lesson.

## Browser evidence

The initial Chromium matrix captured 45 scenes × 31 window sizes × 2 text sizes = **2,790 cases**. It found 10 instances of the same sidebar issue. Targeted replacement runs cover the affected source changes; the original failures are retained in the initial evidence rather than relabeled as passes.

Completed follow-up runs:

| Run | Cases | Result |
| --- | ---: | --- |
| Login, home and navigation changes, all 31 sizes | 682 | No geometry findings |
| Paywalls, final challenge and partner screens, all 31 sizes | 310 | No geometry findings |
| Extra 1024 × 480, 1024 × 600 and 1440 × 600 windows plus narrow paywalls | 80 | No geometry findings |
| Final partner spacing and column heading, all 31 sizes | 124 | No geometry findings |
| Touch/mobile user agents: two iPhones, iPad portrait/landscape, Android portrait/landscape | 48 | No geometry findings; all 6 dismissal/reload checks pass |
| Real-App onboarding, all eight steps at eight window sizes and both text sizes | 128 | No geometry findings; back navigation passes; no accounts created |
| Billing and all five exam headings at four sizes and both text sizes | 72 per engine | Whole-word wrapping passes in Chromium, WebKit and Firefox |
| Final billing and exam layouts across all 31 window sizes | 310 | No geometry findings |

The 31-size grid spans 320–1920 CSS pixels, including short landscape windows and both sides of the 640, 768, 900 and 1024 breakpoints. The extra short-window run adds three profiles. All visible controls in the initial matrix met the 44-pixel target within the measurement tolerance. Geometry checks cover horizontal overflow, broken images, errors and reachability through user-scrollable containers; large cards may legitimately require scrolling.

Additional real-App onboarding and native model sweeps are recorded in the final evidence index. A captured fixture is a layout observation, not proof of an authenticated live workflow.

## Native method and acceptance boundaries

The installed runtime is iOS 27.0 with Xcode 27.0. Baguette 0.1.99 supplies simulator screenshots and input. The build targets iPhone only; iPad screenshots show the actual compatibility window, while browser checks cover full tablet widths. The native build supports portrait orientation; landscape is covered by the web matrix. No watchOS app or iOS 26 runtime is available here.

Each native case runs production components inside a separately identified, disposable QA app with synthetic identities/offers and a loopback-only compiled server. The QA copy permits HTTP web content; the shipping bundle is not modified for this. The lab blocks external connections and does not load production environment files. Simulator launch failures and interrupted pilots are excluded from completed coverage. Xcode Device Hub sometimes shadows headless input/presentation; healing after boot and relaunching restored some affected simulator runs. Later cold loopback-test launches and navigations also produced empty views. The runner retains before-relaunch captures and records any recovery attempt, with one bounded relaunch per failed measurement. These recoveries verify warm fixture rendering, not reliable shipping-app cold startup.

The rebuilt bundled iPhone Air app was separately installed and observed at the welcome screen. Native input opened onboarding, entered a synthetic name and age, advanced to step 2, scrolled the choices and visibly selected Smartphone. Software-keyboard, VoiceOver, physical-device, live billing and delivery acceptance remain separate. Native PNG capture uses Baguette's image encoder, so the evidence is not a bit-for-bit golden-pixel comparison.

## Repeat the checks

1. Run `npm run build:ios`, then build the iOS simulator `App` scheme into `/tmp/everwise-simulator-qa` (or set `EVERWISE_SIM_APP` to another simulator app bundle).
2. Start `node scripts/qa-native-visual-server.mjs`. It binds only `127.0.0.1:8867`; `EVERWISE_QA_PORT` can choose another local port.
3. Run `node scripts/qa-responsive-devices.mjs`. Set `EVERWISE_PLAYWRIGHT_MODULE` if Playwright is installed outside this repository. Optional scene, viewport, worker and output-directory overrides are documented in the script.
4. Run `baguette serve --host 127.0.0.1 --port 8421 --no-plugins`, then `EVERWISE_QA_HEAL=1 node scripts/qa-native-device-sweep.mjs`. Use `EVERWISE_QA_DEVICE_FILTER` to select models. Only simulator instances created by the script are automatically deleted; explicitly supplied existing devices are preserved.
5. Run the mobile-browser, onboarding and offline-font scripts against the lab. `qa-webkit.mjs` can use `EVERWISE_QA_BASE` to test the already compiled lab.
6. Generate the review gallery with `node scripts/qa-device-report.mjs <native-summary.json> [...]`. Provide replacement web evidence directories with `EVERWISE_WEB_REGRESSIONS`. Later matching cases replace earlier captures; incomplete runs remain listed as coverage gaps.

Avoid running a large browser suite concurrently with multiple cold simulators on a 16 GB Mac. This session observed memory pressure, browser startup timeouts and slow simulator cold boots. These are not passing tests. The full UI run passed 1,751/1,753 before the lazy-import wait correction; the affected 140-test account suite then passed in full. The local unit/backend/browser run passed 464/465; its remaining browser geometry test hit infrastructure timeouts. The clean CI web job on product commit `cf9e3692a933d9be387ce117dc7463bc11aa50a4` subsequently passed all **466 unit/backend/browser and 1,753 UI tests (2,219 total)**, lint, production build, general WebKit coverage and production startup at both base paths. The Firefox and Firebase emulator jobs also passed. The full authored-lesson matrix is tracked in [run 35552378443](https://github.com/iRus13/EverWise-Web-app/actions/runs/35552378443).

No merge, deployment, live purchase, production-account mutation or synced `sources/` edit is included. The preexisting local `package.json` dependency-script approval map is excluded.
