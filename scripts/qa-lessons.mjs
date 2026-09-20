import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {mkdtemp} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createServer} from "vite";
import react from "@vitejs/plugin-react";
import {checkLessonJourneys,checkQuizRecovery} from "./qa-lesson-journeys.mjs";

const browserName=process.env.EVERWISE_QA_BROWSER || "webkit";
assert.ok(["webkit","firefox","chromium"].includes(browserName));
const shards=Number(process.env.EVERWISE_LESSON_SHARDS || 1);
const shard=Number(process.env.EVERWISE_LESSON_SHARD || 0);
assert.ok(Number.isInteger(shards) && shards>=1 && shards<=111);
assert.ok(Number.isInteger(shard) && shard>=0 && shard<shards);
const ids=process.env.EVERWISE_LESSON_IDS?.split(",");
const browserType=createRequire(import.meta.url)(process.env.EVERWISE_PLAYWRIGHT_MODULE || "playwright")[browserName];
const server=await createServer({root:fileURLToPath(new URL("../",import.meta.url)),configFile:false,logLevel:"error",plugins:[react()],server:{host:"127.0.0.1",port:0}});
await server.listen();
const base=`http://127.0.0.1:${server.httpServer.address().port}`;
let browser,page;
const errors=[];
const watchdog=setTimeout(async () => {
  console.error("FAIL: lesson journey watchdog expired before completion");
  await browser?.close();await server.close();process.exit(1);
},30*60*1000);
try {
  browser=await browserType.launch(process.env.EVERWISE_CHROMIUM_EXECUTABLE ? {executablePath:process.env.EVERWISE_CHROMIUM_EXECUTABLE} : {});
  const context=await browser.newContext();
  await context.route("**/*",route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  page=await context.newPage();
  page.on("pageerror",error => errors.push(error.message));
  if(shard === 0) await checkQuizRecovery(page,base);
  await checkLessonJourneys(page,base,{shard,shards,ids});
  assert.deepEqual(errors,[],"No uncaught lesson errors");
  console.log(`PASS: ${browserName} lesson shard ${shard+1}/${shards} complete; external requests blocked; no uncaught errors`);
  await context.close();
} catch(error) {
  const directory=await mkdtemp(join(tmpdir(),"everwise-lesson-failure-"));
  await page?.screenshot({path:join(directory,"failure.png")}).catch(()=>{});
  console.error(`Lesson failure screenshot: ${directory}/failure.png; page errors: ${JSON.stringify(errors)}`);
  throw error;
} finally {
  clearTimeout(watchdog);
  await browser?.close();await server.close();
}
