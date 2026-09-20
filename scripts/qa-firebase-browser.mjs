import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { assertEmulatorEnvironment, isCanceledFirestoreNavigationError, QA_PROJECT, QA_HOST, QA_PORTS } from "./firebase-qa-config.mjs";

export async function runBrowserScenarios() {
  assertEmulatorEnvironment(process.env);
  const root = fileURLToPath(new URL("../", import.meta.url));
  const fixture = path.join(root, "tests/fixtures/firebase-emulator.js");
  const require = createRequire(import.meta.url);
  const { webkit } = require(process.env.EVERWISE_PLAYWRIGHT_MODULE || "playwright");
  const server = await createServer({
    root, configFile: false, envDir: false, logLevel: "error",
    cacheDir: await mkdtemp(path.join(tmpdir(), "everwise-emulator-vite-")),
    define: { __EVERWISE_EMULATOR__: JSON.stringify({ projectId: QA_PROJECT, host: QA_HOST, authPort: QA_PORTS.auth, firestorePort: QA_PORTS.firestore }) },
    plugins: [{
      name: "isolated-firebase-client", enforce: "pre",
      resolveId(source, importer) {
        if (!importer || !source.startsWith(".")) return;
        const resolved = path.resolve(path.dirname(importer.split("?")[0]), source);
        if ([path.join(root, "src/firebase"), path.join(root, "src/firebase.js")].includes(resolved)) return fixture;
      },
    }, react()],
    server: { host: QA_HOST, port: 0 },
  });
  let browser;
  try {
    await server.listen();
    const base = `http://${QA_HOST}:${server.httpServer.address().port}`;
    const allowed = new Set([base, `http://${QA_HOST}:${QA_PORTS.auth}`, `http://${QA_HOST}:${QA_PORTS.firestore}`]);
    browser = await webkit.launch();
    const completedWidths = [];
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
      const unexpected = [], errors = [], blockedResources = [];
      const syntheticApis = {
        "/api/partner/access": { status: "none" },
        "/api/billing/access": { access: "none", status: "none", plan: null, trialEndsAt: null, currentPeriodEndsAt: null, cancelAtPeriodEnd: false, canStartTrial: true, canManage: false },
        "/api/billing/plans": { plans: [
          { key: "annual", currency: "usd", unitAmount: 6000, interval: "year", trialDays: 7 },
          { key: "monthly", currency: "usd", unitAmount: 799, interval: "month", trialDays: 3 },
        ] },
      };
      await context.route("**/*", route => {
        const url = new URL(route.request().url());
        if (!allowed.has(url.origin)) {
          const destination = `${url.origin}${url.pathname}`;
          // Optional font loading and Firebase's connectivity image are never
          // fetched. Any other external destination is a test failure.
          const expectedResource = destination === "https://fonts.googleapis.com/css2" || destination === "https://www.google.com/images/cleardot.gif";
          (expectedResource ? blockedResources : unexpected).push(destination);
          return route.abort();
        }
        if (url.origin === base && url.pathname.startsWith("/api/")) {
          if (Object.hasOwn(syntheticApis, url.pathname)) return route.fulfill({ json: syntheticApis[url.pathname], headers: { "Cache-Control": "no-store" } });
          unexpected.push(url.pathname); return route.abort();
        }
        return route.continue();
      });
      const page = await context.newPage();
      page.setDefaultTimeout(20_000);
      const network = [];
      const recordNetwork = event => { network.push(event); if (network.length > 30) network.shift(); };
      page.on("response", response => {
        const url = new URL(response.url());
        if ([String(QA_PORTS.auth), String(QA_PORTS.firestore)].includes(url.port)) recordNetwork({ path: url.pathname, status: response.status() });
      });
      const channels = new Set(), abandoned = new Set(), canceled = new Set();
      const channelId = request => {
        const url = new URL(request.url());
        return url.origin === `http://${QA_HOST}:${QA_PORTS.firestore}` && /^\/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel$/.test(url.pathname) ? url.searchParams.get("SID") : null;
      };
      page.on("request", request => { const id = channelId(request); if (id) channels.add(id); });
      page.on("pageerror", error => errors.push(error.message));
      page.on("requestfailed", request => {
        const id = channelId(request);
        if (id && ["cancelled", "Load request cancelled"].includes(request.failure()?.errorText)) canceled.add(id);
        const url = new URL(request.url());
        if ([String(QA_PORTS.auth), String(QA_PORTS.firestore)].includes(url.port)) recordNetwork({ path: url.pathname, failure: request.failure()?.errorText });
      });
      async function reload() {
        channels.forEach(id => abandoned.add(id)); channels.clear();
        await page.reload();
      }
      const button = name => page.getByRole("button", { name, exact: true });
      const readyHome = () => button("Continue learning").waitFor({ timeout: 60_000 });
      const ownProfile = () => page.evaluate(async () => (await import("/tests/fixtures/firebase-emulator.js")).readOwnProfile());
      const queueSize = () => page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("everwise.progress.pending.v1:")).length);
      async function savedWelcome() {
        // Allow the emulator's streaming acknowledgement to arrive after the
        // app's honest 15-second pending notice. The server read below is still
        // mandatory; a local-only completion can never pass this assertion.
        await page.waitForFunction(() => !Object.keys(localStorage).some(key => key.startsWith("everwise.progress.pending.v1:")), undefined, { timeout: 60_000 });
        assert.deepEqual((await ownProfile()).completedLessons, ["welcome"], "Acknowledged completion must exist on the server");
      }
      async function signUp(username) {
        await button("Get Started").click();
        await page.getByLabel("What should we call you?").fill("QA Learner");
        await page.getByLabel("Your age", { exact: true }).fill("68");
        await button("Start").click();
        await page.getByRole("radio", { name: "Every day", exact: true }).click();
        await page.getByRole("radio", { name: "Smartphone", exact: true }).click();
        await button("Continue").click();
        await page.getByRole("radio", { name: "Confident", exact: true }).click();
        await page.getByRole("radio", { name: "Never", exact: true }).click();
        await button("Continue").click();
        await page.getByRole("checkbox", { name: "Suspicious links", exact: true }).click();
        await button("Continue").click();
        await page.getByRole("radio", { name: "Call the bank using its official number", exact: true }).click();
        await button("Continue").click();
        await page.getByRole("radio", { name: "I’ve heard of it", exact: true }).click();
        await button("Continue").click();
        await page.getByRole("radio", { name: "Maybe later", exact: true }).click();
        await button("Continue").click();
        await page.getByLabel("Username", { exact: true }).fill(username);
        await page.getByLabel("Choose a password").fill("synthetic-browser-password-42");
        await button("Build my plan").click();
        // The first WebChannel connection can be slow in a cold emulator/CI
        // browser. Keep a specific bound without weakening any saved-data check.
        await button("See my plan options").click({ timeout: 60_000 });
        await page.getByRole("button", { name: /^Start \d+-day free trial$/ }).waitFor();
        await button("Continue with free lessons").click();
        await readyHome();
      }
      async function logout() {
        if (await button("Back to home").isVisible()) await button("Back to home").click();
        await button("Settings").click(); await button("Log out").click();
        await button("Get Started").waitFor();
      }
      try {
        await page.goto(base);
        const username = `browser_${width}`;
        await signUp(username);
        assert.deepEqual((await ownProfile()).completedLessons, []);
        const firstUid = await page.evaluate(async () => (await import("/tests/fixtures/firebase-emulator.js")).auth.currentUser.uid);
        console.log(`PASS: real App signup, onboarding profile and paywall free exit at ${width}px`);
        if (width === 390) await page.evaluate(async () => (await import("/tests/fixtures/firebase-emulator.js")).disconnectDatabase());
        await button("Continue learning").click();
        await button("Start lesson: Welcome to Everwise").click();
        await page.getByRole("heading", { name: "How Everwise Works", exact: true }).waitFor();
        await button("Continue").click();
        await page.getByRole("heading", { name: "Welcome Aboard!", exact: true }).waitFor();
        if (width === 390) assert.equal(await queueSize(), 1, "Offline completion is journaled before reload");
        else await savedWelcome();
        await reload();
        await readyHome();
        await savedWelcome();
        assert.equal(await page.evaluate(async () => (await import("/tests/fixtures/firebase-emulator.js")).auth.currentUser.uid), firstUid);
        console.log(`PASS: ${width === 390 ? "offline completion survives reload and reconnects" : "saved completion and sign-in survive reload"} at ${width}px`);
        await logout();
        await signUp(`other_${width}`);
        assert.deepEqual((await ownProfile()).completedLessons, []);
        await button("Continue learning").click();
        await button("Start lesson: Welcome to Everwise").waitFor();
        await logout();
        await button("Log In").click();
        await page.getByLabel("Username or email").fill(username);
        await page.getByLabel("Password", { exact: true }).fill("synthetic-browser-password-42");
        await button("Log In").click();
        await readyHome();
        assert.deepEqual((await ownProfile()).completedLessons, ["welcome"]);
        assert.deepEqual((await ownProfile()).badges, ["Welcome Aboard"]);
        assert.equal(await queueSize(), 0);
        console.log(`PASS: logout, second-account isolation and username login restore progress at ${width}px`);
        await page.evaluate(async () => (await import("/tests/fixtures/firebase-emulator.js")).forgeSubscriptionMirror());
        assert.equal((await ownProfile()).subscriptionStatus, "active");
        await reload();
        await readyHome();
        await button("Continue learning").click();
        await page.getByRole("button", { name: /^Start lesson:/ }).first().click();
        await page.getByRole("button", { name: /^Start \d+-day free trial$/ }).waitFor();
        await button("Continue with free lessons").waitFor();
        console.log(`PASS: forged profile subscription does not unlock paid lessons at ${width}px`);
        assert.deepEqual(unexpected, [], "No unrecognized API or external network requests");
        const navigationDiagnostics = errors.filter(message => isCanceledFirestoreNavigationError(message, abandoned, canceled));
        assert.deepEqual(errors.filter(message => !navigationDiagnostics.includes(message)), [], "No app errors or active-channel failures");
        console.log(`INFO: ${navigationDiagnostics.length} WebKit diagnostics matched independently canceled Firestore channels from discarded pages`);
        console.log(`PASS: ${blockedResources.length} optional external requests blocked at ${width}px; all account traffic stayed local`);
        completedWidths.push(width);
      } catch (error) {
        console.error(`Browser QA failed at ${width}px:`, (await page.locator("body").innerText()).slice(0, 3000));
        console.error("Local emulator response diagnostics:", JSON.stringify(network));
        console.error("Browser errors:", JSON.stringify(errors));
        console.error("Unexpected destinations:", JSON.stringify(unexpected));
        throw error;
      } finally { await context.close(); }
    }
    console.log("PASS: real Firebase browser journeys; billing and partner APIs used explicit synthetic responses; no live providers");
    return completedWidths;
  } finally { await browser?.close(); await server.close(); }
}
