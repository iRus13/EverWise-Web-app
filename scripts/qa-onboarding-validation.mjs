// Real onboarding components in the isolated loopback lab; no account submitted.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.EVERWISE_QA_BASE || 'http://127.0.0.1:8914';
assert.equal(new URL(base).hostname,'127.0.0.1');
const output=path.resolve(process.env.EVERWISE_VALIDATION_EVIDENCE || '../qa-native-journeys/browser-validation');
await mkdir(output,{recursive:true});
const results=[];
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try {
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:667,height:375},{width:768,height:1024},{width:1366,height:900}]) for(const size of ['size-2','size-10']) {
   const context=await browser.newContext({viewport});
   await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const key=`${engine}-${viewport.width}x${viewport.height}-${size}`;
   const checks=[];
   async function focused(id) {
    await page.waitForFunction(id=> {
     const group=document.getElementById(id);
     const el=group.matches('input')?group:group.querySelector('[role=radio],[role=checkbox]');
     if(document.activeElement!==el)return false;
     let top=0,bottom=innerHeight;
     for(let p=el.parentElement;p;p=p.parentElement) {
      if(!/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(p).overflowY))continue;
      const r=p.getBoundingClientRect();top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);
     }
     const r=el.getBoundingClientRect();
     return r.top>=top-1&&r.bottom<=bottom+1&&r.left>=0&&r.right<=innerWidth;
    },id,{timeout:3000});
    checks.push(id);
   }
   try {
    await page.goto(`${base}/tests/fixtures/app-layout.html?view=interview&textSize=${size}`);
    await page.waitForFunction(()=>document.body.dataset.geometryReady);
    await page.getByRole('button',{name:'Start',exact:true}).click();
    await focused('profile-name');
    await page.getByLabel('What should we call you?').fill('QA Test');
    await page.getByRole('button',{name:'Start',exact:true}).click();
    await focused('profile-age');
    await page.getByLabel('Your age').fill('68');
    await page.getByRole('button',{name:'Start',exact:true}).click();
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await focused('profile-internetUse');
    await page.getByRole('radio',{name:'Every day',exact:true}).click();
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await focused('profile-primaryDevice');
    assert.equal(await page.getByRole('radio',{name:'Smartphone',exact:true}).getAttribute('aria-checked'),'false');
    await page.screenshot({path:path.join(output,`${key}-missing-device.png`)});
    for(const id of ['confidence','concerns','scamScenario','aiExperience','trustedContact']) {
     await page.getByRole('button',{name:'Skip',exact:true}).click();
     await page.getByRole('button',{name:'Continue',exact:true}).click();
     await focused(`profile-${id}`);
    }
    await page.screenshot({path:path.join(output,`${key}-trusted-person.png`)});
    await page.getByRole('button',{name:'Skip',exact:true}).click();
    await page.getByRole('button',{name:'Build my plan',exact:true}).click();
    await focused('profile-username');
    await page.getByLabel('Username',{exact:true}).fill('qa_test');
    await page.getByRole('button',{name:'Build my plan',exact:true}).click();
    await focused('profile-password');
    assert.deepEqual(errors,[]);
    results.push({key,checks,errors,passed:true});
    console.log(`PASS ${key}: ${checks.length} missing-answer targets focused and visible`);
   } catch(error) {
    await page.screenshot({path:path.join(output,`${key}-failure.png`)});
    results.push({key,checks,errors,passed:false,error:String(error)});
    console.log(`FAIL ${key}: ${error.message}`);
   } finally {await context.close();}
  }
 } finally {await browser.close();}
}
await writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
assert.equal(results.filter(r=>!r.passed).length,0);
