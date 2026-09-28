import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {lessonsByOrder} from '../src/data/course-catalog.js';
const require=createRequire(import.meta.url),engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8914';
assert.equal(new URL(base).hostname,'127.0.0.1');
const out=path.resolve(process.env.EVERWISE_COURSE_EVIDENCE||'../qa-course-search/browser');await mkdir(out,{recursive:true});const results=[];
const later=lessonsByOrder.find(x=>x.phase===8).id;
async function fit(page,key) {
 const problems=await page.evaluate(()=>{
  const issues=[];
  for(const el of document.querySelectorAll('.course-path-header button,.course-search-field,.course-step-title,.course-search-phase-heading')){
   if(!el.getClientRects().length)continue;
   const r=el.getBoundingClientRect();if(r.left < -1||r.right > innerWidth+1)issues.push({text:el.textContent,rect:r.toJSON()});
   if(el.matches('button')&&(r.width<44||r.height<44))issues.push({small:el.getAttribute('aria-label')});
  }
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push({overflow:document.documentElement.scrollWidth});
  return issues;
 });assert.deepEqual(problems,[],key);
}
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try { for(const [width,height] of JSON.parse(process.env.EVERWISE_QA_VIEWPORTS||'[[320,568],[390,844],[844,390],[744,1133],[1133,744],[1440,900]]')) for(const textSize of ['size-2','size-10']) {
  const context=await browser.newContext({viewport:{width,height}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const stage of [later,'all']) {
   const key=`${engine}-${width}x${height}-${textSize}-${stage}`;
   await page.goto(`${base}/tests/fixtures/app-layout.html?view=path&pathAt=${stage}&textSize=${textSize}`);
   await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
   if(process.env.EVERWISE_QA_SYSTEM_SCALE) {
    await page.evaluate(scale=>{const root=document.documentElement;root.dataset.systemTextCategory='emulated';root.style.setProperty('--system-text-scale',String(scale));root.style.setProperty('--system-title-scale','2');root.dataset.expandedText='true';},Number(process.env.EVERWISE_QA_SYSTEM_SCALE));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   }
   await fit(page,key+' outline');
   const positions=()=>page.evaluate(()=>[document.scrollingElement.scrollTop,document.querySelector('.path-scroll').scrollTop,document.querySelector('.app-canvas').scrollTop]);
   await page.getByRole('button',{name:'Search course',exact:true}).scrollIntoViewIfNeeded();
   const before=await positions();
   await page.getByRole('button',{name:'Search course',exact:true}).click();
   const input=page.getByRole('searchbox',{name:'Lesson or topic'});
   assert.ok(await input.evaluate(el=>el===document.activeElement));
   await fit(page,key+' empty');
   await input.fill('  Bankíng   Onlíne  ');
   assert.equal(await page.locator('[data-course-step]').count(),1);
   await fit(page,key+' completed');
   await page.screenshot({path:path.join(out,key+'-completed.png')});
   await page.getByRole('button',{name:'Redo completed lesson: Online Banking',exact:true}).click();
   assert.equal((await page.evaluate(()=>window.__courseQA.actions)).at(-1).value,'online-banking');
   await input.fill('Phase 17');await fit(page,key+' future phase');
   if(stage!=='all')assert.ok(await page.locator('.course-step-locked').count()>0);
   for(const row of await page.locator('.course-step-locked').all())assert.equal(await row.locator('button').count(),0);
   await page.screenshot({path:path.join(out,key+'-results.png')});
   await input.fill('xxxxnothing');assert.match(await page.getByRole('status').textContent(),/^0 results/);
   await fit(page,key+' no results');
   await page.getByRole('button',{name:'Clear search'}).click();assert.equal(await input.inputValue(),'');
   await input.press('Escape');
   assert.equal(await input.isVisible(),false);
   assert.ok(await page.getByRole('button',{name:'Search course',exact:true}).evaluate(el=>el===document.activeElement));
   await page.waitForFunction(expected => [document.scrollingElement.scrollTop,document.querySelector('.path-scroll').scrollTop,document.querySelector('.app-canvas').scrollTop].every((value,index)=>Math.abs(value-expected[index])<2),before);
   const after=await positions();assert.ok(after.every((v,i)=>Math.abs(v-before[i])<2),`${key} return position ${before} -> ${after}`);
   if(stage!=='all') {
    await page.getByRole('button',{name:'Search course',exact:true}).click();await input.fill('xxxxnothing');
    await page.getByRole('button',{name:'Find your current step',exact:true}).click();
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-current')==='step');
    assert.equal(await input.isVisible(),false);
   }
   await fit(page,key+' restored');assert.deepEqual(errors,[],key);results.push({key,passed:true});console.log('PASS',key);
  }
  await context.close();
 }}finally{await browser.close();}
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(`PASS ${results.length} course search journeys`);
