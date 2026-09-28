// Requires a running, isolated com.everwise.visualqa simulator app. The
// production account/bundle is not navigated or mutated by this driver.
import {execFileSync} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import {scenes} from "./qa-device-scenes.mjs";
const udid=process.env.EVERWISE_QA_UDID;
assert.ok(udid,"Specify the isolated QA simulator UDID");
const device=process.env.EVERWISE_QA_DEVICE||"ipad13";
const base=process.env.EVERWISE_QA_BASE||"http://127.0.0.1:8886";
assert.equal(new URL(base).hostname,"127.0.0.1");
const output=path.resolve(process.env.EVERWISE_NATIVE_EVIDENCE||`../qa-ipad-refinement/${device}`);
await mkdir(output,{recursive:true});
const selected=scenes.filter(s=>new RegExp(process.env.EVERWISE_QA_SCENE_FILTER||"^(landing|login|interview|home|path|lesson|complete|badges|settings|scam-checker|paywall-native|exam)$").test(s.name));
assert.ok(selected.length);
const modes=JSON.parse(process.env.EVERWISE_QA_ORIENTATIONS||'["portrait","landscape-left"]');
const sizes=JSON.parse(process.env.EVERWISE_QA_TEXT_SIZES||'["size-2","size-10"]');
const widths=JSON.parse(process.env.EVERWISE_QA_EXPECT_WIDTHS||'{"portrait":1032,"landscape-left":1376}');
const runId=Date.now().toString(36),cases=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const get=async(url,options={})=>{const res=await fetch(url,{...options,signal:AbortSignal.timeout(10000)});assert.equal(res.ok,true);return res.json();};
let passed=false;
try {
 for(const orientation of modes) {
  if(orientation!=="window")execFileSync("/opt/homebrew/bin/baguette",["orientation","--udid",udid,orientation]);
  await pause(1000);
  for(const textSize of sizes) for(const scene of selected) {
   const caseId=`${runId}-${orientation}-${textSize}-${scene.name}`;
   await get(`${base}/__qa/command?device=${device}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({caseId,path:`${scene.url}&textSize=${textSize}`})});
   let result;
   for(let attempt=0;attempt<120;attempt++) {
    result=await get(`${base}/__qa/result?key=${device}:${caseId}`);
    if(result)break;
    await pause(500);
   }
   assert.ok(result,`No native result for ${caseId}; inspect the running app before retrying`);
   const screenshot=`${orientation}-${textSize}-${scene.name}.png`;
   execFileSync("xcrun",["simctl","io",udid,"screenshot",path.join(output,screenshot)],{stdio:"pipe",timeout:20000});
   const failures=[...(result.outside||[]),...(result.unreachable||[]),...(result.small||[]),...(result.errors||[]),...(result.brokenImages||[])];
   const entry={orientation,textSize,scene:scene.name,screenshot,...result,failed:Boolean(result.error||result.native!==true||failures.length||result.scrollWidth>result.width+1||Math.abs(result.width-widths[orientation])>1)};if (/^partner-report-(revealed|copy-failed)$/.test(scene.name)) {
     entry.failed ||= result.partnerFixture?.replacementLink !== `https://everwise.tips/#partner=${"r".repeat(43)}`;
   }
   if (process.env.EVERWISE_QA_CONTENT_CATEGORY) {
     entry.failed ||= result.systemText?.category !== process.env.EVERWISE_QA_CONTENT_CATEGORY;
     entry.failed ||= !Number.isFinite(Number(result.systemText?.bodyScale)) || Number(result.systemText?.bodyScale) <= 0;
     entry.failed ||= !Array.isArray(result.textOverflow) || result.textOverflow.length > 0;
   }
   cases.push(entry);
   await writeFile(path.join(output,"summary.json"),JSON.stringify({passed:false,udid,device,runId,cases},null,2));
   console.log(`${entry.failed?"REVIEW":"PASS"} ${device} ${orientation} ${textSize} ${scene.name} ${result.width}x${result.height} ${JSON.stringify(failures)}`);
  }
 }
 passed=cases.length===modes.length*sizes.length*selected.length && cases.every(c=>!c.failed);
 assert.ok(passed,"Native failures require review; see summary.json");
}finally {await writeFile(path.join(output,"summary.json"),JSON.stringify({passed,udid,device,runId,cases},null,2));}
console.log(`PASS ${cases.length} native iPad screen layouts`);
