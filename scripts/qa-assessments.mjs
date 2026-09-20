import assert from "node:assert/strict";
import { challengesByOrder, examsByOrder } from "../src/data/lessons.js";

// Before Playwright clicks, prove both ends are reachable by scrolling only
// containers that a user can scroll. Never move overflow:hidden ancestors.
export async function clickReachable(locator, context) {
  await locator.waitFor();
  const failures = await locator.evaluate(async element => {
    await document.fonts.ready;
    // Let the screen's feedback-scroll effect settle before measuring a new
    // target (especially the header immediately after answering a question).
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    // Entrance transforms keep changing the target position after scrolling.
    // Measure the settled layout without disabling animations or relaxing the
    // clipping gate. Infinite decorative animations must not block the check.
    await Promise.all(document.getAnimations()
      .filter(animation => Number.isFinite(animation.effect.getComputedTiming().endTime))
      .map(animation => animation.finished.catch(() => {})));
    const failures = [];
    for (const edge of ["top", "bottom"]) {
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (!/^(auto|scroll)$/.test(getComputedStyle(parent).overflowY)) continue;
        const rect = element.getBoundingClientRect(), box = parent.getBoundingClientRect();
        if (parent === document.body || parent === document.documentElement) {
          window.scrollBy(0, edge === "top" ? rect.top : rect.bottom-innerHeight);
        } else {
          parent.scrollTop += edge === "top" ? rect.top-Math.max(0,box.top) : rect.bottom-Math.min(innerHeight,box.bottom);
        }
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
      const rect = element.getBoundingClientRect();
      const bounds = {top:0,bottom:innerHeight,left:0,right:innerWidth};
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
        if (/^(auto|scroll|hidden|clip)$/.test(style.overflowY)) {
          bounds.top=Math.max(bounds.top,box.top); bounds.bottom=Math.min(bounds.bottom,box.bottom);
        }
        if (/^(auto|scroll|hidden|clip)$/.test(style.overflowX)) {
          bounds.left=Math.max(bounds.left,box.left); bounds.right=Math.min(bounds.right,box.right);
        }
      }
      if (rect.left < bounds.left-1 || rect.right > bounds.right+1 ||
          Math.min(rect.bottom,bounds.bottom)-Math.max(rect.top,bounds.top) < Math.min(44,rect.height)-1 ||
          (edge === "top" ? rect.top < bounds.top-1 : rect.bottom > bounds.bottom+1)) {
        failures.push({edge,rect:rect.toJSON(),bounds});
      }
    }
    return failures;
  });
  assert.deepEqual(failures, [], `Unreachable assessment control: ${context}`);
  await locator.click();
}

export async function checkAssessments(page, base) {
  let challengeRuns=0, examRuns=0;
  const button = name => page.getByRole("button", {name, exact:true});
  let context;
  const click = name => clickReachable(button(name), `${context}: ${name}`);
  const outcome = async () => JSON.parse(await page.getByTestId("assessment-outcome").textContent());
  async function answerExam(exam, correctCount) {
    for (const [index,question] of exam.questions.entries()) {
      await page.getByRole("heading",{name:question.question,exact:true}).waitFor();
      assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"),String(index+1));
      assert.equal(await button("Choose an answer before continuing").isDisabled(),true);
      await click(question.options[index < correctCount ? question.correctIndex : (question.correctIndex+1)%question.options.length]);
      assert.ok(await page.locator(".lesson-content .mt-8 button").evaluateAll(nodes => nodes.every(node => node.disabled)),"An answer cannot be counted twice");
      await click(index+1 < exam.questions.length ? "Next" : "See results");
    }
    await page.getByText(`You scored ${correctCount} of ${exam.totalQuestions}.`,{exact:true}).waitFor();
  }
  for (const [width,height,textSize] of [[320,568,"size-10"],[1440,900,"size-2"]]) {
    await page.setViewportSize({width,height});
    const open = async (kind,id) => {
      context = `${kind} ${id} ${width}x${height} ${textSize}`;
      await page.goto(`${base}/tests/fixtures/assessments.html?kind=${kind}&id=${id}&textSize=${textSize}`);
      await page.waitForSelector('body[data-assessment-ready="true"]',{state:"attached"});
    };
    for (const challenge of challengesByOrder) {
      await open("challenge",challenge.id);
      for (const [index,block] of challenge.blocks.entries()) {
        assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"),String(index+1));
        switch (block.type) {
          case "multiselect":
            assert.equal(await button("Check").isDisabled(),true);
            for (const option of block.options.filter(option => option.correct)) await click(option.text);
            await click("Check");
            await page.getByText(block.feedback,{exact:true}).waitFor();
            await click("Continue");
            break;
          case "flashcards":
            for (const [cardIndex,card] of block.cards.entries()) {
              await page.getByText(`Card ${cardIndex+1} of ${block.cards.length}`,{exact:true}).waitFor();
              await click("Show back of card");
              assert.equal(await page.locator('.flashcard-face[aria-hidden="false"] .flashcard-copy').textContent(),card.back);
              await click("Continue");
            }
            break;
          case "fillblank":
            for (const [qIndex,question] of block.questions.entries()) {
              await click(question.answer);
              assert.equal(await page.getByRole("heading",{level:1}).textContent(),question.text.replace("______",question.answer));
              await click(qIndex+1 < block.questions.length ? "Next" : "Continue");
            }
            break;
          case "scenario":
            await click(block.options[block.correctIndex]);
            await page.getByText(block.explanation,{exact:true}).waitFor();
            await click("Continue");
            break;
          case "truefalse":
            for (const [qIndex,question] of block.questions.entries()) {
              const label = block.variant === "safeunsafe" ? (question.answer ? "Safe" : "Unsafe") : (question.answer ? "True" : "False");
              await click(label);
              await page.getByText(question.explanation,{exact:true}).waitFor();
              await click(qIndex+1 < block.questions.length ? "Next" : "Continue");
            }
            break;
          default: throw new Error(`Add a real answer flow for challenge type ${block.type}`);
        }
      }
      assert.equal(await page.getByTestId("assessment-outcome").count(),0,"Completion requires the final return action");
      await click("Back to your path");
      assert.deepEqual(await outcome(),{type:"completed",calls:1});
      challengeRuns++;
    }
    console.log(`PASS: ${challengesByOrder.length} complete authored challenge journeys at ${width}px ${textSize}`);
    for (const exam of examsByOrder) {
      for (const pass of [false,true]) {
        await open("exam",exam.id);
        await page.getByRole("heading",{name:exam.title,exact:true}).waitFor();
        await click("Start exam");
        assert.ok(exam.passingScore > 1,"The failed route needs a nonzero score below the pass mark");
        await answerExam(exam,pass ? exam.questions.length : exam.passingScore - 1);
        assert.equal(await page.getByTestId("assessment-outcome").count(),0,"No premature completion callback");
        if (pass) {
          await click("Back to your path");
          const result=await outcome();
          assert.equal(result.type,"passed"); assert.equal(result.calls,1); assert.equal(result.score,exam.questions.length);
        } else {
          assert.equal(await button("Back to your path").count(),0,"A failed exam cannot unlock completion");
          await click(exam.phaseBadge ? "Retake exam" : "Try again");
          await click("Start exam");
          await page.getByRole("heading",{name:exam.questions[0].question,exact:true}).waitFor();
          assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"),"1");
          assert.equal(await button("Choose an answer before continuing").isDisabled(),true);
          // A nonzero failed score must not leak into a subsequent attempt.
          await answerExam(exam,0);
          assert.equal(await button("Back to your path").count(),0);
          await click("Back to path");
          assert.deepEqual(await outcome(),{type:"back",calls:1});
        }
        examRuns++;
      }
    }
    console.log(`PASS: all ${examsByOrder.length} exams pass/fail, exact scores, retry reset and back navigation at ${width}px ${textSize}`);
  }
  console.log(`PASS: ${challengeRuns} challenge journeys and ${examRuns} exam journeys plus ${examsByOrder.length*2} complete retakes using actual authored questions; no skipped answers`);
}
