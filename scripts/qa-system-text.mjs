// Rendered layout checks with explicit UIKit-metric emulation. Real native
// preference changes are verified separately in the isolated simulator app.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {scenes} from './qa-device-scenes.mjs';
const require=createRequire(import.meta.url),engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.EVERWISE_QA_BROWSER||'chromium',base=`http://127.0.0.1:${process.env.EVERWISE_QA_PORT||8908}`;
const out=path.resolve(process.env.EVERWISE_WEB_EVIDENCE||'../qa-system-text/chromium');await mkdir(out,{recursive:true});
const selected=scenes.filter(s=>new RegExp(process.env.EVERWISE_QA_SCENE_FILTER||'^(landing|login|interview|signup|home|settings|path|lesson|activity-.+|badges|complete|scam-checker|paywall-native|partner-report-ready|billing-timeout|exam|challenge)$').test(s.name));
const views=JSON.parse(process.env.EVERWISE_QA_VIEWPORTS||'[[320,568],[402,874],[834,1194],[1440,900]]');
const scales=JSON.parse(process.env.EVERWISE_QA_SYSTEM_SCALES||'[2.823529411764706]');
const sizes=JSON.parse(process.env.EVERWISE_QA_TEXT_SIZES||'["size-2","size-10"]');
const cases=[],browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}:{headless:true});
let failed=false;
try {
 const queue=[...views];
 await Promise.all(Array.from({length:2},async()=>{
  const context=await browser.newContext();await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());const page=await context.newPage();
  let view;while((view=queue.shift())){
   const [width,height]=view;await page.setViewportSize({width,height});
   for(const scale of scales)for(const size of sizes)for(const scene of selected){
    const entry={width,height,scale,size,scene:scene.name,emulated:true};
    try {
     await page.goto(`${base}${scene.url}&textSize=${size}`);await page.waitForFunction(()=>window.__everwiseVisualQA);
     await page.evaluate(({scale})=>{
      const root=document.documentElement;root.dataset.systemTextCategory='emulated';root.style.setProperty('--system-text-scale',String(scale));root.style.setProperty('--system-title-scale',String(scale===2.823529411764706?2:scale));
      root.dataset.expandedText=String(scale*parseFloat(getComputedStyle(root).getPropertyValue('--app-text-scale'))>=1.44);
      const shell=document.querySelector('.app-viewport');shell?.classList.add('is-native-app');shell?.style.setProperty('--native-window-top','62px');
     },{scale});
     Object.assign(entry,await page.evaluate(()=>window.__everwiseVisualQA.measure()));
     entry.textOverflow=await page.evaluate(()=>[...document.querySelectorAll('h1,h2,h3,p,button,label')].filter(el=>el.getClientRects().length&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+2).map(el=>({text:el.textContent.slice(0,100),width:el.clientWidth,scroll:el.scrollWidth,class:el.className})));
     entry.failed=Boolean(entry.error||entry.outside.length||entry.unreachable.length||entry.small.length||entry.errors.length||entry.brokenImages.length||entry.scrollWidth>width+1||entry.textOverflow.length);
     const file=`${width}x${height}-${scale.toFixed(2)}-${size}-${scene.name}.png`;await page.screenshot({path:path.join(out,file)});entry.screenshot=file;
    }catch(error){entry.failed=true;entry.error=String(error);}
    if(entry.failed)console.log('REVIEW '+JSON.stringify(entry));cases.push(entry);
   }
   console.log(`DONE ${width}x${height}`);
  }
  await context.close();
 }));
}finally{await browser.close();failed=cases.some(c=>c.failed);await writeFile(path.join(out,'summary.json'),JSON.stringify({engine,passed:!failed,cases},null,2));}
console.log(`${failed?'REVIEW':'PASS'} ${cases.length} layouts, ${cases.filter(c=>c.failed).length} failures`);if(failed)process.exitCode=1;
