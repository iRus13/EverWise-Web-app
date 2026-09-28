// Synthetic rejected deletion callback only; no account or provider access.
import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const engines=createRequire(import.meta.url)(process.env.EVERWISE_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.EVERWISE_QA_BASE || 'http://127.0.0.1:8914';assert.equal(new URL(base).hostname,'127.0.0.1');
const passwordWait=process.env.EVERWISE_PASSWORD_WAIT === "1";
const out=process.env.EVERWISE_DELETION_RECOVERY_EVIDENCE || '../qa-fresh-token/recovery-layout';await mkdir(out,{recursive:true});const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try{for(const [width,height] of [[320,568],[390,844],[844,390],[768,1024],[1024,768],[1440,900]])for(const size of ['size-2','size-10'])for(const platform of ['web','native']){
  const page=await browser.newPage({viewport:{width,height}});await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  await page.goto(`${base}/tests/fixtures/app-layout.html?view=settings&deleteFailure=${passwordWait?"password":"1"}&settingsPlatform=${platform}&textSize=${size}`);
  await page.getByRole('button',{name:'Delete account',exact:true}).click();await page.getByLabel('Current password',{exact:true}).fill('synthetic-fixture-only');await page.getByRole('button',{name:'Yes, delete',exact:true}).click();
  const alert=page.getByRole('alert');await alert.waitFor();
  await page.waitForFunction(()=>{const el=document.querySelector('.settings-delete-confirmation [role=alert]');if(!el)return false;let top=0,bottom=innerHeight;for(let p=el.parentElement;p;p=p.parentElement){if(/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(p).overflowY)){const r=p.getBoundingClientRect();top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);}}const r=el.getBoundingClientRect();return r.top>=top-1&&r.bottom<=bottom+1;});
  assert.match(await alert.innerText(),passwordWait ? /Password verification took too long. Nothing was deleted/ : /Your account and progress are still here/);assert.equal(await page.getByLabel('Current password',{exact:true}).inputValue(),'');assert(await page.getByRole('button',{name:'Yes, delete',exact:true}).isDisabled());
  const label=`${engine}-${width}x${height}-${size}-${platform}`;await page.screenshot({path:`${out}/${label}.png`});
  await page.getByRole('button',{name:'Cancel',exact:true}).click();assert(await page.getByRole('button',{name:'Delete account',exact:true}).evaluate(el=>el===document.activeElement));
  results.push({engine,width,height,size,platform,messageVisibleWithoutManualScroll:true,passed:true});await page.close();
 }}finally{await browser.close();await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));}
 console.log('PASS recovery layouts',engine,results.filter(x=>x.engine===engine).length);
}
