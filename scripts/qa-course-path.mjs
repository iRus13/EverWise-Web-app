// Real course catalog and screen, synthetic progress, no provider requests.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {lessonsByOrder, challengesByOrder, examsByOrder} from '../src/data/course-catalog.js';
import {requiredCourseIds} from '../src/utils/courseProgress.js';
const require=createRequire(import.meta.url);
const engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.EVERWISE_QA_BASE || 'http://127.0.0.1:8871';
const output=path.resolve(process.env.EVERWISE_COURSE_EVIDENCE || '../qa-course-refinement/states');
await mkdir(output,{recursive:true});
const required=requiredCourseIds(lessonsByOrder,challengesByOrder,examsByOrder);
const stages=[lessonsByOrder[0].id,lessonsByOrder[1].id,challengesByOrder[0].id,examsByOrder[0].id,lessonsByOrder.find(l=>l.phase===8).id,'all'];
const results=[];
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}:{headless:true});
 try {
  for(const [width,height] of [[320,568],[390,844],[844,390],[768,1024],[1024,768],[1440,900]]) for(const size of ['size-2','size-10']) {
   const context=await browser.newContext({viewport:{width,height}});
   await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const stage of stages) {
    await page.goto(`${base}/tests/fixtures/app-layout.html?view=path&textSize=${size}&pathAt=${stage}`);
    await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    assert.deepEqual(errors,[]);
    const completed=stage==='all'?required.length:required.indexOf(stage);
    assert.equal(await page.getByRole('progressbar',{name:'Course progress'}).getAttribute('aria-valuenow'),String(completed));
    if(stage!=='all') {
     const current=page.locator('[aria-current=step]');
     assert.equal(await current.count(),1);
     assert.equal(await current.evaluate(el=>el.closest('[data-course-step]').dataset.courseStep),stage);
     await current.click();
     assert.equal(await page.evaluate(()=>window.__courseQA.actions.at(-1).value),stage);
    }
    if(stage===lessonsByOrder[1].id) {
     await page.locator('.course-quick-check').click();
     assert.deepEqual(await page.evaluate(()=>window.__courseQA.actions.at(-1)),{kind:'quick-check',value:stage});
    }
    const toggleId=await page.locator('.course-phase-toggle[aria-expanded=true]').first().getAttribute('id');
    const toggle=page.locator('#'+toggleId);
    await toggle.focus();await page.keyboard.press('Space');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await page.keyboard.press('Enter');assert.equal(await toggle.getAttribute('aria-expanded'),'true');
    const focus=await toggle.evaluate(el=>getComputedStyle(el).outlineStyle);assert.notEqual(focus,'none');
    // Every phase is expanded for full-catalog wrapping/overflow validation.
    const closedIds=await page.locator('.course-phase-toggle[aria-expanded=false]').evaluateAll(nodes=>nodes.map(el=>el.id));
    for(const id of closedIds) await page.locator('#'+id).click();
    const geometry=await page.evaluate(()=>{
     const root=document.querySelector('.course-outline');
     const outside=[...root.querySelectorAll('button,h1,.course-phase-title,.course-step-title')].filter(el=>{
      const r=el.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1||el.scrollWidth>el.clientWidth+1);
     }).map(el=>el.textContent);
     const small=[...root.querySelectorAll('button')].filter(el=>el.getBoundingClientRect().height<44).map(el=>el.textContent);
     const overlap=[...root.querySelectorAll('.course-step')].filter(el=>{
      const title=el.querySelector('.course-step-title').getBoundingClientRect();
      const indicator=el.querySelector('.course-step-indicator').getBoundingClientRect();
      return indicator.width > 0 && title.left < indicator.right-1 && title.right > indicator.left+1 && title.top < indicator.bottom-1 && title.bottom > indicator.top+1;
     }).map(el=>el.dataset.courseStep);
     const broken=[];
     for(const el of root.querySelectorAll('h1,.course-phase-title,.course-step-title,.course-quick-check')) {
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
      while((node=walker.nextNode())) for(const match of node.textContent.matchAll(/[A-Za-z]+/g)) {
       const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
       if(new Set([...range.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top))).size>1)broken.push(match[0]);
      }
     }
     return {outside,small,broken,overlap,steps:root.querySelectorAll('[data-course-step]').length,undefinedText:/undefined|NaN/.test(root.textContent)};
    });
    const label=`${engine}-${width}x${height}-${size}-${stage}`;
    assert.deepEqual(geometry.outside,[],`${label} overflow`);
    assert.deepEqual(geometry.small,[],`${label} targets`);
    assert.deepEqual(geometry.overlap,[],`${label} overlapping indicator`);
    assert.deepEqual(geometry.broken,[],`${label} broken words`);
    assert.equal(geometry.undefinedText,false);assert.equal(geometry.steps,required.length);
    assert.equal(await page.locator('.course-step-locked button').count(),0);
    // Capture the real resumed/current state, not the all-expanded test setup.
    await page.reload();await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const screenshot=label+'.png';await page.screenshot({path:path.join(output,screenshot)});
    results.push({engine,width,height,size,stage,completed,geometry,screenshot});
   }
   await context.close();console.log(`PASS ${engine} ${width}x${height} ${size}`);
   await writeFile(path.join(output,'summary.json'),JSON.stringify(results,null,2));
  }
 }finally{await browser.close();}
}
console.log(`PASS ${results.length} course states; all ${required.length} steps checked in each`);
