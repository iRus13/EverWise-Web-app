import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {lessonsByOrder,challengesByOrder} from '../src/data/course-catalog.js';
const require=createRequire(import.meta.url),engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8914';assert.equal(new URL(base).hostname,'127.0.0.1');
const out=path.resolve(process.env.EVERWISE_HOME_EVIDENCE||'../qa-home-hierarchy/browser');await mkdir(out,{recursive:true});const results=[];
const stages=[['fresh',''],['resume','&pathAt=credit-cards&resume=credit-cards&badges=2'],['challenge',`&pathAt=${challengesByOrder[0].id}&navigationPartner=${encodeURIComponent('The Community Digital Learning Partnership')}`],['complete','&pathAt=all&badges=15&homeName=Alexandramariarose'],['failure','&pathAt=credit-cards&opening=error']];
const views=JSON.parse(process.env.EVERWISE_QA_VIEWPORTS||'[[320,568],[402,874],[844,390],[744,1133],[1133,744],[1440,900]]');
for(const engine of ['chromium','webkit']){
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try{for(const [width,height] of views)for(const textSize of ['size-2','size-10']){
 const context=await browser.newContext({viewport:{width,height}});await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [stage,query] of stages){
  const key=`${engine}-${width}x${height}-${textSize}-${stage}`;
  await page.goto(`${base}/tests/fixtures/app-layout.html?view=home&textSize=${textSize}${query}`);await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
  if(process.env.EVERWISE_QA_SYSTEM_SCALE)await page.evaluate(scale=>{const r=document.documentElement;r.dataset.systemTextCategory='emulated';r.style.setProperty('--system-text-scale',String(scale));r.style.setProperty('--system-title-scale','2');r.dataset.expandedText='true';},Number(process.env.EVERWISE_QA_SYSTEM_SCALE));
  await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const layout=await page.evaluate(()=>{
   const root=document.querySelector('.today-content'),badges=root.querySelector('.today-badges'),badgesRect=badges.getBoundingClientRect();
   const outside=[...root.querySelectorAll('button,h1,h2,p,strong,span')].filter(el=>{if(!el.getClientRects().length||el.classList.contains('sr-only'))return false;const r=el.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1||el.scrollWidth>el.clientWidth+2);}).map(el=>({text:el.textContent.slice(0,100),class:el.className,w:el.clientWidth,scroll:el.scrollWidth}));
   return {outside,contentHeight:root.getBoundingClientRect().height,badges:badgesRect.toJSON(),lesson:root.querySelector('.today-learning').getBoundingClientRect().toJSON(),headingCount:root.querySelectorAll('h1').length,countTop:root.querySelector('.today-lesson-count strong').getBoundingClientRect().top,badgeCountTop:badges.querySelector('strong').getBoundingClientRect().top,progressColumns:getComputedStyle(root.querySelector('.today-progress-rows')).gridTemplateColumns.split(' ').length,secondaryGap:root.querySelector('.today-progress').getBoundingClientRect().top-root.querySelector('.today-tools').getBoundingClientRect().bottom};
  });assert.deepEqual(layout.outside,[],key);assert.equal(layout.headingCount,1);if(layout.progressColumns===2)assert.ok(Math.abs(layout.countTop-layout.badgeCountTop)<2,key+' count baselines');assert.ok(layout.secondaryGap>=19&&layout.secondaryGap<=25,key+' section spacing');
  await page.screenshot({path:path.join(out,key+'-entry.png')});
  const route=page.locator('.today-learning').getByRole('button',{name:stage==='complete'?'Review course':'View course',exact:true});
  await route.click();assert.equal((await page.evaluate(()=>window.__courseQA.actions)).at(-1).kind,'path');
  if(stage==='failure'){
   await page.locator('.today-learning .btn-primary').click();await page.getByRole('alert').waitFor();assert.ok(await page.locator('.today-learning .btn-primary').isEnabled());
   await page.getByRole('alert').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,key+'-error.png')});
  }
  for(const [selector,kind] of [['.today-checker','checker'],['.today-badges','badges']]){
   const button=page.locator(selector);await button.scrollIntoViewIfNeeded();const target=await button.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{width:r.width,height:r.height,hit:el===hit||el.contains(hit)};});assert.ok(target.width>=44&&target.height>=44&&target.hit,key+' '+selector+JSON.stringify(target));await button.click();assert.equal((await page.evaluate(()=>window.__courseQA.actions)).at(-1).kind,kind);
  }
  if(stage==='complete')assert.equal(await page.locator('.today-lesson-count strong').textContent(),String(lessonsByOrder.length));
  assert.deepEqual(errors,[],key);results.push({key,layout,passed:true});console.log('PASS',key);
 }
 await context.close();
 }}finally{await browser.close();}
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(`PASS ${results.length} Home journeys`);
