import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {clickReachable} from './qa-assessments.mjs';
const require=createRequire(import.meta.url);
const engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8914';
assert.equal(new URL(base).hostname,'127.0.0.1');
const output=path.resolve(process.env.EVERWISE_COURSE_EVIDENCE||'../qa-native-learning/course-resume');
await mkdir(output,{recursive:true});const results=[];
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try {
  for(const [width,height] of [[320,568],[390,844],[667,375],[768,1024],[1366,900]])for(const textSize of ['size-2','size-10']) {
   const context=await browser.newContext({viewport:{width,height}});
   await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const resume of [true,false]) {
    const key=`${engine}-${width}x${height}-${textSize}-${resume?'resume':'new'}`;
    await page.goto(`${base}/tests/fixtures/app-layout.html?view=path&pathAt=ai&textSize=${textSize}${resume?'&resume=ai':''}`);
    await page.waitForFunction(()=>document.body.dataset.geometryReady);
    const label=resume?'Resume lesson: What is AI?':'Already know this? Take a quick check: What is AI?';
    const action=page.getByRole('button',{name:label,exact:true});
    if(resume) {
     assert.equal(await page.getByText('Continue where you left off',{exact:true}).count(),1);
     assert.equal(await page.locator('.course-quick-check').count(),0);
    }
    await clickReachable(action,key);
    const recorded=await page.evaluate(()=>window.__courseQA.actions);
    assert.deepEqual(recorded,[{kind:resume?'lesson':'quick-check',value:'ai'}]);
    const overflow=await page.locator('[data-course-step="ai"]').evaluate(el=>[el,...el.querySelectorAll('*')].filter(x=>x.clientWidth>0&&x.scrollWidth>x.clientWidth+2).map(x=>x.textContent));
    assert.deepEqual(overflow,[],key);
    assert.deepEqual(errors,[],key);
    await page.screenshot({path:path.join(output,key+'.png')});
    results.push({key,passed:true,recorded});
   }
   await context.close();
  }
 }finally {await browser.close();}
}
await writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
console.log(`PASS ${results.length} saved/new course entry layouts and actions`);
