# EverWise audit publication manifest

Repository: `iRus13/EverWise-Web-app`

Review branch: `audit/ios-web-2026-09-19` against `main`. No merge or deployment.

User-visible changes: fix iOS startup crash, localize and clarify paywall offers, recover purchase/restore and narration/checker failures, improve responsive readability and progress display. Include dependency fixes, expanded tests, PR QA and evidence. Preserve the local-only pre-existing script approvals.

Exact changed files:

- `.github/workflows/deploy-digitalocean.yml`
- `.github/workflows/deploy-pages.yml`
- `.github/workflows/qa.yml`
- `IOS_RELEASE_CHECKLIST.md`
- `README.md`
- `capacitor.config.json`
- `docs/qa/2026-09-19-ios-web-audit.md`
- `docs/qa/2026-09-19-push-manifest.md`
- `docs/qa/evidence-2026-09-19/clean-checkout.txt`
- `docs/qa/evidence-2026-09-19/dependencies.json`
- `docs/qa/evidence-2026-09-19/ios-simulator.txt`
- `docs/qa/evidence-2026-09-19/ios-welcome.jpg`
- `docs/qa/evidence-2026-09-19/server-dependencies.json`
- `docs/qa/evidence-2026-09-19/ui.txt`
- `docs/qa/evidence-2026-09-19/unit-and-browser.txt`
- `docs/qa/evidence-2026-09-19/webkit.txt`
- `ios/App/App/AppDelegate.swift`
- `ios/App/App/EverwisePurchasesPlugin.swift`
- `ios/App/App/Info.plist`
- `package-lock.json`
- `package.json`
- `scripts/qa-webkit.mjs`
- `src/App.jsx`
- `src/components/ReadAloud.jsx`
- `src/index.css`
- `src/screens/Home.jsx`
- `src/screens/Paywall.jsx`
- `src/screens/ScamChecker.jsx`
- `src/utils/apiEndpoint.js`
- `tests/api-endpoint.test.jsx`
- `tests/app-navigation.test.jsx`
- `tests/billing-client.test.jsx`
- `tests/curriculum-audit.test.jsx`
- `tests/fixtures/app-layout.html`
- `tests/fixtures/app-layout.jsx`
- `tests/fixtures/paywall-layout.jsx`
- `tests/home-progress.test.jsx`
- `tests/native-paywall.test.jsx`
- `tests/partner-client.test.jsx`
- `tests/paywall-billing.test.jsx`
- `tests/paywall-layout-browser.test.js`
- `tests/read-aloud.test.jsx`
- `tests/scam-checker.test.jsx`
- `tests/setup-dom.js`
- `vite.config.js`
- `vitest.config.js`
