import assert from "node:assert/strict";
import {allLessons} from "../src/data/lessons.js";
import {clickReachable} from "./qa-assessments.mjs";

// Each activity is actually answered/continued in LessonPlayer; no Skip or
// injected completion callback stands in for the normal authored lesson path.
export async function checkLessonJourneys(page, base, {shard=0, shards=1, ids=null}={}) {
  const lessons=allLessons.filter((lesson,index) => ids ? ids.includes(lesson.id) : index % shards === shard);
  assert.ok(lessons.length,"The lesson shard must not be empty");
  let context, runs=0, blocks=0, questions=0, practiceQuestions=0;
  const button=name => page.getByRole("button",{name,exact:true});
  const click=name => clickReachable(button(name),`${context}: ${name}`);
  const outcome=async () => JSON.parse(await page.getByTestId("lesson-outcome").textContent());
  for(const [width,height,textSize] of [[320,568,"size-10"],[1440,900,"size-2"]]) {
    await page.setViewportSize({width,height});
    for(const lesson of lessons) {
      context=`${lesson.id} ${width}px ${textSize}`;
      await page.goto(`${base}/tests/fixtures/lesson-journeys.html?id=${lesson.id}&textSize=${textSize}&run=full-${width}`);
      await page.waitForSelector('body[data-lesson-ready="true"]',{state:"attached"});
      for(const [index,block] of lesson.blocks.entries()) {
        context=`${lesson.id} block${index} ${block.type} ${width}px ${textSize}`;
        assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"),String(index+1),context);
        assert.equal(await page.getByTestId("lesson-outcome").count(),0,context);
        switch(block.type) {
          case "learn": case "reading": case "memory": await click("Continue"); break;
          case "tiered": case "finalboss": {
            const answer=block.options.find(option => option.tier === "best");
            assert.ok(answer,`${context}: best answer exists`);
            await click(answer.text);
            await page.getByText(answer.feedback,{exact:true}).waitFor();
            await click("Continue"); break;
          }
          case "confidence":
            if(block.practice?.length) {
              await click("I'd like more practice");
              const seen=new Set();
              for(let index=0;index<block.practice.length;index++) {
                await page.getByText(`Practice ${index+1} of ${block.practice.length}`,{exact:true}).waitFor();
                const questionText=await page.getByRole("heading",{level:1}).textContent();
                // Several authored scenarios intentionally share a question
                // heading. Match the scenario and choices, not the heading alone.
                const choices=await page.locator(".lesson-content button").allTextContents();
                const matches=[];
                for(const [questionIndex,candidate] of block.practice.entries()) {
                  if(candidate.question === questionText && candidate.options.every(option => choices.map(text => text.trim()).includes(option.text)) &&
                    (!candidate.scenario || await page.getByText(candidate.scenario,{exact:true}).count() === 1)) matches.push(questionIndex);
                }
                assert.equal(matches.length,1,`${context}: unique authored practice scenario`);
                const questionIndex=matches[0], question=block.practice[questionIndex];
                assert.ok(!seen.has(questionIndex),`${context}: no repeated scenario in one practice round`);
                seen.add(questionIndex);
                const answer=question.options.find(option => option.tier === "best");
                await click(answer.text);
                await page.getByText(answer.feedback,{exact:true}).waitFor();
                await click(index+1 < block.practice.length ? "Next" : "Done practicing");
                practiceQuestions++;
              }
            }
            await click("Very confident"); break;
          case "multiselect":
            assert.equal(await button("Check").isDisabled(),true,context);
            for(const option of block.options.filter(option => option.correct)) await click(option.text);
            await click("Check");
            await page.getByText(block.feedback,{exact:true}).waitFor();
            await click("Continue"); break;
          case "flashcards":
            for(const [cardIndex,card] of block.cards.entries()) {
              await page.getByText(`Card ${cardIndex+1} of ${block.cards.length}`,{exact:true}).waitFor();
              await click("Show back of card");
              assert.equal(await page.locator('.flashcard-face[aria-hidden="false"] .flashcard-copy').textContent(),card.back,context);
              await click("Continue");
            }
            break;
          case "fillblank":
            for(const [qIndex,question] of block.questions.entries()) {
              await click(question.answer);
              assert.equal(await page.getByRole("heading",{level:1}).textContent(),question.text.replace("______",question.answer),context);
              await click(qIndex+1 < block.questions.length ? "Next" : "Continue");
            }
            break;
          case "scenario": case "choice":
            await click(block.options[block.correctIndex]);
            if(block.explanation) await page.getByText(block.explanation,{exact:true}).waitFor();
            await click("Continue"); break;
          case "truefalse":
            for(const [qIndex,question] of block.questions.entries()) {
              await click(block.variant === "safeunsafe" ? (question.answer ? "Safe" : "Unsafe") : (question.answer ? "True" : "False"));
              if(question.explanation) await page.getByText(question.explanation,{exact:true}).waitFor();
              await click(qIndex+1 < block.questions.length ? "Next" : "Continue");
            }
            break;
          case "builder":
            for(const [index,column] of block.columns.entries()) await clickReachable(page.locator(".builder-columns > div").nth(index).getByRole("button",{name:column.items[0],exact:true}),context);
            await click("Continue");
            if(block.feedback) await page.getByText(block.feedback,{exact:true}).waitFor();
            await click("Continue"); break;
          default: throw new Error(`No authored answer flow for ${context}`);
        }
        blocks++;
      }
      for(const [index,question] of (lesson.quiz || []).entries()) {
        context=`${lesson.id} quiz${index} ${width}px ${textSize}`;
        await page.getByRole("heading",{name:question.question,exact:true}).waitFor();
        assert.equal(await button("Choose an answer before continuing").isDisabled(),true,context);
        await click(question.options[question.correctIndex]);
        await click(index+1 < lesson.quiz.length ? "Next" : "See results");
        questions++;
      }
      assert.deepEqual(await outcome(),{type:"completed",score:lesson.quiz?.length || 0,calls:1},context);
      runs++;
      console.log(`PASS lesson: ${lesson.id} at ${width}px; ${lesson.blocks.length} blocks, ${lesson.quiz?.length || 0} quiz questions`);
    }
  }
  console.log(`PASS: ${runs} complete lesson journeys, ${blocks} authored blocks, ${questions} scored quiz questions and ${practiceQuestions} confidence practice questions; shard ${shard+1}/${shards}`);
}

export async function checkQuizRecovery(page,base) {
  const lesson=allLessons.find(lesson => lesson.id === "internet");
  const click=name => clickReachable(page.getByRole("button",{name,exact:true}),`quiz recovery: ${name}`);
  const answer=async (index,correct=true) => {
    const q=lesson.quiz[index];
    await page.getByRole("heading",{name:q.question,exact:true}).waitFor();
    await click(q.options[correct ? q.correctIndex : (q.correctIndex+1)%q.options.length]);
  };
  for(const [width,height,textSize] of [[320,568,"size-10"],[1440,900,"size-2"]]) {
    await page.setViewportSize({width,height});
    for(const skipped of [false,true]) {
      await page.goto(`${base}/tests/fixtures/lesson-journeys.html?id=internet&quiz=1&textSize=${textSize}&run=recovery-${width}-${skipped}`);
      await page.waitForSelector('body[data-lesson-ready="true"]',{state:"attached"});
      if(skipped) await click("Skip this step");
      else {
        await answer(0,false); await click("Next");
        await answer(1); await click("Go back");
        await answer(0); await click("Next");
      }
      await page.reload();
      for(let index=1;index<lesson.quiz.length;index++) {
        await answer(index);
        await click(index+1 < lesson.quiz.length ? "Next" : "See results");
      }
      await page.getByText("Second look",{exact:true}).waitFor();
      assert.equal(await page.getByTestId("lesson-outcome").count(),0);
      await answer(0,false); await click("Next");
      await page.reload();
      await page.getByText("Second look",{exact:true}).waitFor();
      await answer(0); await click("Finish lesson");
      assert.deepEqual(JSON.parse(await page.getByTestId("lesson-outcome").textContent()),{type:"completed",score:lesson.quiz.length-1,calls:1});
    }
    console.log(`PASS: quiz backtracking, first-attempt score, skipped-answer review and storage/reload recovery at ${width}px`);
  }
}
