// Guard against sticky desktop hover styles after taps in a touch web view.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.EVERWISE_QA_BASE || 'http://127.0.0.1:8871';
const output=path.resolve(process.env.EVERWISE_COURSE_EVIDENCE || '../qa-course-refinement/touch');
await mkdir(output,{recursive:true});
const results=[];
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}:{headless:true});
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const page=await context.newPage();
  await page.goto(`${base}/tests/fixtures/app-layout.html?view=path`);
  await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
  assert.equal(await page.evaluate(()=>matchMedia('(hover: hover)').matches),false);
  const toggle=page.locator('#course-phase-1');
  const before=await toggle.evaluate(el=>getComputedStyle(el).backgroundColor);
  await toggle.tap();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert.equal(await toggle.evaluate(el=>getComputedStyle(el).backgroundColor),before);
  await toggle.tap();assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.equal(await toggle.evaluate(el=>getComputedStyle(el).backgroundColor),before);
  await page.screenshot({path:path.join(output,`${engine}-touch.png`)});
  results.push({engine,hover:false,background:before,collapsed:true,expanded:true});
  await context.close();
 }finally{await browser.close();}
}
await writeFile(path.join(output,'summary.json'),JSON.stringify(results,null,2));
console.log(`PASS ${results.length} touch hover regressions`);
