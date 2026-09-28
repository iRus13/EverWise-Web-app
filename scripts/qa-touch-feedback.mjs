import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url), engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE || '/Users/qwertyx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.EVERWISE_QA_BASE || 'http://127.0.0.1:8914',out=process.env.EVERWISE_TOUCH_EVIDENCE || '../qa-touch-feedback/browser';await mkdir(out,{recursive:true});
const selectors={home:'.today-course-link,.today-checker,.today-badges,.btn-primary,.text-size-control',login:'.btn-primary,.btn-secondary',settings:'.settings-back,button.settings-row,.text-size-control',paywall:'.paywall-cta'};
const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try{for(const touch of [false,true])for(const [width,height] of [[402,874],[1032,1376]])for(const size of ['size-2','size-10'])for(const scene of Object.keys(selectors)){
  const p=await browser.newPage({viewport:{width,height},hasTouch:touch});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  const url=scene==='paywall'?`/tests/fixtures/paywall-layout.html?platform=web&interactive=true&textSize=${size}`:`/tests/fixtures/app-layout.html?view=${scene}&pathAt=welcome&textSize=${size}`;
  await p.goto(base+url);await p.waitForFunction(()=>document.body.dataset.geometryReady==='true');
  const filter=process.env.EVERWISE_TOUCH_FILTER;
  if(filter && !`${engine}-${touch?'touch':'mouse'}-${width}-${size}-${scene}`.includes(filter)){await p.close();continue;}
  await p.evaluate(()=>{window.__inputLog=[];for(const type of ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup'])document.addEventListener(type,e=>window.__inputLog.push({type,x:e.clientX,y:e.clientY,target:e.target.textContent?.slice(0,50)}),true);});
  assert.equal(await p.evaluate(()=>matchMedia('(hover: hover)').matches),!touch);
  const key=`${engine}-${touch?'touch':'mouse'}-${width}-${size}-${scene}`;let count=0;
  const buttons=p.locator(selectors[scene]);
  for(let i=0;i<await buttons.count();i++){
   const el=buttons.nth(i);if(!await el.isVisible())continue;
   await el.scrollIntoViewIfNeeded();await p.mouse.move(0,0);await p.waitForTimeout(180);
   const read=()=>el.evaluate(e=>{const s=getComputedStyle(e);return{background:s.backgroundColor,color:s.color,border:s.borderColor};});
   const before=await read(),disabled=await el.isDisabled(),label=(await el.getAttribute('aria-label'))||await el.innerText();
   await el.hover({force:true});await p.waitForTimeout(180);const hovered=await read();
   if(touch||disabled)assert.deepEqual(hovered,before,`${key} ${label}: hover must not paint`);
   else assert.notDeepEqual(hovered,before,`${key} ${label}: mouse hover feedback`);
   if(!disabled){
    // Hold then drag out to cancel: exercise pressed visuals without triggering destructive or payment actions.
    await p.mouse.down();await p.waitForTimeout(180);const pressed=await read();
    assert.notDeepEqual(pressed,before,`${key} ${label}: pressed feedback`);
    await p.mouse.move(0,0);await p.mouse.up();await p.waitForTimeout(180);assert.deepEqual(await read(),before,`${key} ${label}: release resets`);
    await p.keyboard.press('Tab');await el.focus();const focus=await el.evaluate(e=>({visible:e.matches(':focus-visible'),width:parseFloat(getComputedStyle(e).outlineWidth),style:getComputedStyle(e).outlineStyle}));assert.ok(focus.visible&&focus.width>=2&&focus.style!=='none',`${key} ${label}: keyboard focus ${JSON.stringify(focus)}`);
    await el.evaluate(e=>e.blur());
   }
   count++;
  }
  assert.ok(count>0,`${key} tested controls`);
  if(touch&&scene==='home'){
   // Use a fresh touch context: mixing synthetic mouse drags with touchscreen
   // injection can leave Chromium's :active state stuck despite mouseup/touchend.
   const touchPage=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
   await touchPage.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
   await touchPage.goto(base+url);await touchPage.waitForFunction(()=>document.body.dataset.geometryReady==='true');
   const el=touchPage.locator('.today-course-link');const before=await el.evaluate(e=>getComputedStyle(e).backgroundColor);
   await el.tap();await touchPage.waitForTimeout(400);
   assert.equal(await el.evaluate(e=>getComputedStyle(e).backgroundColor),before,`${key}: touch release`);
   await touchPage.screenshot({path:`${out}/${key}-touch-release.png`});await touchPage.close();
  }
  assert.deepEqual(errors,[]);await p.screenshot({path:`${out}/${key}.png`});results.push({key,controls:count,passed:true});console.log('PASS',key,count);await p.close();
 }}finally{await browser.close();}
}
await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));console.log('PASS',results.length,'input-mode scenes;',results.reduce((n,r)=>n+r.controls,0),'controls');
