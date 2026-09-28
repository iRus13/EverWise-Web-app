// Real utility screens; local fixtures and synthetic message responses only.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const engines=createRequire(import.meta.url)(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8914';
const out=path.resolve(process.env.EVERWISE_UTILITY_EVIDENCE||'../qa-utility-navigation/layouts');await mkdir(out,{recursive:true});const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try{for(const [width,height] of [[320,568],[402,874],[402,430],[874,402],[744,1133],[1133,744],[1440,900]])for(const size of ['size-2','size-10']){
  const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  await page.route('**/api/check-message',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({verdict:'likely_scam',summary:'Verify the request independently before responding.',warning_signs:['Pressure to act immediately','A request for your private verification code'],next_steps:['Open the organization’s official app yourself.','Call a known number to verify the request.'],urgent_action:'If you already shared a code, contact the organization directly.'})}));
  for(const state of ['settings','settings-delete','settings-error','scam-checker','scam-result']){
   const view=state.startsWith('settings')?'settings':'scam-checker';
   await page.goto(`${base}/tests/fixtures/app-layout.html?view=${view}&textSize=${size}${state==='settings-error'?'&logout=error':''}`);await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');await page.evaluate(()=>document.fonts.ready);
   if(process.env.EVERWISE_QA_SYSTEM_SCALE)await page.evaluate(scale=>{const r=document.documentElement;r.dataset.expandedText='true';r.dataset.systemTextCategory='emulated';r.style.setProperty('--system-text-scale',String(scale));r.style.setProperty('--system-title-scale','2');},Number(process.env.EVERWISE_QA_SYSTEM_SCALE));
   if(state==='settings-delete'){await page.getByRole('button',{name:'Delete account',exact:true}).click();await page.getByLabel('Current password',{exact:true}).fill('synthetic-password');}
   if(state==='scam-result'){await page.getByRole('textbox',{name:'Message to check'}).fill('Synthetic message: send your code now.');await page.getByRole('button',{name:'Check this message',exact:true}).click();await page.locator('.scam-verdict').waitFor();}
   if(state==='scam-checker')await page.getByRole('textbox',{name:'Message to check'}).fill('Synthetic text retained while scrolling.');
   // Scroll the entire reading pane to the end. Navigation must remain usable
   // without a locator click that could automatically scroll it back.
   await page.locator('.'+(view==='settings'?'settings':'scam-checker')+'-screen').evaluate(e=>{e.scrollTop=e.scrollHeight;if(innerWidth>=768)window.scrollTo(0,document.documentElement.scrollHeight);});
   await page.waitForTimeout(70);
   const back=page.getByRole('button',{name:'Back to home',exact:true});const utilityVisible=await back.isVisible();const control=utilityVisible?back:page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'Home',exact:true});
   const geometry=await control.evaluate(el=>{const r=el.getBoundingClientRect();return {rect:r.toJSON(),hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),outside:[...document.querySelectorAll('h1,h2,p,button,input,textarea')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.left<-.5||b.right>innerWidth+.5||(!e.matches("input,textarea")&&e.scrollWidth>e.clientWidth+1));}).map(e=>e.textContent),scroll:document.querySelector('.settings-screen,.scam-checker-screen').scrollTop,documentScroll:scrollY};});
   const id=`${engine}-${width}x${height}-${size}-${state}`;
   assert(geometry.rect.top>=0&&geometry.rect.bottom<=height,id+' navigation offscreen');assert(geometry.hit,id+' navigation obscured');assert(geometry.rect.width>=44&&geometry.rect.height>=44,id+' target');assert.deepEqual(geometry.outside,[],id+' horizontal overflow');
   await page.screenshot({path:path.join(out,id+'.png')});await page.mouse.click(geometry.rect.x+geometry.rect.width/2,geometry.rect.y+geometry.rect.height/2);
   if(utilityVisible)assert.equal(await page.evaluate(()=>window.__courseQA.actions.at(-1)?.kind),'home',id+' Home action');
   assert.deepEqual(errors,[]);results.push({engine,width,height,size,state,systemScale:process.env.EVERWISE_QA_SYSTEM_SCALE||null,geometry,screenshot:id+'.png',passed:true});
  }
  await page.close();await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('PASS',engine,width,height,size);
 }}finally{await browser.close();}
}
console.log('PASS',results.length,'utility navigation cases');
