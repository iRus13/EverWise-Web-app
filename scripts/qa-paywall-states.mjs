// Isolated subscription interaction and layout proof. No payment provider calls.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.EVERWISE_QA_BASE || 'http://127.0.0.1:8870';
const output=path.resolve(process.env.EVERWISE_PAYWALL_EVIDENCE || '../qa-paywall-refinement/states');
await mkdir(output,{recursive:true});
const results=[];
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}:{headless:true});
 try {
  for(const [width,height] of [[320,568],[390,844],[844,390],[768,1024],[1024,768],[1440,900]]) for(const size of ['size-2','size-10']) {
   const context=await browser.newContext({viewport:{width,height}});
   await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const prefix=`${engine}-${width}x${height}-${size}`;
   async function visit(platform,scenario='') {
    await page.goto(`${base}/tests/fixtures/paywall-layout.html?platform=${platform}&scenario=${scenario}&textSize=${size}&interactive=true`);
    await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
   }
   async function capture(state) {
    // Validate actual painted text and controls, not utility class names.
    const feedback=page.locator('.subscription-error, .subscription-status');
    if(await feedback.count()) {
     await page.waitForFunction(()=>[...document.querySelectorAll('.subscription-error,.subscription-status')].every(el=>{
      const r=el.getBoundingClientRect();return r.top>=-1 && r.top<innerHeight && (r.height>innerHeight || r.bottom<=innerHeight+1);
     }));
    }
    const geometry=await page.evaluate(()=>{
     const root=document.querySelector('.release-paywall');
     const outside=[...root.querySelectorAll('button,[role=radio],h1,h2,p')].filter(el=>{
      const r=el.getBoundingClientRect();return r.left < -1 || r.right > innerWidth+1 || el.scrollWidth>el.clientWidth+1;
     }).map(el=>el.textContent);
     const small=[...root.querySelectorAll('button')].filter(el=>{const r=el.getBoundingClientRect();return r.height<44 || r.width<44;}).map(el=>el.textContent);
     const broken=[];
     for(const el of root.querySelectorAll('h1,h2,.subscription-plan-name,button:not([role=radio])')) {
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
      while((node=walker.nextNode())) for(const match of node.textContent.matchAll(/[A-Za-z]+/g)) {
       const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
       if(new Set([...range.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top))).size>1) broken.push(match[0]);
      }
     }
     return {outside,small,broken,mainCount:document.querySelectorAll('main').length};
    });
    assert.deepEqual(geometry.outside,[],`${prefix} ${state} overflow`);
    assert.deepEqual(geometry.small,[],`${prefix} ${state} targets`);
    assert.deepEqual(geometry.broken,[],`${prefix} ${state} broken words`);
    assert.equal(geometry.mainCount,1);
    assert.deepEqual(errors,[]);
    const filename=`${prefix}-${state}.png`;await page.screenshot({path:path.join(output,filename)});
    results.push({engine,width,height,size,state,geometry,screenshot:filename});
   }
   for(const platform of ['native','web']) {
    await visit(platform);
    const monthly=page.getByRole('radio',{name:/Monthly/}), annual=page.getByRole('radio',{name:/Annual/});
    await monthly.focus();await page.keyboard.press('ArrowDown');
    assert.equal(await annual.getAttribute('aria-checked'),'true');
    assert.equal(await annual.evaluate(el=>el===document.activeElement),true);
    const focus=await annual.evaluate(el=>({style:getComputedStyle(el).outlineStyle,width:parseFloat(getComputedStyle(el).outlineWidth)}));
    assert.ok(focus.style!=='none'&&focus.width>=2);
    const before=await annual.boundingBox();await page.keyboard.press('Home');const after=await annual.boundingBox();
    assert.equal(after.height,before.height);assert.equal(after.width,before.width);
    await page.keyboard.press('End');
    const cta=page.locator('.paywall-cta');await cta.click();
    assert.equal(await cta.isDisabled(),true);
    assert.match(await page.getByRole('status').innerText(),platform==='native'?/Waiting for the App Store/:/Opening secure checkout/);
    assert.deepEqual(await page.evaluate(()=>window.__paywallQA.calls),[{name:'purchase',value:'annual'}]);
    await capture(`${platform}-purchase-pending`);
    await page.evaluate(()=>window.__paywallQA.settle('error'));
    await page.getByRole('alert').waitFor();await capture(`${platform}-purchase-error`);
    await cta.click();await page.evaluate(()=>window.__paywallQA.settle('cancel'));
    await page.waitForFunction(()=>!document.querySelector('.paywall-cta').disabled);
    assert.equal(await page.getByRole('alert').count(),0);
    if(platform==='native') {
     await page.getByRole('button',{name:'Restore',exact:true}).click();await capture('native-restore-pending');
     await page.evaluate(()=>window.__paywallQA.settle('error'));await page.getByRole('alert').waitFor();await capture('native-restore-error');
     await page.getByRole('button',{name:'Restore',exact:true}).click();await page.evaluate(()=>window.__paywallQA.settle('ok'));
     await page.getByText('Purchase restored.',{exact:true}).waitFor();await capture('native-restored');
    }
    await page.getByRole('button',{name:'Open free introduction',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__paywallQA.calls.at(-1).name),'introduction');
    await visit(platform,'returning');assert.equal(await page.getByRole('button',{name:'Continue with monthly',exact:true}).count(),1);
    await page.locator('.release-paywall').evaluate(el=>el.scrollTop=0);await capture(`${platform}-returning`);
    await visit(platform,'unavailable');await page.getByRole('button',{name:'Retry',exact:true}).click();
    await page.getByText('Loading subscription options…',{exact:true}).waitFor();await capture(`${platform}-unavailable-retry`);
    await page.evaluate(()=>window.__paywallQA.settle('error'));await page.getByRole('alert').waitFor();await capture(`${platform}-unavailable-error`);
   }
   await visit('native','long-price');await page.locator('.paywall-cta').scrollIntoViewIfNeeded();await capture('native-long-price');
   await context.close();console.log(`PASS ${prefix}`);
   await writeFile(path.join(output,'summary.json'),JSON.stringify(results,null,2));
  }
 }finally{await browser.close();}
}
console.log(`PASS ${results.length} state captures`);
