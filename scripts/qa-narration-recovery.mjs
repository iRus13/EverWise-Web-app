// Exercise the visible recovery state with both audio sources unavailable.
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const require=createRequire(import.meta.url);
const engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE || "playwright");
const base=process.env.EVERWISE_QA_BASE || "http://127.0.0.1:8874";
assert.equal(new URL(base).hostname,"127.0.0.1");
const output=path.resolve(process.env.EVERWISE_WEB_EVIDENCE || "../qa-learning-refinement/narration");
await mkdir(output,{recursive:true});
const results=[];
try {
  for(const engine of ["chromium","webkit"]) {
    const browser=await engines[engine].launch(engine === "chromium" ? {executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true} : {headless:true});
    try {
      const context=await browser.newContext();
      await context.route("**/*",route=>new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      await context.route("**/api/read-aloud",route=>route.fulfill({status:503,contentType:"application/json",body:'{"error":"unavailable for isolated QA"}'}));
      await context.addInitScript(()=>Object.defineProperty(window,"speechSynthesis",{value:undefined,configurable:true}));
      const page=await context.newPage();
      for(const [width,height] of [[320,568],[667,375],[768,1024]]) for(const textSize of ["size-2","size-10"]) {
        await page.setViewportSize({width,height});
        await page.goto(`${base}/tests/fixtures/learning-layout.html?type=reading&textSize=${textSize}`);
        const button=page.getByRole("button",{name:"Read aloud",exact:true});
        await button.click();
        const status=page.getByRole("status");
        await status.waitFor({state:"visible"});
        assert.match(await status.textContent(),/Audio isn't available/);
        const statusVisible=element=>{
          let top=0,bottom=innerHeight;
          for(let parent=element.parentElement;parent;parent=parent.parentElement) {
            if(!/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(parent).overflowY)) continue;
            const rect=parent.getBoundingClientRect();top=Math.max(top,rect.top);bottom=Math.min(bottom,rect.bottom);
          }
          const rect=element.getBoundingClientRect();
          return Math.min(rect.bottom,bottom)-Math.max(rect.top,top)>=Math.min(44,rect.height)-1;
        };
        await page.waitForFunction(statusVisible,await status.elementHandle(),{timeout:5000});
        const visible=await status.evaluate(statusVisible);
        const screenshot=`${engine}-${width}x${height}-${textSize}.png`;
        await page.screenshot({path:path.join(output,screenshot)});
        results.push({engine,width,height,textSize,visible,screenshot});
        assert.ok(visible,`Narration error must be visible at ${engine} ${width}x${height} ${textSize}`);
        await button.click();
        await status.waitFor({state:"visible"});
        assert.equal(await button.getAttribute("aria-busy"),"false");
      }
    } finally {await browser.close();}
  }
  console.log(`PASS: ${results.length} narration failure and retry layouts`);
} finally {await writeFile(path.join(output,"summary.json"),JSON.stringify({results},null,2));}
