import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE || '/Users/qwertyx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.EVERWISE_QA_BASE || 'http://127.0.0.1:8914';
const out=process.env.EVERWISE_INSTALL_EVIDENCE || '../qa-install-help/browser';
await mkdir(out,{recursive:true});
const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try {
  for(const [width,height] of [[320,568],[402,874],[768,1024],[1032,1376],[1376,1032],[1440,900]])for(const size of ['size-2','size-10'])for(const platform of ['ios','android'].filter(p=>!process.env.EVERWISE_INSTALL_PLATFORM || p===process.env.EVERWISE_INSTALL_PLATFORM)){
   const page=await browser.newPage({viewport:{width,height},userAgent:platform==='ios'?'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1':'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36'});
   await page.addInitScript(platform=>{Object.defineProperty(navigator,'standalone',{value:platform==='ios'?false:undefined,configurable:true});},platform);
   await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
   await page.goto(`${base}/tests/fixtures/app-layout.html?view=home&pathAt=welcome&textSize=${size}`);
   await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
   const key=`${engine}-${width}-${size}-${platform}`;
   const details=page.locator('.install-help'),summary=details.locator('summary');
   assert.equal(await details.getAttribute('open'),null);
   assert.equal(await page.evaluate(()=>Boolean(document.querySelector('.today-learning').compareDocumentPosition(document.querySelector('.install-help')) & Node.DOCUMENT_POSITION_FOLLOWING)),true);
   await page.screenshot({path:`${out}/${key}-home.png`});
   await summary.scrollIntoViewIfNeeded();await summary.focus();await page.keyboard.press('Enter');
   assert.equal(await details.getAttribute('open'),'');
   const r=await summary.boundingBox();assert.ok(r.width>=44&&r.height>=44&&r.x>=0&&r.x+r.width<=width);
   if(platform==='ios')assert.equal(await details.locator('li').count(),3);
   for(const state of platform==='android'?['expanded','pending','cancelled','error']:['expanded']){
    if(state==='pending'){
     await page.evaluate(()=>{window.installCalls=0;const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=()=>{window.installCalls++;return Promise.resolve();};e.userChoice=new Promise(resolve=>{window.resolveInstall=resolve;});window.dispatchEvent(e);});
     await page.getByRole('button',{name:'Install app',exact:true}).click();
     assert.equal(await page.getByRole('button',{name:'Opening installation…'}).isDisabled(),true);
     assert.equal(await page.evaluate(()=>window.installCalls),1);
    }else if(state==='cancelled'){
     await page.evaluate(()=>window.resolveInstall({outcome:'dismissed'}));
     await page.getByRole('button',{name:'Opening installation…'}).waitFor({state:'detached'});
     assert.equal(await page.evaluate(()=>localStorage.getItem('everwise-a2hs-dismissed')),null);
     assert.equal(await summary.evaluate(el=>el===document.activeElement),true);
    }else if(state==='error'){
     await page.evaluate(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=()=>Promise.reject(new Error('synthetic install failure'));e.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(e);});
     await page.getByRole('button',{name:'Install app',exact:true}).click();await page.getByRole('alert').waitFor();
     const r=await page.getByRole('alert').boundingBox();assert.ok(r.y>=-1&&r.y+r.height<=height+1,`error visible ${key}: ${JSON.stringify(r)}`);
    }
    const data=await page.evaluate(()=>window.__everwiseVisualQA.measure());
    for(const field of ['outside','small','unreachable','errors'])assert.deepEqual(data[field],[],`${key} ${state} ${field}`);
    await summary.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${key}-${state}.png`});
    results.push({key,state,passed:true});
   }
   await page.getByRole('button',{name:'Don’t show this again'}).click();await details.waitFor({state:'detached'});
   await page.reload();await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');assert.equal(await page.locator('.install-help').count(),0);
   await page.getByRole('button',{name:'Start lesson: Welcome to Everwise',exact:true}).click();
   assert.ok((await page.evaluate(()=>window.__courseQA.actions)).some(x=>x.kind==='lesson' && x.value==='welcome'));
   console.log('PASS',key);await page.close();
  }
 }finally{await browser.close();}
}
await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
console.log('PASS',results.length,'installation layout and recovery states');
