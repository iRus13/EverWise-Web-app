import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url),engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8914';assert.equal(new URL(base).hostname,'127.0.0.1');
const out=path.resolve('../qa-course-reading/browser');await mkdir(out,{recursive:true});const results=[];
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try {for(const [width,height] of [[320,568],[402,874],[834,1194],[1440,900]])for(const size of ['size-2','size-10'])for(const system of [1,2.823529411764706]) {
  const context=await browser.newContext({viewport:{width,height}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const id of ['online-banking','phase3-challenge','phase3-exam']) {
   const key=`${engine}-${width}x${height}-${size}-${system===1?'standard':'system-max'}-${id}`;
   await page.goto(`${base}/tests/fixtures/app-layout.html?view=path&pathAt=${id}&resumeAssessment=${id}&textSize=${size}`);
   await page.waitForFunction(()=>document.body.dataset.geometryReady==='true');
   if(system>1) {
    await page.evaluate(scale=>{
     const root=document.documentElement;root.style.setProperty('--system-text-scale',String(scale));root.style.setProperty('--system-title-scale','2');root.dataset.expandedText='true';
    },system);
    await page.waitForFunction(()=>document.querySelector('.course-path-toolbar').dataset.compactControls==='true');
   }
   await page.getByRole('button',{name:'Find your current step',exact:true}).click();
   await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-current')==='step');
   const geometry=await page.locator('[aria-current=step]').evaluate(el=>{
    const title=el.querySelector('.course-step-title'),meta=el.querySelector('.course-step-meta'),icon=el.querySelector('.course-step-indicator');
    const t=title.getBoundingClientRect(),m=meta.getBoundingClientRect(),i=icon.getBoundingClientRect();
    const bar=document.querySelector('.course-path-toolbar').getBoundingClientRect();
    return {title:title.textContent,top:t.top,metaTop:m.top,firstLineBottom:t.top+parseFloat(getComputedStyle(title).lineHeight),barBottom:bar.bottom,height:innerHeight,
      titleFont:parseFloat(getComputedStyle(title).fontSize),metaFont:parseFloat(getComputedStyle(meta).fontSize),titleWidth:title.clientWidth,titleScrollWidth:title.scrollWidth,
      iconVisible:i.width>0,overlap:i.width>0&&t.left<i.right&&t.right>i.left&&t.top<i.bottom&&t.bottom>i.top,
      meta:meta.textContent,hyphens:getComputedStyle(title).hyphens};
   });
   assert.ok(geometry.top>=geometry.barBottom-1,key+' title starts beneath navigation');
   assert.ok(geometry.firstLineBottom<=geometry.height+1,key+' first line is on screen');
   assert.ok(geometry.metaTop>geometry.top,key+' title precedes details');
   assert.ok(geometry.titleFont>geometry.metaFont,key+' hierarchy survives text scaling');
   assert.ok(geometry.titleScrollWidth<=geometry.titleWidth+1,key+' full title wraps');
   assert.equal(geometry.overlap,false,key+' indicator cannot overlap title');
   if(system>1)assert.equal(geometry.iconVisible,false,key+' full width at accessibility size');
   assert.match(geometry.meta,/Ready to start|In progress/);
   assert.equal(geometry.hyphens,system>1?'auto':'manual');
   await page.screenshot({path:path.join(out,key+'.png')});
   await page.keyboard.press('Enter');assert.equal((await page.evaluate(()=>window.__courseQA.actions)).at(-1).value,id);
   assert.deepEqual(errors,[],key);results.push({key,passed:true,geometry});
  }
  await context.close();console.log('PASS',engine,width,size,system===1?'standard':'system-max');
 }}finally{await browser.close();}
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(`PASS ${results.length} course reading-order and hierarchy checks`);
