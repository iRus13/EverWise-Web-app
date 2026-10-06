import React from "react";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, expect, test, vi} from "vitest";
import {setLocale} from "../src/i18n";
import spanish from "../src/i18n/learning-es.json";
import {learningText, fillBlankParts} from "../src/i18n/learning.js";
import {lessonsByOrder, challengesByOrder} from "../src/data/lessons.js";
import BlockRenderer from "../src/components/blocks/BlockRenderer.jsx";
import ChallengePlayer from "../src/screens/ChallengePlayer.jsx";
import {assessmentRevision} from "../src/utils/assessmentProgress.js";
import Complete from "../src/screens/Complete.jsx";
const items=[...lessonsByOrder,...challengesByOrder].filter(item=>item.phase===9);
const t=text=>learningText(text,"es");
const props={progress:1,progressTotal:7,onBack:vi.fn(),onContinue:vi.fn()};
const renderBlock=(block,extra={})=>render(<BlockRenderer block={block} {...props} {...extra}/>);
vi.mock("../src/components/ReadAloud",()=>({default:({text})=><div data-testid="narration">{text}</div>}));
beforeEach(()=>setLocale("es"));
afterEach(()=>{cleanup();setLocale("en");vi.clearAllMocks();});

test("every Warning Signs lesson and challenge has Spanish display copy",()=>{
 const keys=new Set();const metadata=new Set(["id","type","track","variant","nextKind","textRole","tier","url","videoUrl","videoId","color","accent","lessonId"]);
 function collect(value){if(typeof value==="string")keys.add(value);else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==="object")Object.entries(value).filter(([key])=>!metadata.has(key)).forEach(([,child])=>collect(child));}
 items.forEach(collect);expect(items).toHaveLength(6);expect(keys.size).toBeGreaterThan(380);
 for(const key of keys){expect(spanish[key]||t(key)!==key,key).toBeTruthy();expect(t(key).split("______").length,key).toBe(key.split("______").length);}
 for(const item of items)for(const block of item.blocks)for(const source of [block,...(block.practice||[])]){
  const options=(source.options??source.wordBank??[]).map(o=>typeof o==="string"?o:o.text);
  expect(new Set(options.map(o=>t(o).toLowerCase())).size).toBe(options.length);
 }
 const question=items[5].blocks[2].questions[0];const parts=fillBlankParts(question.text,question.answer,t);
 expect(parts.before+parts.word+parts.after).toBe("Una petición de mantener un pago en secreto es una señal de alerta.");
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

test("example messages translate sender and link without presenting a fake control",()=>{
 const block=items.find(x=>x.id==="scam-always-verify").blocks.find(b=>b.type==="finalboss");renderBlock(block);
 expect(screen.getByRole("heading",{name:"Ejemplos para revisar"})).toBeVisible();
 expect(screen.getByText("Correo · Tu banco",{exact:true})).toBeVisible();
 expect(screen.getByText("Enlace mostrado: Revisar actividad",{exact:true})).toBeVisible();
 expect(screen.getByText(t("Example only — this cannot be tapped."),{exact:true})).toBeVisible();
 expect(screen.queryByRole("button",{name:/Revisar actividad/})).not.toBeInTheDocument();
 expect(screen.queryByRole("link",{name:/Revisar actividad/})).not.toBeInTheDocument();
 const narration=screen.getByTestId("narration").textContent;
 for(const text of ["Correo · Tu banco","Enlace mostrado: Revisar actividad",t("Example only — this cannot be tapped.")]) expect(narration).toContain(text);
 expect(narration).not.toContain("Review activity");
 const unsafe=block.options.find(x=>x.tier==="unsafe");fireEvent.click(screen.getByRole("button",{name:t(unsafe.text),exact:true}));
 expect(screen.getByRole("status")).toHaveTextContent(t(unsafe.feedback));
 expect(screen.getByTestId("narration")).toHaveTextContent(t(unsafe.feedback));
 fireEvent.click(screen.getByRole("button",{name:"Continuar",exact:true}));expect(props.onContinue).toHaveBeenCalledOnce();
});

test("the Warning Signs challenge hands off to the translated next lesson",()=>{
 const challenge=items.find(x=>x.id==="phase9-challenge");
 render(<ChallengePlayer challenge={challenge} onBack={vi.fn()} onComplete={vi.fn()} initialPosition={{kind:"challenge",revision:assessmentRevision(challenge),blockIndex:4,finished:true}}/>);
 expect(screen.getByText("Cualquiera puede fingir ser otra persona",{exact:true})).toBeVisible();
 expect(screen.queryByText("Anyone Can Pretend")).not.toBeInTheDocument();
});
