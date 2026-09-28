// Isolated fixture: native-priced and browser-priced offers never call providers.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium,webkit}=createRequire(import.meta.url)(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8914';
const out=path.resolve(process.env.EVERWISE_PAYWALL_EVIDENCE||'../qa-paywall-recovery/layouts');await mkdir(out,{recursive:true});const results=[];
for(const engine of ['chromium','webkit']) {
 const browser=await ({chromium,webkit}[engine]).launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}:{});
 try {for(const [width,height] of [[320,568],[402,874],[874,402],[744,1133],[1133,744],[1440,900]]) for(const textSize of ['size-2','size-10']) {
  const context=await browser.newContext({viewport:{width,height}});await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const platform of ['native','web']) for(const scenario of ['available','returning','unavailable','long-price','sponsored']) {
   await page.goto(`${base}/tests/fixtures/paywall-layout.html?platform=${platform}&scenario=${scenario}&textSize=${textSize}&interactive=true`);await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
   if(process.env.EVERWISE_QA_SYSTEM_SCALE) await page.evaluate(scale=>{
    const root=document.documentElement;root.dataset.expandedText='true';root.dataset.systemTextCategory='emulated';root.style.setProperty('--system-text-scale',String(scale));root.style.setProperty('--system-title-scale','2');
   },Number(process.env.EVERWISE_QA_SYSTEM_SCALE));
   const id=`${engine}-${width}x${height}-${textSize}-${platform}-${scenario}`;
   // Read to the bottom, then dismiss without scrolling back to the top.
   await page.locator('.paywall-footer').evaluate(el=>el.scrollIntoView({block:'end'}));
   await page.waitForTimeout(50);
   const geometry=await page.evaluate(()=>{
    const root=document.querySelector('.release-paywall'),close=document.querySelector('.subscription-close'),r=close.getBoundingClientRect();
    const bad=[...root.querySelectorAll('button,h1,h2,p,[role=radio]')].filter(el=>{const r=el.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5||el.scrollWidth>el.clientWidth+1;}).map(el=>el.textContent);
    return {close:{x:r.x,y:r.y,width:r.width,height:r.height},hit:close.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),outside:bad,documentScroll:scrollY,innerScroll:root.scrollTop};
   });
   assert.ok(geometry.close.y>=0 && geometry.close.y+geometry.close.height<=height,`${id} Close outside viewport`);
   assert.ok(geometry.close.width>=44 && geometry.close.height>=44,`${id} Close touch target`);assert.ok(geometry.hit,`${id} Close obscured`);assert.deepEqual(geometry.outside,[],`${id} overflow`);
   await page.screenshot({path:path.join(out,id+'.png')});
   // Coordinates prove it was already visible; locator.click could silently scroll it back.
   await page.mouse.click(geometry.close.x+geometry.close.width/2,geometry.close.y+geometry.close.height/2);
   assert.equal(await page.evaluate(()=>window.__paywallQA.calls.at(-1)?.name),'exit',`${id} Close callback`);assert.deepEqual(errors,[]);
   results.push({engine,width,height,textSize,systemScale:process.env.EVERWISE_QA_SYSTEM_SCALE||null,platform,scenario,geometry,screenshot:id+'.png',passed:true});
  }
  await context.close();await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(`PASS ${engine} ${width}x${height} ${textSize}`);
 }}finally{await browser.close();}
}
console.log(`PASS ${results.length} bottom-of-paywall dismissal journeys`);
