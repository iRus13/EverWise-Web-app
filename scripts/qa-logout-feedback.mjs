import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const engines=createRequire(import.meta.url)(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8914';
const out=path.resolve(process.env.EVERWISE_LOGOUT_EVIDENCE||'../qa-logout-recovery/layouts');await mkdir(out,{recursive:true});const results=[];
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try {for(const [width,height] of [[320,568],[402,874],[874,402],[744,1133],[1133,744],[1440,900]])for(const size of ['size-2','size-10']){
  const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  for(const view of ['settings','partner-account','partner-cleanup','partner-profile'])for(const state of (process.env.EVERWISE_LOGOUT_STATE?[process.env.EVERWISE_LOGOUT_STATE]:['pending','slow','error'])){
   await page.goto(`${base}/tests/fixtures/app-layout.html?view=${view}&textSize=${size}&logout=${state}`);await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');await page.locator('.logout-feedback').waitFor();await page.evaluate(()=>document.fonts.ready);
   if(process.env.EVERWISE_QA_SYSTEM_SCALE)await page.evaluate(scale=>{const r=document.documentElement;r.dataset.expandedText='true';r.dataset.systemTextCategory='emulated';r.style.setProperty('--system-text-scale',String(scale));r.style.setProperty('--system-title-scale','2');},Number(process.env.EVERWISE_QA_SYSTEM_SCALE));
   await page.locator('.logout-feedback').evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(80);
   const geometry=await page.evaluate(()=>{
    const el=document.querySelector('.logout-feedback'),r=el.getBoundingClientRect();let top=0,bottom=innerHeight;
    for(let p=el.parentElement;p;p=p.parentElement)if(/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(p).overflowY)){const b=p.getBoundingClientRect();top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);}
    return {feedback:r.toJSON(),top,bottom,outside:[...document.querySelectorAll('h1,h2,p,button')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.left<-.5||b.right>innerWidth+.5||e.scrollWidth>e.clientWidth+1);}).map(e=>e.textContent)};
   });
   const id=`${engine}-${width}x${height}-${size}-${view}-${state}`;
   assert.deepEqual(geometry.outside,[],id+' horizontal overflow');assert(geometry.feedback.bottom>geometry.top&&geometry.feedback.top<geometry.bottom,id+' hidden feedback');
   const logout=page.getByRole('button',{name:'Log out',exact:true});assert.equal(await logout.isDisabled(),state!=='error');assert.match(await logout.getAttribute('aria-describedby'),/.+/);assert.equal(await page.locator('.logout-feedback').getAttribute('role'),state==='error'?'alert':'status');
   await page.screenshot({path:path.join(out,id+'.png')});assert.deepEqual(errors,[]);results.push({engine,width,height,size,view,state,systemScale:process.env.EVERWISE_QA_SYSTEM_SCALE||null,geometry,screenshot:id+'.png',passed:true});
  }
  await page.close();await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('PASS',engine,width,height,size);
 }}finally{await browser.close();}
}
console.log('PASS',results.length,'logout feedback layouts');
