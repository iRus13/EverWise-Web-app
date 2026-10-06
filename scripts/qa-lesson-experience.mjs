// Isolated UI journey evidence. Requires the local compiled visual lab.
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import {checkLearningActivities} from "./qa-learning-layout.mjs";
const require=createRequire(import.meta.url);
const engine=process.env.EVERWISE_QA_BROWSER || "chromium";
assert.ok(["chromium","webkit"].includes(engine));
const base=process.env.EVERWISE_QA_BASE || "http://127.0.0.1:8872";
assert.equal(new URL(base).hostname,"127.0.0.1");
const output=path.resolve(process.env.EVERWISE_WEB_EVIDENCE || `../qa-learning-refinement/${engine}`);
await mkdir(output,{recursive:true});
const browser=await require(process.env.EVERWISE_PLAYWRIGHT_MODULE || "playwright")[engine].launch(engine === "chromium" ? {executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true} : {headless:true});
const context=await browser.newContext();
await context.route("**/*",route=>new URL(route.request().url()).origin === base ? route.continue() : route.abort());
await context.route("**/__qa/controller.js",route=>route.fulfill({contentType:"application/javascript",body:""}));
const page=await context.newPage();
const errors=[],states=[];
page.on("pageerror",error=>errors.push(error.message));
const summary={engine,started:new Date().toISOString(),states,errors};
try {
  Object.assign(summary,await checkLearningActivities(page,base,async(page,state)=>{
    const screenshot=`${state.type}-${state.width}x${state.height}-${state.textSize}-${state.state}.png`;
    await page.screenshot({path:path.join(output,screenshot)});
    states.push({...state,screenshot});
  }));
  assert.deepEqual(errors,[],"No runtime errors during learning journeys");
  summary.passed=true;
} catch(error) {
  summary.passed=false;summary.error=String(error);summary.url=page.url();
  await page.screenshot({path:path.join(output,"failure.png")});
  throw error;
} finally {
  summary.finished=new Date().toISOString();
  await writeFile(path.join(output,"summary.json"),JSON.stringify(summary,null,2));
  await browser.close();
}
