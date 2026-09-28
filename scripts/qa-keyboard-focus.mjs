// Run against the isolated, loopback-only visual lab. No login is submitted.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const engines = require(process.env.EVERWISE_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.EVERWISE_QA_BASE || "http://127.0.0.1:8867";
assert.equal(new URL(base).hostname, "127.0.0.1");
const evidence = process.env.EVERWISE_KEYBOARD_EVIDENCE;
if (evidence) await mkdir(evidence, {recursive:true});
for (const engine of ["chromium", "webkit"]) {
  const browser = await engines[engine].launch(engine === "chromium" ? {executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"} : {});
  try {
    const context = await browser.newContext({viewport: {width: 390, height: 844}});
    await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const size of ["size-2", "size-10"]) for (const [view, fields] of [["interview", ["profile-name", "profile-age"]], ["login", ["login-identifier", "login-password"]], ["password-reset", ["reset-email"]], ["signup", ["profile-username", "profile-password"]], ["settings-delete", ["delete-current-password"]]]) {
      await page.goto(`${base}/tests/fixtures/app-layout.html?view=${view}&textSize=${size}`);
      if (view === "settings-delete") {
        await page.setViewportSize({width:390, height:844});
        await page.waitForFunction(() => {
          const heading = document.querySelector(".settings-delete-confirmation h3");
          const pane = document.querySelector(".settings-screen");
          return heading === document.activeElement && heading.getBoundingClientRect().top >= Math.max(0, pane.getBoundingClientRect().top) &&
            heading.nextElementSibling.getBoundingClientRect().bottom <= Math.min(innerHeight, pane.getBoundingClientRect().bottom);
        });
        if (evidence) await page.screenshot({path:path.join(evidence, `${engine}-${size}-delete-confirmation.png`)});
      }
      for (const id of fields) {
        await page.setViewportSize({width: 390, height: 844});
        await page.locator(`#${id}`).focus();
        await page.setViewportSize({width: 390, height: 516});
        await page.waitForFunction(id => {
          const input = document.getElementById(id);
          if (document.activeElement !== input) return false;
          const field = input.closest("[data-form-field]");
          const rect = field.getBoundingClientRect();
          let top = 0, bottom = innerHeight;
          for (let parent = input.parentElement; parent; parent = parent.parentElement) {
            if (!/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(parent).overflowY)) continue;
            const bounds = parent.getBoundingClientRect();
            top = Math.max(top, bounds.top); bottom = Math.min(bottom, bounds.bottom);
          }
          return rect.top >= top && rect.bottom <= bottom;
        }, id);
        console.log(`PASS: ${engine} ${size} ${id} label and input remain visible after keyboard-sized viewport resize`);
        if (evidence) await page.screenshot({path:path.join(evidence, `${engine}-${size}-${id}.png`)});
      }
      if (view === "settings-delete") {
        await page.getByLabel("Current password", {exact:true}).fill("local-test-only");
        await page.getByRole("button", {name:"Cancel", exact:true}).click();
        assert.equal(await page.getByRole("button", {name:"Delete account", exact:true}).evaluate(el => el === document.activeElement), true);
        await page.getByRole("button", {name:"Delete account", exact:true}).click();
        assert.equal(await page.getByLabel("Current password", {exact:true}).inputValue(), "");
        assert.equal(await page.getByRole("button", {name:"Yes, delete", exact:true}).isDisabled(), true);
        console.log(`PASS: ${engine} ${size} cancellation restores focus and clears the confirmation password`);
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
  } finally { await browser.close(); }
}
