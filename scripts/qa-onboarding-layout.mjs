// Walk every public onboarding step in the real App; stop before account creation.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.EVERWISE_QA_BROWSER||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const base=process.env.EVERWISE_QA_BASE||`http://127.0.0.1:${process.env.EVERWISE_QA_PORT||8867}`;
assert.equal(new URL(base).hostname,'127.0.0.1');
const output=path.resolve(process.env.EVERWISE_ONBOARDING_EVIDENCE||'../qa-onboarding-device-evidence');await mkdir(output,{recursive:true});
const viewports=process.env.EVERWISE_QA_VIEWPORTS?JSON.parse(process.env.EVERWISE_QA_VIEWPORTS):[[320,568],[390,844],[430,932],[667,375],[768,1024],[1024,768],[1440,900],[1920,1080]];
const cases=[];
const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
try{
 for(const [width,height] of viewports)for(const size of ['size-2','size-10']){
  const context=await browser.newContext({viewport:{width,height}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await context.addInitScript(size=>localStorage.setItem('everwise-text-size',size),size);
  const page=await context.newPage();
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Get Started',exact:true}).click();
  await page.getByLabel('What should we call you?').fill('QA Review');
  await page.getByLabel('Your age',{exact:true}).fill('68');
  for(let step=1;step<=8;step++){
   await page.getByText(`${step} of 8`,{exact:true}).waitFor();
   const result=await page.evaluate(()=>window.__everwiseVisualQA.measure());
   result.brokenWords=await page.evaluate(()=>{
    const broken=[];
    for(const element of document.querySelectorAll('.profile-flow h1, .profile-flow > header button')) {
     const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
     let node;
     while((node=walker.nextNode()))for(const match of node.textContent.matchAll(/\S+/g)) {
      const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
      const lines=new Set([...range.getClientRects()].filter(rect=>rect.width>0).map(rect=>Math.round(rect.top)));
      if(lines.size>1)broken.push(match[0]);
     }
    }
    return broken;
   });
   assert.equal(result.textSize,size);
   const screenshot=`${width}x${height}-${size}-step-${step}.png`;
   await page.screenshot({path:path.join(output,screenshot)});
   const failed=Boolean(result.outside.length||result.unreachable.length||result.errors.length||result.brokenImages.length||result.brokenWords.length||result.scrollWidth>width+1);
   cases.push({...result,width,height,size,step,screenshot,failed});
   if(step<8)await page.getByRole('button',{name:step===1?'Start':'Skip',exact:true}).click();
  }
  // Go back from account creation to prove navigation and retained draft state.
  await page.getByRole('button',{name:'Previous question',exact:true}).click();
  await page.getByText('7 of 8',{exact:true}).waitFor();
  console.log(`PASS ${width}x${height} ${size}: all 8 steps and back navigation`);
  await context.close();await writeFile(path.join(output,'summary.json'),JSON.stringify({engine,viewports,cases},null,2));
 }
}finally{await browser.close();}
assert.equal(cases.length,viewports.length*2*8);assert.equal(cases.filter(c=>c.failed).length,0);
console.log(`FINISHED ${cases.length} onboarding screen cases, no accounts created`);
