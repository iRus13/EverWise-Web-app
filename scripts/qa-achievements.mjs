// Real authored completion and assessment screens, using isolated local fixtures.
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import {allLessons} from "../src/data/lessons.js";
import {lessonsByOrder, challengesByOrder, examsByOrder} from "../src/data/course-catalog.js";
import {courseSuccessor} from "../src/utils/courseProgress.js";
import {checkAssessments} from "./qa-assessments.mjs";
import {checkBadgeGallery} from "./qa-badges.mjs";
import {checkHeadingWrapping} from "./qa-heading-layout.mjs";
const require=createRequire(import.meta.url);
const engine=process.env.EVERWISE_QA_BROWSER || "chromium";
assert.ok(["chromium","webkit"].includes(engine));
const mode=process.env.EVERWISE_QA_MODE || "summaries";
assert.ok(["summaries","journeys","badges"].includes(mode));
const base=process.env.EVERWISE_QA_BASE || "http://127.0.0.1:8877";
assert.equal(new URL(base).hostname,"127.0.0.1");
const output=path.resolve(process.env.EVERWISE_WEB_EVIDENCE || `../qa-achievements-refinement/${engine}-${mode}`);
await mkdir(output,{recursive:true});
const browser=await require(process.env.EVERWISE_PLAYWRIGHT_MODULE || "playwright")[engine].launch(engine === "chromium" ? {executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true} : {headless:true});
const summary={engine,mode,started:new Date().toISOString(),states:[],errors:[]};
async function newPage() {
  const context=await browser.newContext();
  await context.route("**/*",route=>new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const page=await context.newPage();
  page.on("pageerror",error=>summary.errors.push(error.message));
  return page;
}
async function capture(page,state) {
  const screenshot=`${state.kind}-${state.id}-${state.state}-${state.width}x${state.height}-${state.textSize}.png`;
  const geometry=await page.evaluate(()=>window.__everwiseVisualQA.measure());
  const brokenWords=await page.locator(".learning-summary h1,.badges-screen h1,.badges-screen h2,.badges-screen h3").evaluateAll(headings=>{
    const broken=[];
    for(const heading of headings) {
      const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);let node;
      while((node=walker.nextNode())) for(const match of node.textContent.matchAll(/[\p{L}\p{N}]+/gu)) {
        const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
        if(new Set([...range.getClientRects()].filter(r=>r.width).map(r=>Math.round(r.top))).size>1) broken.push(match[0]);
      }
    }
    return broken;
  });
  const textOutside=await page.locator(".learning-summary h2,.learning-summary p,.learning-summary li,.badge-copy").evaluateAll(elements=>elements.filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.textContent));
  await page.screenshot({path:path.join(output,screenshot)});
  const entry={...state,screenshot,geometry,brokenWords,textOutside};summary.states.push(entry);
  assert.deepEqual({outside:geometry.outside,unreachable:geometry.unreachable,errors:geometry.errors,brokenImages:geometry.brokenImages,brokenWords,textOutside},{outside:[],unreachable:[],errors:[],brokenImages:[],brokenWords:[],textOutside:[]},`Readable summary ${JSON.stringify(state)}`);
}
try {
  if(mode === "summaries") {
    const queue=allLessons.flatMap(lesson=>[[320,568],[1440,900]].flatMap(([width,height])=>["size-2","size-10"].map(textSize=>({lesson,width,height,textSize}))));
    await Promise.all(Array.from({length:4},async()=>{
      const page=await newPage();let item;
      while((item=queue.shift())) {
        const {lesson,width,height,textSize}=item;
        await page.setViewportSize({width,height});
        await page.goto(`${base}/tests/fixtures/app-layout.html?view=complete&lesson=${encodeURIComponent(lesson.id)}&textSize=${textSize}&award=new&language=en`);
        await page.waitForSelector('body[data-geometry-ready="true"]',{state:"attached"});
        const text=await page.locator(".complete-screen").textContent();
        const info=lesson.complete || {};
        const next=courseSuccessor(lesson.id,{lessons:lessonsByOrder,challenges:challengesByOrder,exams:examsByOrder});
        for(const value of [lesson.badge,info.title,info.subtitle,info.habit,info.warningSign,...(info.skills||[]),...(info.learned||[]),next?.title].filter(Boolean)) assert.ok(text.includes(value),`Preserve takeaways and canonical next step for ${lesson.id}`);
        await capture(page,{kind:"lesson",id:lesson.id,state:"complete",width,height,textSize});
      }
    }));
  } else if(mode === "journeys") {
    const page=await newPage();
    Object.assign(summary,await checkAssessments(page,base,capture));
    await checkHeadingWrapping(page,base);
  } else {
    const page=await newPage();await checkBadgeGallery(page,base);
    for(const id of ["empty","earned","honors"]) for(const [width,height] of [[320,568],[667,375],[768,1024],[1440,900]]) for(const textSize of ["size-2","size-10"]) {
      await page.setViewportSize({width,height});
      await page.goto(`${base}/tests/fixtures/app-layout.html?view=badges&awards=${id}&textSize=${textSize}`);
      await page.waitForSelector('body[data-geometry-ready="true"]',{state:"attached"});
      await capture(page,{kind:"badges",id,state:"initial",width,height,textSize});
      await page.getByRole("button",{name:"All badges",exact:true}).click();
      for(const toggle of await page.locator('.badge-phase-toggle').all()) if(await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
      await capture(page,{kind:"badges",id,state:"all",width,height,textSize});
      await page.getByRole("button",{name:"Earned",exact:true}).click();
      assert.equal(await page.locator('.badge-tile[data-earned="false"]').count(),0);
      if(id !== "empty") assert.ok(await page.locator('.badge-tile[data-earned="true"]').count()>0);
      await capture(page,{kind:"badges",id,state:"earned",width,height,textSize});
      await page.getByRole("button",{name:"All badges",exact:true}).click();
      assert.ok(await page.locator('.badge-tile[data-earned="false"]').count()>0);
    }
  }
  assert.deepEqual(summary.errors,[]);summary.passed=true;
  console.log(`PASS: ${summary.states.length} ${engine} ${mode} captures with geometry, whole-word headings and behavior checks`);
} catch(error) {summary.passed=false;summary.error=String(error);throw error;}
finally {summary.finished=new Date().toISOString();await writeFile(path.join(output,"summary.json"),JSON.stringify(summary,null,2));await browser.close();}
