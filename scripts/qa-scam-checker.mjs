// Render the real screen against synthetic responses, with all non-loopback
// traffic blocked. State/geometry evidence does not claim live-provider QA.
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const require=createRequire(import.meta.url);
const engines=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||"playwright");
const base=process.env.EVERWISE_QA_BASE||"http://127.0.0.1:8883";
assert.equal(new URL(base).hostname,"127.0.0.1");
const output=path.resolve(process.env.EVERWISE_WEB_EVIDENCE||"../qa-scam-checker-refinement/states");
await mkdir(output,{recursive:true});
const results=[];
let passed=false;
const message="Synthetic QA: Your account will close today. Send a verification code to keep it open.";
const assessment=verdict=>({verdict,summary:"The message asks you to act before you have time to check who sent it. Verify the request independently before responding.",warning_signs:verdict === "likely_legitimate" ? [] : ["Pressure to act immediately", "A request for a private verification code"],next_steps:["Open the organization’s official app yourself.","Ask whether it sent the message using a phone number from your card or statement."],urgent_action:verdict === "likely_scam" ? "If you already shared a code, contact the organization through its official app or website." : null});
const visibleStart=el=>{
 let top=0,bottom=innerHeight;
 for(let p=el.parentElement;p;p=p.parentElement) if(/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(p).overflowY)) {const r=p.getBoundingClientRect();top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);}
 const r=el.getBoundingClientRect();return r.top>=top-2 && r.top<bottom-20;
};
try {
 for(const engine of ["chromium","webkit"]) {
  const browser=await engines[engine].launch(engine === "chromium" ? {executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true} : {headless:true});
  try {
   const queue=[[320,568],[402,874],[667,375],[768,1024],[1440,900]];
   await Promise.all(Array.from({length:2},async()=>{
    const context=await browser.newContext();
    await context.route("**/*",r=>new URL(r.request().url()).origin === base ? r.continue() : r.abort());
    const page=await context.newPage();
    let responseMode="pending",requests=0;
    const pending=[];
    await context.route("**/api/check-message",async route=>{
     requests++;
     assert.equal(JSON.parse(route.request().postData()).message,message);
     if(responseMode==="pending") {pending.push(route);return;}
     if(responseMode==="offline") return route.abort("failed");
     const status=responseMode==="unavailable"?503:responseMode==="error"?500:200;
     const body=responseMode==="malformed"?{verdict:"nonsense"}:assessment(responseMode);
     await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
    });
    let viewport;
    while((viewport=queue.shift())) for(const textSize of ["size-2","size-10"]) {
     const [width,height]=viewport;await page.setViewportSize({width,height});
     await page.goto(`${base}/tests/fixtures/app-layout.html?view=scam-checker&textSize=${textSize}`);
     await page.waitForFunction(()=>document.body.dataset.geometryReady && window.__everwiseVisualQA);
     const input=page.getByRole("textbox",{name:"Message to check"});
     const submit=page.getByRole("button",{name:"Check this message",exact:true});
     const capture=async(state)=>{
      const screenshot=`${engine}-${width}x${height}-${textSize}-${state}.png`;
      await page.screenshot({path:path.join(output,screenshot)});
      const geometry=await page.evaluate(()=>window.__everwiseVisualQA.measure());
      const failures=[...geometry.outside,...geometry.unreachable,...geometry.small,...geometry.errors,...geometry.brokenImages];
      const headings=await page.locator(".scam-checker-content h1,.scam-checker-content h2,.scam-checker-content h3").evaluateAll(elements=>elements.flatMap(el=>{
       const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const split=[];let node;
       while((node=walker.nextNode())) for(const match of node.textContent.matchAll(/\S+/g)) {const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);if(range.getClientRects().length>1) split.push(match[0]);}
       return split;
      }));
      const entry={engine,width,height,textSize,state,screenshot,geometry,splitHeadingWords:headings};results.push(entry);
      assert.equal(geometry.scrollWidth<=width+1,true);
      assert.deepEqual(failures,[],JSON.stringify({state,width,height,textSize,failures}));
      assert.deepEqual(headings,[],`Broken heading words at ${state} ${width} ${textSize}`);
     };
     await capture("entry");await input.fill(message);
     responseMode="pending";await submit.click();
     await page.getByRole("button",{name:"Cancel check"}).waitFor();
     assert.equal(await input.isDisabled(),true);
     await capture("loading");await page.getByRole("button",{name:"Cancel check"}).click();
     assert.equal(await input.inputValue(),message);
     assert.equal(await input.evaluate(el=>document.activeElement===el),true);
     await capture("canceled");
     for(const mode of ["likely_scam","uncertain","likely_legitimate","unavailable","error","malformed","offline"]) {
      responseMode=mode;const previous=requests;await submit.click();
      if(mode.startsWith("likely")||mode==="uncertain") {
       const verdict=page.locator(".scam-verdict h2");await verdict.waitFor();
       assert.equal(await verdict.evaluate(el=>document.activeElement===el),true);
       assert.equal(await verdict.evaluate(visibleStart),true);
       await capture(mode);
       await page.getByRole("button",{name:"Edit this message"}).click();
       assert.equal(await input.inputValue(),message);
       assert.equal(await input.evaluate(el=>document.activeElement===el),true);
      } else {
       const alert=page.getByRole("alert");await alert.waitFor();
       assert.equal(await alert.evaluate(el=>document.activeElement===el),true);
       assert.equal(await alert.evaluate(visibleStart),true);
       assert.equal(await input.inputValue(),message);
       await capture(mode);
      }
      assert.equal(requests,previous+1);
     }
     responseMode="likely_scam";await submit.click();await page.locator(".scam-verdict h2").waitFor();
     await page.getByRole("button",{name:"Check another message"}).click();
     assert.equal(await input.inputValue(),"");assert.equal(await submit.isDisabled(),true);
     console.log(`PASS ${engine} ${width}x${height} ${textSize}`);
    }
    await context.close();
   }));
  }finally {await browser.close();}
 }
 passed=true;
}finally {await writeFile(path.join(output,"summary.json"),JSON.stringify({passed,results},null,2));}
console.log(`PASS ${results.length} Scam Checker state layouts and recovery journeys`);
