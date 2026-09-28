import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import {examsByOrder} from "../src/data/lessons.js";
const require=createRequire(import.meta.url),engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE || "playwright");
const base=process.env.EVERWISE_QA_BASE || "http://127.0.0.1:8878";
assert.equal(new URL(base).hostname,"127.0.0.1");
const output=path.resolve(process.env.EVERWISE_WEB_EVIDENCE || "../qa-achievements-refinement/choice-stability");
await mkdir(output,{recursive:true});const cases=[];
try {
  for(const engine of ["chromium","webkit"]) {
    const browser=await engines[engine].launch(engine === "chromium" ? {executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true} : {headless:true});
    try {
      const context=await browser.newContext();
      await context.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      const page=await context.newPage();
      for(const exam of examsByOrder) for(const [width,height] of [[320,568],[667,375],[1440,900]]) for(const textSize of ["size-2","size-10"]) {
        await page.setViewportSize({width,height});
        await page.goto(`${base}/tests/fixtures/assessments.html?kind=exam&id=${exam.id}&textSize=${textSize}`);
        await page.getByRole("button",{name:"Start exam",exact:true}).click();
        const chosen=page.getByRole("button",{name:exam.questions[0].options[0],exact:true});
        await chosen.scrollIntoViewIfNeeded();
        const before=await chosen.boundingBox();
        await chosen.click();
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const after=await chosen.boundingBox();
        assert.ok(Math.abs(after.y-before.y)<2,`Selection must not jump away: ${engine} ${exam.id} ${width} ${textSize}`);
        assert.equal(await chosen.getAttribute("aria-pressed"),"true");
        const replacement=page.getByRole("button",{name:exam.questions[0].options[1],exact:true});
        await replacement.click();
        assert.equal(await replacement.getAttribute("aria-pressed"),"true");
        assert.equal(await chosen.getAttribute("aria-pressed"),"false");
        await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})))});
        const aligned=await replacement.evaluate(button=>{
          const text=button.firstElementChild.getBoundingClientRect(),marker=button.lastElementChild.getBoundingClientRect();
          return marker.left >= text.right+8 && marker.top <= text.top+6;
        });
        assert.ok(aligned,`Selection marker is beside its answer: ${engine} ${exam.id} ${width} ${textSize}`);
        const screenshot=`${engine}-${exam.id}-${width}x${height}-${textSize}.png`;
        await page.screenshot({path:path.join(output,screenshot)});
        cases.push({engine,id:exam.id,width,height,textSize,selectionJump:after.y-before.y,aligned,screenshot});
      }
    } finally {await browser.close();}
  }
  console.log(`PASS: ${cases.length} exam selections stay in place and can be changed before submission`);
} finally {await writeFile(path.join(output,"summary.json"),JSON.stringify({cases},null,2));}
