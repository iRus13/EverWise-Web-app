// Change simulator accessibility settings only; always restore the initial
// setting. Commands target the isolated local visual-QA bundle, never accounts.
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const udid=process.env.EVERWISE_QA_UDID,device=process.env.EVERWISE_QA_DEVICE;
assert.ok(udid&&device);
const base=process.env.EVERWISE_QA_BASE||'http://127.0.0.1:8912';assert.equal(new URL(base).hostname,'127.0.0.1');
const out=path.resolve(process.env.EVERWISE_NATIVE_EVIDENCE||'../qa-system-text/native-live-verified');await mkdir(out,{recursive:true});
const initial=execFileSync('xcrun',['simctl','ui',udid,'content_size'],{encoding:'utf8'}).trim();
const sizes=['extra-small','small','medium','large','extra-large','extra-extra-large','extra-extra-extra-large','accessibility-medium','accessibility-large','accessibility-extra-large','accessibility-extra-extra-large','accessibility-extra-extra-extra-large'];
const categories=['XS','S','M','L','XL','XXL','XXXL','AccessibilityM','AccessibilityL','AccessibilityXL','AccessibilityXXL','AccessibilityXXXL'];
const cases=[];let passed=false;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function measure(action='measure'){
 const caseId=String(Date.now());
 await fetch(`${base}/__qa/command?device=${device}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId,path:'/tests/fixtures/app-layout.html?view=home&textSize=size-2',action})});
 for(let i=0;i<120;i++){
  const value=await (await fetch(`${base}/__qa/result?key=${device}:${caseId}`)).json();if(value)return value;await pause(250);
 }
 throw Error('No native measurement; inspect the live app before retrying');
}
try {
 const baseline=await measure('navigate');assert.ok(baseline.native);
 for(let i=0;i<sizes.length;i++){
  const size=sizes[i];execFileSync('xcrun',['simctl','ui',udid,'content_size',size]);
  const started=Date.now();let result,attempts=0;
  do { result=await measure();attempts++; } while(result.systemText?.category!=='UICTContentSizeCategory'+categories[i]&&attempts<5);
  assert.ok(result.native);assert.equal(result.timeOrigin,baseline.timeOrigin,'System preference change must not reload the page');
  assert.equal(result.systemText.category,'UICTContentSizeCategory'+categories[i]);assert.equal(result.textSize,'size-2');
  assert.ok(Number(result.systemText.bodyScale)>0);assert.equal(result.textOverflow.length,0);
  assert.equal(result.unreachable.length,0);assert.equal(result.outside.length,0);
  if(i)assert.ok(Number(result.systemText.bodyScale)>Number(cases[i-1].systemText.bodyScale));
  const screenshot=size+'.png';execFileSync('/opt/homebrew/bin/baguette',['screenshot','--udid',udid,'--output',path.join(out,screenshot),'--scale','3']);
  cases.push({size,...result,attempts,observedWithinMs:Date.now()-started,screenshot});console.log(`PASS ${size}: ${result.systemText.bodyScale} body / ${result.systemText.titleScale} title (${attempts} observations)`);
 }
 passed=true;
}finally{
 execFileSync('xcrun',['simctl','ui',udid,'content_size',initial]);
 await writeFile(path.join(out,'summary.json'),JSON.stringify({passed,initial,cases},null,2));
}
