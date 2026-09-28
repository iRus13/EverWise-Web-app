import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {clickReachable} from './qa-assessments.mjs';
import {examsByOrder} from '../src/data/lessons.js';
const require=createRequire(import.meta.url),engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8914';
assert.equal(new URL(base).hostname,'127.0.0.1');
const out=path.resolve('../qa-native-assessments/browser');await mkdir(out,{recursive:true});const results=[];
const exam=examsByOrder.find(x=>x.id==='phase3-exam');
for(const engine of ['chromium','webkit']) {
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try { for(const [width,height] of [[320,568],[390,844],[667,375],[768,1024],[1366,900]]) for(const textSize of ['size-2','size-10']) {
  const key=`${engine}-${width}x${height}-${textSize}`;
  const context=await browser.newContext({viewport:{width,height}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const click=name=>clickReachable(page.getByRole('button',{name,exact:true}),`${key} ${name}`);
  await page.goto(`${base}/tests/fixtures/assessments.html?kind=exam&id=${exam.id}&textSize=${textSize}&persist=1`);
  await click('Start exam');
  for(let i=0;i<3;i++) {await click(exam.questions[i].options[exam.questions[i].correctIndex]);await click('Next');}
  const q=exam.questions[3];await click(q.options[(q.correctIndex+1)%q.options.length]);
  await click('Go back');await page.reload();
  await page.getByRole('heading',{name:q.question,exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:q.options[(q.correctIndex+1)%q.options.length],exact:true}).getAttribute('aria-pressed'),'true');
  await page.screenshot({path:path.join(out,key+'-resumed.png')});
  for(let i=3;i<exam.questions.length;i++) {await click(exam.questions[i].options[exam.questions[i].correctIndex]);await click(i===exam.questions.length-1?'See results':'Next');}
  await page.reload();await page.getByText('You scored 10 of 10.',{exact:true}).waitFor();
  await page.screenshot({path:path.join(out,key+'-restored-result.png')});
  await click('Back to your path');
  assert.equal(JSON.parse(await page.getByTestId('assessment-outcome').textContent()).score,10);
  await page.reload();await page.getByRole('button',{name:'Start exam',exact:true}).waitFor();
  for(const [kind,id,title] of [['challenge','phase3-challenge','Phase 3 Final Challenge'],['exam',exam.id,exam.title]]) {
   await page.goto(`${base}/tests/fixtures/app-layout.html?view=path&pathAt=${id}&resumeAssessment=${id}&textSize=${textSize}`);
   await page.waitForFunction(()=>document.body.dataset.geometryReady);
   await click(`Resume ${kind}: ${title}`);
   assert.deepEqual(await page.evaluate(()=>window.__courseQA.actions),[{kind,value:id}]);
   await page.screenshot({path:path.join(out,key+`-resume-${kind}.png`)});
  }
  assert.deepEqual(errors,[],key);results.push({key,passed:true,checks:['answer resume','editable choice','derived perfect score','result resume','completion clears','challenge path','exam path']});
  await context.close();console.log('PASS',key);
 }}finally{await browser.close();}
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
console.log(`PASS ${results.length} complete responsive resume journeys`);
