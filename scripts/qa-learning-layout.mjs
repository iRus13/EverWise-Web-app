import assert from "node:assert/strict";
import { allLessons } from "../src/data/lessons.js";

// Caller owns the local server/browser and blocks all external requests.
export async function checkLearningActivities(page, base) {
  const types=[...new Set(allLessons.flatMap(lesson => lesson.blocks.map(block => block.type)))].sort();
  const failures=[];
  let combinations=0;
  async function expectScrollPosition(atEnd) {
    await page.waitForFunction(atEnd => {
      let owner=document.querySelector(".lesson-content");
      while(owner && !/^(auto|scroll)$/.test(getComputedStyle(owner).overflowY)) owner=owner.parentElement;
      if (!owner || owner === document.body || owner === document.documentElement) owner=document.scrollingElement;
      if(atEnd) {
        const action=document.querySelector(".lesson-footer button").getBoundingClientRect();
        return owner.scrollHeight-owner.clientHeight-owner.scrollTop <= 2 && action.top >= -1 && action.bottom <= innerHeight+1;
      }
      const heading=document.querySelector(".lesson-content h1").getBoundingClientRect();
      return owner.scrollTop <= 1 && heading.top >= -1 && Math.min(heading.bottom,innerHeight)-heading.top >= 44;
    },atEnd);
  }
  async function inspect(context) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await Promise.all(document.getAnimations()
        .filter(animation => Number.isFinite(animation.effect.getComputedTiming().endTime))
        .map(animation => animation.finished.catch(() => {})));
    });
    const geometry=await page.evaluate(async () => {
      const failures=[];
      const clip=element => {
        const bounds={top:0,bottom:innerHeight,left:0,right:innerWidth};
        for(let parent=element.parentElement;parent;parent=parent.parentElement) {
          const style=getComputedStyle(parent), box=parent.getBoundingClientRect();
          if(/^(auto|scroll|hidden|clip)$/.test(style.overflowY)) {
            bounds.top=Math.max(bounds.top,box.top); bounds.bottom=Math.min(bounds.bottom,box.bottom);
          }
          if(/^(auto|scroll|hidden|clip)$/.test(style.overflowX)) {
            bounds.left=Math.max(bounds.left,box.left); bounds.right=Math.min(bounds.right,box.right);
          }
        }
        return bounds;
      };
      const reveal=async (element,edge) => {
        for(let parent=element.parentElement;parent;parent=parent.parentElement) {
          if(!/^(auto|scroll)$/.test(getComputedStyle(parent).overflowY)) continue;
          const rect=element.getBoundingClientRect(),box=parent.getBoundingClientRect();
          parent.scrollTop += edge === "top" ? rect.top-Math.max(0,box.top) : rect.bottom-Math.min(innerHeight,box.bottom);
        }
        if(/^(auto|scroll)$/.test(getComputedStyle(document.body).overflowY)) {
          const rect=element.getBoundingClientRect();
          window.scrollBy(0,edge === "top" ? rect.top : rect.bottom-innerHeight);
        }
        await new Promise(resolve => requestAnimationFrame(resolve));
        return {rect:element.getBoundingClientRect(),bounds:clip(element)};
      };
      for(const element of document.querySelectorAll(".screen-content-frame button")) {
        if(!element.getClientRects().length) continue;
        const label=element.getAttribute("aria-label") || element.textContent.trim().slice(0,90);
        for(const edge of ["top","bottom"]) {
          // Only move user-scrollable containers; hidden ancestors stay fixed.
          const {rect,bounds}=await reveal(element,edge);
          const visible=Math.min(rect.bottom,bounds.bottom)-Math.max(rect.top,bounds.top);
          if(rect.left < bounds.left-1 || rect.right > bounds.right+1 ||
            visible < Math.min(44,rect.height)-1 ||
            (edge === "top" ? rect.top < bounds.top-1 : rect.bottom > bounds.bottom+1)) {
            failures.push({label,edge,rect:rect.toJSON(),bounds});
          }
        }
      }
      const content=document.querySelector(".lesson-content").getBoundingClientRect();
      if(content.height < 80) failures.push({label:"Reading area is squeezed",height:content.height});
      return {source:document.querySelector("[data-activity]").dataset.activity,failures};
    });
    if(geometry.failures.length) failures.push({...context,...geometry});
    combinations++;
  }
  for(const type of types) {
    for(const [width,height] of [[320,568],[667,375],[768,1024],[1440,500],[1440,900]]) {
      for(const textSize of ["size-2","size-10"]) {
        await page.setViewportSize({width,height});
        await page.goto(`${base}/tests/fixtures/learning-layout.html?type=${type}&textSize=${textSize}`);
        await page.waitForSelector('body[data-learning-ready="true"]',{state:"attached"});
        const context={type,width,height,textSize};
        await inspect({...context,state:"initial"});
        if(type === "flashcards") {
          await page.getByRole("button",{name:"Show back of card"}).click();
          await inspect({...context,state:"card-back"});
        }
        if(type === "confidence") {
          await page.getByRole("button",{name:/I'd like more practice/}).click();
          await inspect({...context,state:"practice"});
        }
        if(type === "multiselect") {
          await page.locator('.lesson-content > .mt-8 button[aria-pressed]').first().click();
          await page.getByRole("button",{name:"Check",exact:true}).click();
          // Check is already present before feedback: revealKey must scroll it.
          await expectScrollPosition(true);
          await inspect({...context,state:"feedback"});
        }
        if(type === "truefalse") {
          await page.getByRole("button",{name:/^(True|Safe)$/}).click();
          // Feedback introduces a footer, then Next resets the shared shell.
          await expectScrollPosition(true);
          await inspect({...context,state:"feedback"});
          await page.getByRole("button",{name:"Next",exact:true}).click();
          await expectScrollPosition(false);
          await inspect({...context,state:"next-question"});
        }
        if(type === "builder") {
          for(const column of await page.locator(".builder-columns > div").all()) {
            await column.getByRole("button").first().click();
          }
          await page.getByRole("button",{name:"Continue",exact:true}).click();
          await expectScrollPosition(true);
          await inspect({...context,state:"feedback"});
        }
        await page.getByRole("button",{name:"Save and exit this lesson"}).click();
        assert.equal(await page.getByTestId("activity-outcome").textContent(),"Exited activity");
      }
    }
    console.log(`Checked: ${type} activity states`);
  }
  assert.deepEqual(failures,[],"Authored activity controls and reading space must remain usable");
  console.log(`PASS: ${combinations} authored activity layouts across ${types.length} activity types; flashcard flips, confidence practice, answer feedback, next-question scrolling and lesson exit`);
}
