// Local synthetic Settings confirmation only. Never submit account deletion.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const engines=createRequire(import.meta.url)(process.env.EVERWISE_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.EVERWISE_QA_BASE || 'http://127.0.0.1:8914';
assert.equal(new URL(base).hostname,'127.0.0.1');
const out=path.resolve(process.env.EVERWISE_DELETION_EVIDENCE || '../qa-deletion-billing/browser');await mkdir(out,{recursive:true});
const results=[];
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try {
  for(const [width,height] of [[320,568],[390,844],[844,390],[768,1024],[1024,768],[1440,900]]) for(const size of ['size-2','size-10']) for(const mode of ['web-public','native-public','web-sponsored','native-sponsored']) {
   const page=await browser.newPage({viewport:{width,height}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
   await page.addInitScript(()=>{window.__openCalls=[];window.open=(...args)=>{window.__openCalls.push(args);return null;};});
   const native=mode.startsWith('native'),sponsor=mode.endsWith('sponsored');
   await page.goto(`${base}/tests/fixtures/app-layout.html?view=${sponsor?'settings-sponsored':'settings'}&textSize=${size}&settingsPlatform=${native?'native':'web'}`);
   await page.getByRole('button',{name:'Delete account',exact:true}).click();
   assert(await page.getByText('Deleting your account does not stop Apple billing.',{exact:false}).isVisible());
   const copy=await page.locator('.settings-delete-confirmation').innerText();
   assert(!copy.includes('so you will not be billed again'));
   assert.equal(copy.includes('If cancellation fails, your account is kept.'),!native&&!sponsor);
   const prefix=`${engine}-${width}x${height}-${size}-${mode}`;
   await page.screenshot({path:path.join(out,prefix+'-notice.png')});
   const small=await page.locator('.settings-delete-confirmation button').evaluateAll(els=>els.map(el=>({label:el.textContent.trim(),w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})).filter(r=>r.w<44||r.h<44));assert.deepEqual(small,[]);
   const broken=await page.locator('.settings-delete-billing button').evaluate(button=>{
    const result=[],walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {
     const node=walker.currentNode;
     for(const match of node.textContent.matchAll(/\S+/g)) {
      const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
      if(new Set([...range.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top))).size>1)result.push(match[0]);
     }
    }
    return result;
   });assert.deepEqual(broken,[],prefix+' broken button words');
   const overflow=await page.locator('.settings-delete-confirmation').evaluate(el=>({box:el.getBoundingClientRect().toJSON(),width:innerWidth,scroll:el.scrollWidth,client:el.clientWidth}));assert(overflow.box.left>=-1&&overflow.box.right<=overflow.width+1);assert(overflow.scroll<=overflow.client+1);
   const manage=page.getByRole('button',{name:'Open Apple billing',exact:true});await manage.click();
   assert.deepEqual(await page.evaluate(()=>window.__openCalls),[['https://apps.apple.com/account/subscriptions','_blank','noopener,noreferrer']]);
   await page.screenshot({path:path.join(out,prefix+'-management.png')});
   assert(await page.getByRole('heading',{name:'Delete your account?',exact:true}).isVisible());
   await page.getByLabel('Current password',{exact:true}).fill('synthetic-not-submitted');
   assert(await page.getByRole('button',{name:'Yes, delete',exact:true}).isEnabled());
   await page.getByRole('button',{name:'Cancel',exact:true}).click();
   assert(await page.getByRole('button',{name:'Delete account',exact:true}).evaluate(el=>el===document.activeElement));
   await page.getByRole('button',{name:'Delete account',exact:true}).click();
   assert.equal(await page.getByLabel('Current password',{exact:true}).inputValue(),'');
   assert(await page.getByRole('button',{name:'Yes, delete',exact:true}).isDisabled());
   assert.deepEqual(errors,[]);
   results.push({engine,width,height,size,mode,passed:true});await page.close();
  }
  console.log('PASS',engine,results.filter(x=>x.engine===engine).length);
 } finally {await browser.close();await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));}
}
console.log('PASS',results.length,'confirmation layouts and management/cancel journeys');
