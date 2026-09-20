import assert from "node:assert/strict";
import {clickReachable} from "./qa-assessments.mjs";

// Exercise the geometry gate itself in a real browser. A moving, scrollable
// control must pass, while controls clipped by non-scrollable parents must fail.
export async function checkReachability(page) {
  await page.setViewportSize({width:320,height:568});
  const open = async (style = "", animated = false) => {
    await page.setContent(`<style>
      * {box-sizing:border-box} body {margin:0}
      main {height:568px;overflow-y:auto}
      section {padding-top:650px;padding-bottom:650px}
      button {display:block;width:200px;height:100px;margin:0 20px}
      aside {position:fixed;right:0;top:0;animation:pulse 1s infinite}
      @keyframes pulse {50% {opacity:.5}}
      ${style}
    </style><main><section><button>Answer</button></section></main><aside>•</aside>`);
    await page.evaluate(animated => {
      window.answerClicks=0;
      document.querySelector("button").onclick=() => window.answerClicks++;
      if(animated) {
        window.entrance=document.querySelector("section").animate(
          [{transform:"translateY(120px)"},{transform:"translateY(0)"}],
          {duration:600,fill:"both"}
        );
      }
    },animated);
  };
  await open("",true);
  await clickReachable(page.getByRole("button",{name:"Answer"}),"animated scrollable control");
  assert.equal(await page.evaluate(() => window.answerClicks),1);
  assert.equal(await page.evaluate(() => window.entrance.playState),"finished");
  assert.equal(await page.locator("aside").evaluate(node => node.getAnimations()[0].playState),"running",
    "Decorative infinite animation must not prevent geometry checks");
  for(const [name,style] of [
    ["hidden bottom","main {overflow:hidden} section {padding-top:540px}"],
    ["hidden top","main {overflow:hidden} section {padding-top:0} button {transform:translateY(-30px)}"],
    ["horizontal clipping","main {overflow-x:hidden} button {width:400px}"],
  ]) {
    await open(style);
    await assert.rejects(clickReachable(page.getByRole("button",{name:"Answer"}),name),
      {code:"ERR_ASSERTION"},`${name} must remain unreachable`);
    assert.equal(await page.evaluate(() => window.answerClicks),0,`${name} must fail before clicking`);
  }
  console.log("PASS: reachability gate waits for entrance animation, ignores infinite decoration, and rejects top/bottom/horizontal clipping");
}
