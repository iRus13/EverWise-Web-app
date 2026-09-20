// Optional browser QA: install Playwright + its WebKit browser, or point
// EVERWISE_PLAYWRIGHT_MODULE at an existing Playwright package directory.
// All external requests are blocked; no account or purchase is created.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

const require = createRequire(import.meta.url);
const { webkit } = require(process.env.EVERWISE_PLAYWRIGHT_MODULE || "playwright");
const server = await createServer({
  root: fileURLToPath(new URL("../", import.meta.url)),
  configFile: false, logLevel: "error", plugins: [react()],
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try {
  browser = await webkit.launch();
  const context = await browser.newContext();
  await context.route("**/*", route => new URL(route.request().url()).origin === base
    ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let combinations = 0;
  async function geometry(path, width, height) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}${path}`);
    try {
      // The marker signals measurement completion, independently of the body's
      // box (its children may own all of the scrolling/layout).
      await page.waitForSelector('body[data-geometry-ready="true"]', {state:"attached"});
    } catch (error) {
      throw new Error(`Geometry not ready: ${path} at ${width}x${height}; page errors: ${errors.join("; ")}`, {cause:error});
    }
    const result = await page.evaluate(() => JSON.parse(atob(document.body.dataset.geometry)));
    assert.ok(result.scrollWidth <= result.clientWidth + 1, `${path} overflow at ${width}`);
    combinations++;
    return result;
  }
  for (const view of ["landing", "login", "password-reset", "interview", "signup", "home", "home-pending", "settings", "settings-reset-pending", "settings-reset-error", "badges", "path", "lesson", "complete", "complete-pending", "scam-checker"]) {
    for (const [width, height] of [[320,568], [768,1024], [1440,900], ...((view.endsWith("-pending") || view.startsWith("settings-reset-")) ? [[667,375]] : [])]) {
      for (const size of ["size-2", "size-10"]) {
        const g = await geometry(`/tests/fixtures/app-layout.html?view=${view}&textSize=${size}`, width, height);
        assert.deepEqual(g.outside, [], `${view} controls at ${width} ${size}`);
        assert.deepEqual(g.brokenImages, [], `${view} images`);
        assert.ok(g.headings, `${view} heading`);
        assert.ok(g.recoveryReadable, `${view} reset status and logout must remain usable at ${width}x${height} ${size}: ${JSON.stringify(g)}`);
        assert.ok(g.noticeReachable && (g.contentHeight === null || g.contentHeight >= 80), `${view} save notice must remain reachable without hiding the screen`);
      }
    }
  }
  for (const platform of ["web", "native"]) {
    for (const [width, height] of [[320,568], [390,844], [667,375], [1440,900]]) {
      for (const size of ["size-2", "size-5", "size-10"]) {
        const g = await geometry(`/tests/fixtures/paywall-layout.html?platform=${platform}&textSize=${size}`, width, height);
        assert.ok(g.footerReachable && !g.textOverflow, `${platform} terms at ${width} ${size}`);
        assert.ok(g.termsFontSize >= 18);
        assert.ok(g.buttons.every(b => b.height >= 44));
        for (const rect of [g.root, g.action, ...g.cards]) {
          assert.ok(rect.left >= -1 && rect.right <= g.clientWidth + 1);
        }
      }
    }
  }
  console.log(`PASS: ${combinations} WebKit responsive screen combinations`);
  const delayedReset = await geometry("/tests/fixtures/app-layout.html?view=settings-reset-error&resetDelay=200&textSize=size-10", 320, 568);
  assert.ok(delayedReset.recoveryReadable, "Wait for the delayed reset error before measuring it");
  console.log("PASS: delayed reset error is measured after it renders");

  // Exercise the real App's public navigation, not isolated screen callbacks.
  // macOS WebKit's default Tab visits fields; Option-Tab includes buttons too.
  const nextControl = process.platform === "darwin" ? "Alt+Tab" : "Tab";
  const previousControl = process.platform === "darwin" ? "Alt+Shift+Tab" : "Shift+Tab";
  for (const [width, height] of [[390,844], [1440,900]]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    await page.getByRole("button", {name: "Get Started", exact: true}).click();
    await page.getByLabel("What should we call you?").fill("QA Learner");
    await page.getByLabel("Your age", {exact:true}).fill("68");
    await page.getByRole("button", {name:"Start", exact:true}).click();
    await page.getByRole("radio", {name:"Every day", exact:true}).click();
    await page.getByRole("radio", {name:"Smartphone", exact:true}).click();
    await page.getByRole("button", {name:"Continue", exact:true}).click();
    await page.getByRole("radio", {name:"Confident", exact:true}).click();
    await page.getByRole("radio", {name:"Never", exact:true}).click();
    await page.getByRole("button", {name:"Continue", exact:true}).click();
    await page.getByRole("checkbox", {name:"Suspicious links", exact:true}).click();
    await page.getByRole("button", {name:"Continue", exact:true}).click();
    await page.getByRole("radio", {name:"Call the bank using its official number", exact:true}).click();
    await page.getByRole("button", {name:"Continue", exact:true}).click();
    await page.getByRole("radio", {name:"I’ve heard of it", exact:true}).click();
    await page.getByRole("button", {name:"Continue", exact:true}).click();
    await page.getByRole("radio", {name:"Maybe later", exact:true}).click();
    await page.getByRole("button", {name:"Continue", exact:true}).click();
    await page.getByLabel("Username", {exact:true}).fill("qa_learner");
    await page.getByLabel("Choose a password").fill("synthetic-not-submitted");
    await page.getByRole("button", {name:"Log in", exact:true}).click();
    await page.getByRole("button", {name:"Log In", exact:true}).click();
    await page.getByRole("alert").filter({hasText:"Please enter"}).waitFor();
    await page.getByLabel("Username or email").fill("qa_learner");
    assert.equal(await page.getByRole("alert").count(), 0);
    await page.getByRole("button", {name:"Back", exact:true}).click();
    assert.equal(await page.getByLabel("Username", {exact:true}).inputValue(), "qa_learner");
    assert.equal(await page.getByLabel("Choose a password").inputValue(), "");
    for (let step = 0; step < 7; step++) {
      await page.getByRole("button", {name:"Previous question", exact:true}).click();
    }
    assert.equal(await page.getByLabel("What should we call you?").inputValue(), "QA Learner");
    await page.getByRole("button", {name:"Back to welcome", exact:true}).click();
    await page.getByRole("button", {name:"Get Started", exact:true}).waitFor();
    console.log(`PASS: real App onboarding, login detour, validation and answer recovery at ${width}px`);

    // Check actual keyboard traversal and focus recovery with real DOM content.
    await page.getByRole("button", {name:"Log In", exact:true}).focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.activeElement?.tagName === "H1" && document.activeElement.textContent.includes("back"));
    await page.keyboard.press(nextControl);
    assert.equal(await page.getByLabel("Username or email").evaluate(el => el === document.activeElement), true);
    await page.keyboard.type("learner@example.com");
    await page.keyboard.press(nextControl);
    assert.equal(await page.getByLabel("Password", {exact:true}).evaluate(el => el === document.activeElement), true);
    await page.keyboard.type("synthetic-not-submitted");
    await page.keyboard.press(nextControl);
    assert.equal(await page.getByRole("button", {name:"Forgot password?"}).evaluate(el => el === document.activeElement), true);
    assert.notEqual(await page.getByRole("button", {name:"Forgot password?"}).evaluate(el => getComputedStyle(el).outlineStyle), "none", "Interactive keyboard focus stays visible");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.activeElement?.tagName === "H1" && document.activeElement.textContent.includes("Reset"));
    await page.keyboard.press(nextControl);
    assert.equal(await page.getByLabel("Email address").evaluate(el => el === document.activeElement), true);
    await page.keyboard.press(previousControl);
    assert.equal(await page.getByRole("button", {name:"Back", exact:true}).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.activeElement?.tagName === "H1" && document.activeElement.textContent.includes("back"));
    assert.equal(await page.getByLabel("Password", {exact:true}).inputValue(), "");
    console.log(`PASS: keyboard login/recovery traversal, heading focus and password clearing at ${width}px`);
  }
  assert.deepEqual(errors, [], "No browser page errors");
  await context.close();
  console.log("PASS: no uncaught browser errors; external requests blocked throughout");
} finally {
  await browser?.close();
  await server.close();
}
