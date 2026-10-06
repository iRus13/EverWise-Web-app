// Exercise only the synthetic partner fixture. Never use an admin link here.
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.EVERWISE_QA_BROWSER||'chromium',base=`http://127.0.0.1:${process.env.EVERWISE_QA_PORT||8902}`;
const out=path.resolve(process.env.EVERWISE_WEB_EVIDENCE||'../qa-partner-refinement/journeys');await mkdir(out,{recursive:true});
const browser=await engines[engine].launch(engine==='chromium'?{headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{headless:true});
const cases=[];
const context=await browser.newContext({acceptDownloads:true});await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
const page=await context.newPage();page.setDefaultTimeout(15000);
let width,height,size;
async function clearOfStatusBar(selector){const g=await page.locator(selector).evaluate(el=>({top:el.getBoundingClientRect().top,inset:parseFloat(getComputedStyle(document.querySelector('.app-viewport')).paddingTop)||0,ancestorScroll:[...document.querySelectorAll('.app-viewport,.app-shell,.app-canvas')].map(e=>e.scrollTop)}));assert.ok(g.top>=g.inset,JSON.stringify(g));assert.ok(g.ancestorScroll.every(x=>x===0),JSON.stringify(g));}
const button=name=>page.getByRole('button',{name,exact:true});
async function go(state){await page.goto(`${base}/tests/fixtures/partner-dashboard.html?state=${state}&textSize=${size}`);await page.waitForFunction(()=>document.body.dataset.extraReady==='true');if(process.env.EVERWISE_QA_NATIVE_SHELL==='1')await page.evaluate(()=>{const v=document.querySelector('.app-viewport');v.classList.add('is-native-app');v.style.setProperty('--native-window-top','63px');});}
async function capture(state,selector){
 if(selector)await page.locator(selector).first().evaluate(el=>{const pane=el.closest('.partner-dashboard');if(pane&&/^(auto|scroll)$/.test(getComputedStyle(pane).overflowY))pane.scrollTop+=el.getBoundingClientRect().top-pane.getBoundingClientRect().top-16;else window.scrollBy(0,el.getBoundingClientRect().top-parseFloat(getComputedStyle(document.querySelector('.app-viewport')).paddingTop)-16);});
 const data=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,mainCount:document.querySelectorAll('main').length,
  errors:document.body.dataset.qaError||null,focus:document.activeElement?.textContent||document.activeElement?.getAttribute('id'),
  clippedTables:[...document.querySelectorAll('table')].filter(el=>el.getBoundingClientRect().right>innerWidth+1||el.getBoundingClientRect().left< -1).length,
  small:[...document.querySelectorAll('button,input')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44;}).length,
  brokenWords:[...document.querySelectorAll('tbody th')].flatMap(el=>{const errors=[];const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);for(let n=walker.nextNode();n;n=walker.nextNode())for(const m of n.textContent.matchAll(/[\p{L}\p{N}]+/gu)){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);if(new Set([...r.getClientRects()].map(x=>Math.round(x.top))).size>1)errors.push(m[0]);}return errors;}),calls:[...window.__partnerQA.calls]}));
 assert.ok(data.scrollWidth<=width+1,JSON.stringify(data));assert.equal(data.mainCount,1);assert.equal(data.clippedTables,0);assert.equal(data.small,0);assert.equal(data.errors,null);assert.deepEqual(data.brokenWords,[]);
 const file=`${width}x${height}-${size}-${state}.png`;await page.screenshot({path:path.join(out,file)});cases.push({state,width,height,size,...data,screenshot:file});
}
try{
 for([width,height] of [[320,568],[390,844],[834,1194],[1440,900]])for(size of ['size-2','size-10']){
  await page.setViewportSize({width,height});await go('ready');await capture('overview');
  assert.equal(await page.getByRole('table').count(),9);await capture('table','table');
  const downloadPromise=page.waitForEvent('download');await button('Download aggregate CSV').click();const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'everwise-partner-report.csv');const csv=await readFile(await download.path(),'utf8');
  assert.ok(csv.startsWith('metric,category,count,percentage\n'));assert.ok(csv.includes('seats,claimed,18,3.6'));assert.ok(!csv.includes('Q'.repeat(43)));await writeFile(path.join(out,`${width}-${size}.csv`),csv);
  await button('Learner invitation').click();await page.waitForFunction(()=>document.querySelector('#learner-link-title').getBoundingClientRect().bottom<innerHeight-44);assert.equal(await page.locator('#learner-link-title').evaluate(el=>el===document.activeElement),true);
  await clearOfStatusBar('#learner-link-title');if(size==='size-2')assert.ok(await button('Replace learner link').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
  await button('Replace learner link').click();await page.waitForFunction(()=>document.querySelector('.partner-dashboard-confirmation h3').getBoundingClientRect().bottom<innerHeight-44);assert.equal(await page.getByRole('heading',{name:'Replace learner link?'}).evaluate(el=>el===document.activeElement),true);await clearOfStatusBar('.partner-dashboard-confirmation h3');await capture('confirm','.partner-dashboard-confirmation');
  await button('Cancel').click();assert.equal(await button('Replace learner link').evaluate(el=>el===document.activeElement),true);assert.equal(await page.evaluate(()=>__partnerQA.calls.filter(x=>x==='rotate').length),0);
  await page.evaluate(()=>__partnerQA.rotationMode='pending');await button('Replace learner link').click();await button('Replace link now').click();await button('Replacing…').waitFor();await page.waitForFunction(()=>__partnerQA.calls.filter(x=>x==='rotate').length===1);
  await button('Replacing…').evaluate(el=>el.click());assert.equal(await page.evaluate(()=>__partnerQA.calls.filter(x=>x==='rotate').length),1);await capture('pending','.partner-dashboard-confirmation');
  await page.evaluate(()=>__partnerQA.finishRotation());await page.getByLabel('Replacement learner link').waitFor();assert.equal(await page.getByLabel('Replacement learner link').evaluate(el=>el===document.activeElement),true);
  assert.equal(await page.locator('time').getAttribute('datetime'),'2026-09-20T00:00:00.000Z');await capture('revealed','.partner-dashboard-replacement');
  await button('Copy replacement link').click();assert.ok((await page.evaluate(()=>__partnerQA.copied)).endsWith('#partner='+'r'.repeat(43)));await capture('copied','.partner-dashboard-replacement');
  await go('copy-failed');await page.getByText('Select the link and copy it manually.').waitFor();assert.equal(await page.getByLabel('Replacement learner link').evaluate(el=>el.selectionEnd-el.selectionStart),await page.getByLabel('Replacement learner link').inputValue().then(s=>s.length));await capture('copy-failed','.partner-dashboard-replacement');
  await go('rotation-error');await button('Review replacement').waitFor();await capture('uncertain','.partner-dashboard-confirmation');
  await button('Review replacement').click();await button('Cancel').click();assert.equal(await page.evaluate(()=>__partnerQA.calls.filter(x=>x==='rotate').length),1);
  await page.evaluate(()=>__partnerQA.rotationMode='success');await button('Replace learner link').click();await button('Replace link now').click();await page.getByLabel('Replacement learner link').waitFor();assert.equal(await page.evaluate(()=>__partnerQA.calls.filter(x=>x==='rotate').length),2);
  await go('report-error');await page.getByText('The report could not be loaded. Please try again.').waitFor();await capture('report-error');await page.evaluate(()=>__partnerQA.reportMode='ready');await button('Try loading report again').click();await button('Replace learner link').waitFor();assert.equal(await page.evaluate(()=>__partnerQA.calls.filter(x=>x==='report').length),2);await capture('report-recovered');
  await go('suppressed');assert.equal(await page.getByRole('table').count(),0);await capture('suppressed','.partner-dashboard-threshold');
  await go('download-error');await capture('download-error','.partner-dashboard-feedback');
  console.log(`PASS ${width}x${height} ${size}: report, tables, export, cancel, replace, copy, recovery`);
 }
}finally{await browser.close();await writeFile(path.join(out,'summary.json'),JSON.stringify({engine,cases},null,2));}
console.log(`PASS ${cases.length} interactive captures`);
