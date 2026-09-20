// Test built files, not Vite's development transforms. No external requests,
// real accounts or payments. Works for both domain-root and subfolder builds.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import { lessonsByOrder, challengesByOrder, examsByOrder } from "../src/data/course-catalog.js";

const require = createRequire(import.meta.url);
const { webkit } = require(process.env.EVERWISE_PLAYWRIGHT_MODULE || "playwright");
const root = resolve(process.env.EVERWISE_QA_DIST || "dist/client");
const base = process.env.EVERWISE_QA_BASE || "/";
assert.ok(base.startsWith("/") && base.endsWith("/"));
const types = {".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".png":"image/png", ".webmanifest":"application/manifest+json"};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    assert.ok(pathname.startsWith(base));
    const path = resolve(root, pathname.slice(base.length) || "index.html");
    assert.ok(path.startsWith(`${root}${sep}`));
    const bytes = await readFile(path);
    response.writeHead(200, {"Content-Type":types[extname(path)] || "application/octet-stream"});
    response.end(bytes);
  } catch {
    response.writeHead(404); response.end("Not found");
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await webkit.launch();
  for (const width of [390, 1440]) {
    const context = await browser.newContext({viewport:{width, height:900}});
    await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [], failures = [], scripts = new Set();
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => {
      if (response.status() >= 400) failures.push(response.url());
      if (response.request().resourceType() === "script") scripts.add(response.url());
    });
    await page.goto(`${origin}${base}`);
    await page.getByRole("button", {name:"Get Started", exact:true}).waitFor();
    assert.deepEqual(await page.locator("img").evaluateAll(images => images.filter(image => !image.complete || !image.naturalWidth).map(image => image.src)), []);
    assert.ok(![...scripts].some(url => url.includes("learningScreens-")), "Welcome must not download exercise content");
    let initialBytes = 0, initialGzip = 0;
    for (const url of scripts) {
      const bytes = await readFile(resolve(root, new URL(url).pathname.slice(base.length)));
      initialBytes += bytes.length; initialGzip += gzipSync(bytes).length;
    }
    assert.ok(initialBytes < 1_100_000, `Startup JS exceeded 1.1 MB: ${initialBytes}`);
    assert.ok(initialGzip < 310_000, `Startup JS exceeded 310 KB gzip: ${initialGzip}`);

    await page.getByRole("button", {name:"Log In", exact:true}).click();
    await page.getByRole("button", {name:"Log In", exact:true}).click();
    await page.getByRole("alert").filter({hasText:"Please enter"}).waitFor();
    await page.getByRole("button", {name:"Back", exact:true}).click();
    await page.getByRole("button", {name:"Get Started", exact:true}).waitFor();

    const manifestUrl = await page.locator('link[rel="manifest"]').evaluate(element => element.href);
    assert.ok(manifestUrl.startsWith(`${origin}${base}`));
    const manifest = await (await context.request.get(manifestUrl)).json();
    assert.equal(new URL(manifest.start_url, manifestUrl).href, `${origin}${base}`);
    for (const icon of manifest.icons) {
      const url = new URL(icon.src, manifestUrl).href;
      assert.ok(url.startsWith(`${origin}${base}`));
      assert.equal((await context.request.get(url)).status(), 200);
    }
    for (const name of ["privacy", "terms"]) {
      await page.goto(`${origin}${base}${name}.html`);
      const home = page.locator("a.home-link");
      assert.equal(await home.evaluate(element => element.href), `${origin}${base}`);
      await home.click();
      await page.getByRole("button", {name:"Get Started", exact:true}).waitFor();
    }

    // Resolve the actual production split and verify all three curriculum kinds.
    const chunk = (await readdir(resolve(root,"assets"))).find(name => /^learningScreens-.*\.js$/.test(name));
    assert.ok(chunk, "A separately loadable learning module must exist");
    const items = [["lesson", lessonsByOrder[0].id], ["challenge", challengesByOrder[0].id], ["exam", examsByOrder[0].id]];
    const inventory = await page.evaluate(async ({url, items}) => {
      const module = await import(url);
      return items.map(([kind, id]) => {
        const {item, Player} = module.learningItem(kind, id);
        return {kind, id:item.id, hasContent:(item.blocks || item.questions).length > 0, hasPlayer:typeof Player === "function"};
      });
    }, {url:`${origin}${base}assets/${chunk}`, items});
    assert.deepEqual(inventory, items.map(([kind,id]) => ({kind, id, hasContent:true, hasPlayer:true})));
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
    console.log(`PASS production ${base} at ${width}px: ${initialBytes} initial JS bytes / ${initialGzip} gzip; deferred learning, logos, manifest, login validation and legal return links`);
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
