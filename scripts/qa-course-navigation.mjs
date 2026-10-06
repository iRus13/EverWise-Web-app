import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {lessonsByOrder} from '../src/data/course-catalog.js';
const require=createRequire(import.meta.url),engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8914';
assert.equal(new URL(base).hostname,'127.0.0.1');
const out=path.resolve(process.env.EVERWISE_COURSE_EVIDENCE||'../qa-course-navigation/browser');await mkdir(out,{recursive:true});const results=[];
const later=lessonsByOrder.find(x=>x.phase===8).id;
async function targetVisible(locator,context) {
 const state=await locator.evaluate(el=>{
  const r=el.getBoundingClientRect();let top=0,bottom=innerHeight,left=0,right=innerWidth;
  for(let p=el.parentElement;p;p=p.parentElement){const css=getComputedStyle(p),b=p.getBoundingClientRect();if(/^(auto|scroll|hidden|clip)$/.test(css.overflowY)){top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);}if(/^(auto|scroll|hidden|clip)$/.test(css.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right);}}
  const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return {visible:r.top>=top-1&&r.bottom<=bottom+1&&r.left>=left-1&&r.right<=right+1,hit:el===hit||el.contains(hit),height:r.height,width:r.width,rect:r.toJSON(),clip:{top,bottom,left,right}};
 });
 assert.ok(state.visible&&state.hit&&state.height>=44&&state.width>=44,context+' '+JSON.stringify(state));
 return state;
}
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try { for(const [width,height] of [[320,568],[390,844],[667,375],[768,1024],[1024,768],[1366,900]]) for(const textSize of ['size-2','size-10']) {
  const context=await browser.newContext({viewport:{width,height}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const stage of ['welcome',later,'all']) {
   const key=`${engine}-${width}x${height}-${textSize}-${stage}`;
   await page.goto(`${base}/tests/fixtures/app-layout.html?view=path&pathAt=${stage}&textSize=${textSize}`);
   await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
   const home=page.getByRole('button',{name:'Back to home',exact:true});
   await targetVisible(home,key+' Home on entry');
   const current=page.locator('[aria-current=step]'),locate=page.getByRole('button',{name:'Find your current step',exact:true});
   if(stage!=='all') {
    await targetVisible(locate,key+' current shortcut on entry');
    await page.locator('.course-phase-current .course-phase-toggle').click();
    assert.equal(await page.locator('.course-phase-current .course-phase-toggle').getAttribute('aria-expanded'),'false');
   } else assert.equal(await locate.count(),0);
   await page.mouse.move(width-40,height-90);await page.mouse.wheel(0,100000);await page.waitForTimeout(150);
   await targetVisible(home,key+' Home after scrolling');
   if(stage!=='all') {
    await targetVisible(locate,key+' current shortcut after scrolling');await locate.click();
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-current')==='step');
    assert.equal(await page.locator('.course-phase-current .course-phase-toggle').getAttribute('aria-expanded'),'true');
    assert.deepEqual(await page.evaluate(()=>window.__courseQA.actions),[],'Locating must not start the activity');
    const visibility=await current.evaluate(el=>{const r=el.getBoundingClientRect(),t=document.querySelector('.course-path-toolbar').getBoundingClientRect();return Math.min(r.bottom,innerHeight)-Math.max(r.top,t.bottom)});
    assert.ok(visibility>=44,key+' current activity visible below toolbar');
    await page.screenshot({path:path.join(out,key+'-located.png')});
    await page.keyboard.press('Enter');assert.equal((await page.evaluate(()=>window.__courseQA.actions)).at(-1).value,stage);
   }
   await targetVisible(home,key+' Home after locating');await home.click();
   assert.equal((await page.evaluate(()=>window.__courseQA.actions)).at(-1).kind,'home');
   assert.deepEqual(errors,[],key);results.push({key,passed:true});console.log('PASS',key);
  }
  await context.close();
 }}finally{await browser.close();}
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(`PASS ${results.length} course navigation journeys`);
