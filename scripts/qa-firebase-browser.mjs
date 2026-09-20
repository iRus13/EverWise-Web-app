import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { allLessons, challengesByOrder, examsByOrder } from "../src/data/lessons.js";
import { assertEmulatorEnvironment, firestoreChannelKey, isCanceledFirestoreNavigationError, isUnloadingFirestoreRetry, QA_PROJECT, QA_HOST, QA_PORTS } from "./firebase-qa-config.mjs";

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
      let rejectAuthDeletion = false;
      let rejectedAuthDeletions = 0;
      let billingCancellations = 0;
      const syntheticApis = {
        "/api/partner/access": { status: "none" },
        "/api/billing/access": { access: "none", status: "none", plan: null, trialEndsAt: null, currentPeriodEndsAt: null, cancelAtPeriodEnd: false, canStartTrial: true, canManage: false },
        "/api/billing/plans": { plans: [
          { key: "annual", currency: "usd", unitAmount: 6000, interval: "year", trialDays: 7 },
          { key: "monthly", currency: "usd", unitAmount: 799, interval: "month", trialDays: 3 },
        ] },
        "/api/billing/cancel": { canceled: true },
      };
      await context.route("**/*", route => {
        const url = new URL(route.request().url());
        if (url.origin === `http://${QA_HOST}:${QA_PORTS.auth}` && url.pathname.endsWith("/accounts:delete") && rejectAuthDeletion) {
          rejectedAuthDeletions++;
          return route.fulfill({ status: 400, json: { error: { code: 400, message: "OPERATION_NOT_ALLOWED" } } });
        }
        if (!allowed.has(url.origin)) {
          const destination = `${url.origin}${url.pathname}`;
          // Optional font loading and Firebase's connectivity image are never
          // fetched. Any other external destination is a test failure.
          const expectedResource = destination === "https://fonts.googleapis.com/css2" || destination === "https://www.google.com/images/cleardot.gif";
          (expectedResource ? blockedResources : unexpected).push(destination);
          return route.abort();
        }
        if (url.origin === base && url.pathname.startsWith("/api/")) {
          if (url.pathname === "/api/billing/cancel") billingCancellations++;
          if (Object.hasOwn(syntheticApis, url.pathname)) return route.fulfill({ json: syntheticApis[url.pathname], headers: { "Cache-Control": "no-store" } });
          unexpected.push(url.pathname); return route.abort();
        }
        return route.continue();
      });
      // Observe native fetch failures without replacing responses or retries.
      // This attributes WebKit's blocked unload-time retries to the old page.
      const documentRequestTrace = [];
      await context.exposeBinding("__qaInitialChannelEvent", (_source, event) => documentRequestTrace.push(event));
      await context.addInitScript(({ host, port }) => {
        const documentId = crypto.randomUUID();
        let hidden = false, leaving = false;
        const emit = event => void window.__qaInitialChannelEvent({ documentId, hidden, leaving, ...event }).catch(() => {});
        addEventListener("beforeunload", () => { leaving = true; emit({ event: "beforeunload" }); });
        addEventListener("pagehide", () => { hidden = true; emit({ event: "pagehide" }); });
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
          const input = args[0];
          const url = new URL(input instanceof Request ? input.url : String(input), location.href);
          const tracked = url.origin === `http://${host}:${port}` && /\/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel$/.test(url.pathname) && !url.searchParams.has("SID");
          if (!tracked) return Reflect.apply(originalFetch, this, args);
          emit({ event: "fetch", url: url.href });
          return Reflect.apply(originalFetch, this, args).catch(error => {
            emit({ event: "error", url: url.href, name: error.name, message: error.message });
            throw error;
          });
        };
      }, { host: QA_HOST, port: QA_PORTS.firestore });
      const page = await context.newPage();
      page.setDefaultTimeout(20_000);
      const network = [];
      const recordNetwork = event => { network.push(event); if (network.length > 30) network.shift(); };
      page.on("response", response => {
        const url = new URL(response.url());
        if ([String(QA_PORTS.auth), String(QA_PORTS.firestore)].includes(url.port)) recordNetwork({ path: url.pathname, status: response.status() });
      });
      const channels = new Set(), initializing = new Set(), abandoned = new Set(), canceled = new Set();
      const channelId = request => firestoreChannelKey(request.url());
      page.on("request", request => {
        const id = channelId(request);
        if (id) (id.startsWith("url:") ? initializing : channels).add(id);
      });
      page.on("requestfinished", request => {
        const id = channelId(request);
        initializing.delete(id);
      });
      page.on("pageerror", error => errors.push(error.message));
      page.on("requestfailed", request => {
        const id = channelId(request);
        initializing.delete(id);
        if (id && ["cancelled", "Load request cancelled"].includes(request.failure()?.errorText)) canceled.add(id);
        const url = new URL(request.url());
        if ([String(QA_PORTS.auth), String(QA_PORTS.firestore)].includes(url.port)) recordNetwork({ path: url.pathname, failure: request.failure()?.errorText });
      });
      async function reload() {
        channels.forEach(id => abandoned.add(id)); channels.clear();
        // Only initial requests still in flight at reload can be abandoned.
        initializing.forEach(id => abandoned.add(id)); initializing.clear();
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
        await button("Continue with free lessons").click();
        await readyHome();
        await button("Settings").click();
        await button("Delete account").click();
        await page.getByLabel("Current password", { exact: true }).fill("incorrect-synthetic-password");
        await button("Yes, delete").click();
        await page.getByRole("alert").filter({ hasText: "We could not delete your account" }).waitFor();
        assert.equal(billingCancellations, 0, "Incorrect password must not cancel billing");
        assert.deepEqual((await ownProfile()).completedLessons, ["welcome"]);
        rejectAuthDeletion = true;
        await page.getByLabel("Current password", { exact: true }).fill("synthetic-browser-password-42");
        await button("Yes, delete").click();
        await page.getByRole("alert").filter({ hasText: "Your saved profile was restored" }).waitFor();
        assert.equal(rejectedAuthDeletions, 1, "Only the Auth deletion failure was injected");
        assert.equal(billingCancellations, 1);
        assert.deepEqual((await ownProfile()).completedLessons, ["welcome"]);
        assert.deepEqual((await ownProfile()).badges, ["Welcome Aboard"]);
        console.log(`PASS: incorrect-password protection and real profile restoration after Auth deletion failure at ${width}px`);
        assert.equal((await ownProfile()).subscriptionStatus, "expired");
        assert.equal((await ownProfile()).trialStartedAt, null);
        assert.equal((await ownProfile()).plan, null);
        await reload();
        await readyHome();
        assert.deepEqual((await ownProfile()).completedLessons, ["welcome"]);
        rejectAuthDeletion = false;
        await button("Settings").click();
        await button("Delete account").click();
        await page.getByLabel("Current password", { exact: true }).fill("synthetic-browser-password-42");
        await button("Yes, delete").click();
        await button("Get Started").waitFor({ timeout: 60_000 });
        assert.equal(billingCancellations, 2);
        assert.equal(await page.evaluate(async () => (await import("/tests/fixtures/firebase-emulator.js")).auth.currentUser), null);
        // Emulator-only admin read proves the document is gone after sign-out.
        // The environment guard and fixed loopback demo URL exclude cloud data.
        const deletedProfile = await context.request.get(`http://${QA_HOST}:${QA_PORTS.firestore}/v1/projects/${QA_PROJECT}/databases/default/documents/users/${firstUid}`, { headers: { Authorization: "Bearer owner" } });
        assert.equal(deletedProfile.status(), 404);
        assert.equal((await deletedProfile.json()).error.status, "NOT_FOUND");
        await button("Log In").click();
        await page.getByLabel("Username or email").fill(username);
        await page.getByLabel("Password", { exact: true }).fill("synthetic-browser-password-42");
        await button("Log In").click();
        await page.getByRole("alert").waitFor();
        assert.equal(await page.evaluate(async () => (await import("/tests/fixtures/firebase-emulator.js")).auth.currentUser), null);
        console.log(`PASS: successful retry deletes the real profile and Auth login at ${width}px`);

        // Isolate assessment progress from the account-deletion journey above.
        // Prerequisites and paid access are synthetic; target completions,
        // Firebase writes, reloads, earned badges and path unlocks are real.
        await reload();
        await signUp(`assessment_${width}`);
        const exam=examsByOrder[0];
        const challenge=challengesByOrder.find(item => item.phase===exam.phase);
        const nextLesson=allLessons.find(item => item.phase===exam.phase+1);
        const prerequisites=[
          ...allLessons.filter(item => item.phase<=exam.phase),
          ...challengesByOrder.filter(item => item.phase<exam.phase),
          ...examsByOrder.filter(item => item.phase<exam.phase),
        ].map(item => item.id);
        await page.evaluate(async ids => (await import("/tests/fixtures/firebase-emulator.js")).seedOwnProgress(ids),prerequisites);
        syntheticApis["/api/billing/access"]={...syntheticApis["/api/billing/access"],access:"full",status:"active",plan:"annual",canStartTrial:false,canManage:true,currentPeriodEndsAt:"2099-01-01T00:00:00.000Z"};
        await reload(); await readyHome(); await button("Continue learning").click();
        assert.equal(await button(`Start exam: ${exam.title}`).count(),0,"Exam stays locked before the challenge");
        const nextLessonName=`Start lesson: ${nextLesson.pathTitle || nextLesson.title}`;
        assert.equal(await button(nextLessonName).count(),0,"Next phase stays locked before the exam");
        await button(`Start challenge: ${challenge.title}`).click();
        if(width===390) await page.evaluate(async () => (await import("/tests/fixtures/firebase-emulator.js")).disconnectDatabase());
        // The ungraded challenge allows skipping; all authored answer paths
        // have separate full-browser coverage in qa-assessments.mjs.
        for(const [index] of challenge.blocks.entries()) {
          await page.waitForFunction(value => document.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")===String(value),index+1);
          await button("Skip this step").click();
        }
        await button("Back to your path").click();
        await button(`Start exam: ${exam.title}`).waitFor();
        if(width===390) assert.equal(await queueSize(),1,"Offline challenge completion is durable before reload");
        async function savedAssessments(expectedIds,expectedBadges) {
          await page.waitForFunction(() => !Object.keys(localStorage).some(key => key.startsWith("everwise.progress.pending.v1:")),undefined,{timeout:60_000});
          const saved=await ownProfile();
          assert.deepEqual([...saved.completedLessons].sort(),[...expectedIds].sort());
          assert.deepEqual([...saved.badges].sort(),[...expectedBadges].sort());
        }
        await reload(); await readyHome();
        await savedAssessments([...prerequisites,challenge.id],[]);
        await button("Continue learning").click();
        await button(`Start exam: ${exam.title}`).waitFor();
        assert.equal(await button(nextLessonName).count(),0);
        console.log(`PASS: real challenge completion, ${width===390 ? "offline queue, " : ""}server acknowledgement, reload and exam unlock at ${width}px`);

        async function playExam(correctCount,redo=false) {
          await button(`${redo ? "Redo" : "Start"} exam: ${exam.title}`).click();
          await button("Start exam").click();
          if(width===390 && !redo) await page.evaluate(async () => (await import("/tests/fixtures/firebase-emulator.js")).disconnectDatabase());
          for(const [index,question] of exam.questions.entries()) {
            await page.getByRole("heading",{name:question.question,exact:true}).waitFor();
            await button(question.options[index<correctCount ? question.correctIndex : (question.correctIndex+1)%question.options.length]).click();
            await button(index+1<exam.questions.length ? "Next" : "See results").click();
          }
          await page.getByText(`You scored ${correctCount} of ${exam.totalQuestions}.`,{exact:true}).waitFor();
          const tier=[...exam.results].sort((a,b)=>b.minScore-a.minScore).find(item=>correctCount>=item.minScore);
          await page.getByText(tier.title,{exact:true}).waitFor();
          await button("Back to your path").click();
          await button(nextLessonName).waitFor();
          return tier.title;
        }
        const firstBadge=await playExam(exam.passingScore);
        if(width===390) assert.equal(await queueSize(),1,"Offline exam completion is durable before reload");
        await reload(); await readyHome();
        const completedAssessments=[...prerequisites,challenge.id,exam.id];
        await savedAssessments(completedAssessments,[firstBadge]);
        await button("Continue learning").click(); await button(nextLessonName).waitFor();
        console.log(`PASS: real exam completion, ${width===390 ? "offline queue, " : ""}badge persistence, reload and next-phase unlock at ${width}px`);
        const improvedBadge=await playExam(exam.questions.length,true);
        assert.notEqual(improvedBadge,firstBadge,"The retake must earn a better result");
        await savedAssessments(completedAssessments,[firstBadge,improvedBadge]);
        await reload(); await readyHome();
        await savedAssessments(completedAssessments,[firstBadge,improvedBadge]);
        console.log(`PASS: a better exam retake persists its new trophy without duplicating completion at ${width}px`);
        assert.deepEqual(unexpected, [], "No unrecognized API or external network requests");
        const canceledDiagnostics = errors.filter(message => isCanceledFirestoreNavigationError(message, abandoned, canceled));
        const unloadDiagnostics = errors.filter(message => isUnloadingFirestoreRetry(message, documentRequestTrace));
        const navigationDiagnostics = [...canceledDiagnostics, ...unloadDiagnostics];
        assert.deepEqual(errors.filter(message => !navigationDiagnostics.includes(message)), [], "No app errors or active-channel failures");
        console.log(`INFO: ${canceledDiagnostics.length} WebKit diagnostics matched independently canceled Firestore channels from discarded pages`);
        console.log(`INFO: ${unloadDiagnostics.length} initial-channel diagnostics matched exact fetch retries issued after beforeunload and before pagehide of the same document`);
        console.log(`PASS: ${blockedResources.length} optional external requests blocked at ${width}px; all account traffic stayed local`);
        completedWidths.push(width);
      } catch (error) {
        console.error(`Browser QA failed at ${width}px:`, (await page.locator("body").innerText()).slice(0, 3000));
        console.error("Local emulator response diagnostics:", JSON.stringify(network));
        console.error("Browser errors:", JSON.stringify(errors));
        console.error("Initial channel document trace:", JSON.stringify(documentRequestTrace));
        console.error("Initial channel cancellation evidence:", JSON.stringify([...canceled].filter(id => id.startsWith("url:")).map(id => ({id, abandoned: abandoned.has(id)}))));
        console.error("Unexpected destinations:", JSON.stringify(unexpected));
        throw error;
      } finally { await context.close(); }
    }
    console.log("PASS: real Firebase browser journeys; billing and partner APIs used explicit synthetic responses; no live providers");
    return completedWidths;
  } finally { await browser?.close(); await server.close(); }
}
