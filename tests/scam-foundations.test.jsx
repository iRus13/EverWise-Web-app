import React from "react";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, expect, test, vi} from "vitest";
import {setLocale} from "../src/i18n";
import spanish from "../src/i18n/learning-es.json";
import {learningText, fillBlankParts} from "../src/i18n/learning.js";
import {lessonsByOrder, challengesByOrder} from "../src/data/lessons.js";
import BlockRenderer from "../src/components/blocks/BlockRenderer.jsx";
import ChallengePlayer from "../src/screens/ChallengePlayer.jsx";
import {assessmentRevision} from "../src/utils/assessmentProgress.js";
import Complete from "../src/screens/Complete.jsx";
const items=[...lessonsByOrder,...challengesByOrder].filter(item=>item.phase===8);
const t=text=>learningText(text,"es");
const props={progress:1,progressTotal:7,onBack:vi.fn(),onContinue:vi.fn()};
const renderBlock=(block,extra={})=>render(<BlockRenderer block={block} {...props} {...extra}/>);
vi.mock("../src/components/ReadAloud",()=>({default:({text})=><div data-testid="narration">{text}</div>}));
beforeEach(()=>setLocale("es"));
afterEach(()=>{cleanup();setLocale("en");vi.clearAllMocks();});

test("every first Scam Protection lesson and challenge has Spanish display copy",()=>{
 const keys=new Set();const metadata=new Set(["id","type","track","variant","nextKind","textRole","tier","url","videoUrl","videoId","color","accent","lessonId"]);
 function collect(value){if(typeof value==="string")keys.add(value);else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==="object")Object.entries(value).filter(([key])=>!metadata.has(key)).forEach(([,child])=>collect(child));}
 items.forEach(collect);expect(items).toHaveLength(5);expect(keys.size).toBeGreaterThan(300);
 for(const key of keys){expect(spanish[key]||t(key)!==key,key).toBeTruthy();expect(t(key).split("______").length,key).toBe(key.split("______").length);}
 for(const item of items)for(const block of item.blocks)for(const source of [block,...(block.practice||[])]){
  const options=(source.options??source.wordBank??[]).map(o=>typeof o==="string"?o:o.text);
  expect(new Set(options.map(o=>t(o).toLowerCase())).size).toBe(options.length);
 }
 const question=items[4].blocks[2].questions[0];const parts=fillBlankParts(question.text,question.answer,t);
 expect(parts.before+parts.word+parts.after).toBe("Una breve pausa te da tiempo para pensar antes de actuar.");
});

test.each(items.filter(item=>item.track==="scam"&&item.complete))("$id reading and completion use Spanish, with the lesson before its goal",lesson=>{
 const block=lesson.blocks[0];const {unmount}=renderBlock(block);
 expect(screen.getByRole("heading",{level:1})).toHaveTextContent(t(block.heading));
 const paragraphs=t(block.text).split(/\n\s*\n/);expect(paragraphs).toHaveLength(2);
 for(const p of paragraphs)expect(screen.getByText(p,{exact:true})).toBeVisible();
 const goal=screen.getByRole("heading",{name:t("Learning goal")});
 expect(screen.getByText(paragraphs[1],{exact:true}).compareDocumentPosition(goal)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 const narration=screen.getByTestId("narration").textContent;
 expect(narration.indexOf(t(block.question))).toBeLessThan(narration.indexOf(paragraphs[0]));
 expect(narration.indexOf(paragraphs[1])).toBeLessThan(narration.indexOf(t(block.objective)));
 unmount();render(<Complete lesson={lesson} onDone={vi.fn()}/>);
 expect(screen.getByText(t(lesson.complete.subtitle),{exact:true})).toBeVisible();
 expect(screen.getByRole("heading",{level:1})).toHaveTextContent("¡Lección completada!");
});

test.each(["best","safe","unsafe"])("a %s answer is distinct from the recommended alternative",tier=>{
 const block=items[0].blocks.find(b=>b.type==="tiered"&&b.options.some(o=>o.tier===tier));renderBlock(block);
 const option=block.options.find(o=>o.tier===tier);fireEvent.click(screen.getByRole("button",{name:t(option.text),exact:true}));
 expect(screen.getByRole("status")).toHaveTextContent(t(option.feedback));
 expect(screen.getByTestId("narration")).toHaveTextContent(t(option.feedback));
 for(const other of block.options.filter(o=>o!==option))expect(screen.getByTestId("narration")).not.toHaveTextContent(t(other.feedback));
 for(const o of block.options){const button=screen.getByRole("button",{name:t(o.text),exact:true});expect(button).toBeDisabled();expect(button).toHaveAttribute("aria-pressed",String(o===option));if(o!==option)expect(button).toHaveAttribute("data-answer-state","other");}
 if(tier!=="best")expect(screen.getByRole("status")).toHaveTextContent(t("Best answer"));
 fireEvent.click(screen.getByRole("button",{name:"Continuar",exact:true}));expect(props.onContinue).toHaveBeenCalledOnce();
});

test("extra practice requires confirmation, completes both questions and resets the choice",()=>{
 const block=items[0].blocks.find(b=>b.type==="confidence");renderBlock(block);
 expect(screen.getByRole("button",{name:"Continuar",exact:true})).toBeDisabled();
 fireEvent.click(screen.getByRole("button",{name:t("I'd like more practice"),exact:true}));
 expect(screen.getByTestId("narration")).toHaveTextContent(t(block.question));expect(props.onContinue).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button",{name:"Continuar",exact:true}));
 for(let i=0;i<block.practice.length;i++){
  const q=block.practice.find(q=>screen.queryByRole("heading",{name:t(q.question),exact:true}));expect(q).toBeTruthy();
  expect(screen.getByText(`Práctica ${i+1} de ${block.practice.length}`)).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:t(q.options[0].text),exact:true}));
  fireEvent.click(screen.getByRole("button",{name:t(i+1===block.practice.length?"Done practicing":"Next"),exact:true}));
 }
 expect(screen.getByRole("heading",{name:t(block.question),exact:true})).toHaveFocus();
 expect(screen.getByRole("button",{name:"Continuar",exact:true})).toBeDisabled();
 fireEvent.click(screen.getByRole("button",{name:t("Mostly confident"),exact:true}));
 expect(props.onContinue).not.toHaveBeenCalled();fireEvent.click(screen.getByRole("button",{name:"Continuar",exact:true}));expect(props.onContinue).toHaveBeenCalledOnce();
});

test("memory connections and final decision localize their complete visible and spoken context",()=>{
 const lesson=items.find(x=>x.id==="scam-stop-verify-decide");const memory=lesson.blocks.find(b=>b.type==="memory");const {unmount}=renderBlock(memory);
 for(const link of memory.links){expect(screen.getByRole("heading",{name:t(link.lesson)})).toBeVisible();expect(screen.getByTestId("narration")).toHaveTextContent(t(link.note));}
 unmount();const block=lesson.blocks.find(b=>b.type==="finalboss");renderBlock(block);
 expect(screen.getByRole("heading",{level:1})).toHaveTextContent(t(block.question));
 for(const option of block.options)expect(screen.getByTestId("narration")).toHaveTextContent(t(option.text));
 const unsafe=block.options.find(o=>o.tier==="unsafe");fireEvent.click(screen.getByRole("button",{name:t(unsafe.text),exact:true}));
 expect(screen.getByRole("status")).toHaveTextContent(t(unsafe.feedback));expect(screen.getByRole("status")).toHaveTextContent(t(block.options.find(o=>o.tier==="best").text));
 expect(screen.getByTestId("narration")).toHaveTextContent(t(unsafe.feedback));
 expect(screen.getByTestId("narration")).not.toHaveTextContent(t(block.options.find(o=>o.tier==="best").feedback));
});

test("changing language while on a Scam Protection activity updates the authored copy",()=>{
 const block=items[0].blocks[1];renderBlock(block);expect(screen.getByRole("heading",{level:1})).toHaveTextContent(t(block.question));
 act(()=>setLocale("en"));expect(screen.getByRole("heading",{level:1})).toHaveTextContent(block.question);
});

test("scam lessons do not claim their phase is complete before its challenge",()=>{
 for(const lesson of lessonsByOrder.filter(x=>x.phase>=8)){
  expect(lesson.complete?.title||"").not.toMatch(/^Phase \d+ complete/);
  expect(lesson.complete?.subtitle||"").not.toMatch(/— and all of|entire Scam Protection course/);
 }
});

test("the first Scam Protection challenge hands off to a translated next-lesson title",()=>{
 const challenge=items.find(x=>x.id==="phase8-challenge");
 render(<ChallengePlayer challenge={challenge} onBack={vi.fn()} onComplete={vi.fn()} initialPosition={{kind:"challenge",revision:assessmentRevision(challenge),blockIndex:4,finished:true}}/>);
 expect(screen.getByText("La llamada inesperada",{exact:true})).toBeVisible();
 expect(screen.queryByText("The Unexpected Call")).not.toBeInTheDocument();
});
