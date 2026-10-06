import React from "react";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, expect, test, vi} from "vitest";
import {setLocale} from "../src/i18n";
import spanish from "../src/i18n/learning-es.json";
import scenarioPresentations from "../src/data/scenario-presentations.json";
import examPresentations from "../src/data/exam-presentations.json";
import {fillBlankParts, learningText} from "../src/i18n/learning.js";
import {lessonsByOrder, challengesByOrder, examsByOrder} from "../src/data/lessons.js";
import {courseSuccessor} from "../src/utils/courseProgress.js";
import BlockRenderer from "../src/components/blocks/BlockRenderer.jsx";
import LessonPlayer from "../src/screens/LessonPlayer.jsx";
import ChallengePlayer from "../src/screens/ChallengePlayer.jsx";
import Complete from "../src/screens/Complete.jsx";
import ExamPlayer from "../src/screens/ExamPlayer.jsx";
import ProgressSaveNotice from "../src/components/ProgressSaveNotice.jsx";
import LessonPath from "../src/screens/LessonPath.jsx";
import LanguageSelect from "../src/components/LanguageSelect.jsx";
import {assessmentRevision} from "../src/utils/assessmentProgress.js";

const lessons = lessonsByOrder.filter(item => item.phase === 1);
const challenge = challengesByOrder.find(item => item.phase === 1);
const accountLessons = lessonsByOrder.filter(item => ["strong-passwords","password-managers","two-factor-auth"].includes(item.id));
const safeInternetItems = [...lessonsByOrder, ...challengesByOrder].filter(item => item.phase === 2);
const healthItems = [...lessonsByOrder, ...challengesByOrder].filter(item => item.phase === 5);
const financeItems = [...lessonsByOrder, ...challengesByOrder].filter(item => item.phase === 4);
const communicationItems = [...lessonsByOrder, ...challengesByOrder].filter(item => item.phase === 3);
const internet = lessons.find(item => item.id === "internet");
const t = (text, values) => learningText(text, "es", values);
const blockOf = type => internet.blocks.find(block => block.type === type);
const renderBlock = (block, props = {}) => render(<BlockRenderer block={block} progress={1} progressTotal={2} onBack={vi.fn()} onContinue={vi.fn()} {...props} />);
beforeEach(() => setLocale("es"));
afterEach(() => {cleanup(); setLocale("en"); vi.unstubAllGlobals();});

test("all Health and Government display copy and word banks have Spanish without changing choice identity", () => {
  const keys = new Set();
  const metadata = new Set(["id","type","track","variant","nextKind","textRole","tier","url","videoUrl","videoId","color","accent","lessonId"]);
  function collect(value) {
    if (typeof value === "string") keys.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.entries(value).filter(([key]) => !metadata.has(key)).forEach(([,child]) => collect(child));
  }
  healthItems.forEach(collect);
  expect(healthItems).toHaveLength(8);
  expect(keys.size).toBe(732);
  for (const key of keys) {
    expect(spanish[key] || t(key) !== key, key).toBeTruthy();
    expect(t(key).split("______").length, key).toBe(key.split("______").length);
  }
  for (const item of healthItems) for (const block of item.blocks) {
    const options = (block.options ?? block.wordBank ?? []).map(option => typeof option === "string" ? option : option.text);
    expect(new Set(options.map(option => t(option).toLowerCase())).size).toBe(options.length);
    for (const word of block.wordBank ?? []) expect(spanish[`fillblank.word.${word}`], word).toBeTruthy();
  }
});

test.each(healthItems.filter(item => item.quiz))("$id opens and completes with Spanish Health and Government copy", lesson => {
  const {unmount} = render(<LessonPlayer lesson={lesson} onBack={vi.fn()} onComplete={vi.fn()} />);
  expect(screen.getByRole("heading", {level:1})).toHaveTextContent(t(lesson.blocks[0].heading));
  expect(screen.getByRole("button", {name:"Leer en voz alta",exact:true})).toBeVisible();
  unmount();
  render(<Complete lesson={lesson} onDone={vi.fn()} />);
  expect(screen.getByText(t(lesson.complete.subtitle), {exact:true})).toBeVisible();
});

test.each(healthItems)("$id fill practice scores canonical answers and inserts translated words", item => {
  const block = item.blocks.find(block => block.type === "fillblank");
  const onContinue = vi.fn();
  renderBlock(block, {onContinue});
  for (const [index, question] of block.questions.entries()) {
    fireEvent.click(screen.getByRole("button", {name:t(question.answer),exact:true}));
    const {before, word, after} = fillBlankParts(question.text, question.answer, t);
    expect(screen.getByRole("heading", {level:1})).toHaveTextContent(before + word + after);
    expect(screen.getByRole("status")).toHaveClass("lesson-feedback-positive");
    fireEvent.click(screen.getByRole("button", {name:index === block.questions.length - 1 ? "Continuar" : "Siguiente",exact:true}));
  }
  expect(onContinue).toHaveBeenCalledOnce();
});

test("Health and Government challenge completion leads to the translated exam", () => {
  const challenge = healthItems.find(item => item.id === "phase5-challenge");
  const onComplete = vi.fn();
  render(<ChallengePlayer challenge={challenge} onBack={vi.fn()} onComplete={onComplete}
    initialPosition={{kind:"challenge",revision:assessmentRevision(challenge),blockIndex:4,finished:true}} />);
  expect(screen.getByText("Evaluación final de la etapa 5: Salud y servicios públicos", {exact:true})).toBeVisible();
  fireEvent.click(screen.getByRole("button", {name:"Volver a tu recorrido",exact:true}));
  expect(onComplete).toHaveBeenCalledOnce();
});

test("all Digital Finance display copy and word banks have Spanish without changing choice identity", () => {
  const keys = new Set();
  const metadata = new Set(["id","type","track","variant","nextKind","textRole","tier","url","videoUrl","videoId","color","accent","lessonId"]);
  function collect(value) {
    if (typeof value === "string") keys.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.entries(value).filter(([key]) => !metadata.has(key)).forEach(([,child]) => collect(child));
  }
  financeItems.forEach(collect);
  expect(financeItems).toHaveLength(8);
  expect(keys.size).toBe(869);
  for (const key of keys) {
    expect(spanish[key] || t(key) !== key, key).toBeTruthy();
    expect(t(key).split("______").length, key).toBe(key.split("______").length);
  }
  for (const item of financeItems) for (const block of item.blocks) {
    const options = (block.options ?? block.wordBank ?? []).map(option => typeof option === "string" ? option : option.text);
    expect(new Set(options.map(option => t(option).toLowerCase())).size).toBe(options.length);
    for (const word of block.wordBank ?? []) expect(spanish[`fillblank.word.${word}`], word).toBeTruthy();
  }
});

test.each(financeItems.filter(item => item.quiz))("$id opens and completes with Spanish Digital Finance copy", lesson => {
  const {unmount} = render(<LessonPlayer lesson={lesson} onBack={vi.fn()} onComplete={vi.fn()} />);
  expect(screen.getByRole("heading", {level:1})).toHaveTextContent(t(lesson.blocks[0].heading));
  expect(screen.getByRole("button", {name:"Leer en voz alta",exact:true})).toBeVisible();
  unmount();
  render(<Complete lesson={lesson} onDone={vi.fn()} />);
  expect(screen.getByText(t(lesson.complete.subtitle), {exact:true})).toBeVisible();
});

test.each(financeItems)("$id fill practice scores canonical answers and inserts translated words", item => {
  const block = item.blocks.find(block => block.type === "fillblank");
  const onContinue = vi.fn();
  renderBlock(block, {onContinue});
  for (const [index, question] of block.questions.entries()) {
    fireEvent.click(screen.getByRole("button", {name:t(question.answer),exact:true}));
    const {before, word, after} = fillBlankParts(question.text, question.answer, t);
    expect(screen.getByRole("heading", {level:1})).toHaveTextContent(before + word + after);
    expect(screen.getByRole("status")).toHaveClass("lesson-feedback-positive");
    fireEvent.click(screen.getByRole("button", {name:index === block.questions.length - 1 ? "Continuar" : "Siguiente",exact:true}));
  }
  expect(onContinue).toHaveBeenCalledOnce();
});

test("Digital Finance challenge completion leads to the translated exam", () => {
  const challenge = financeItems.find(item => item.id === "phase4-challenge");
  const onComplete = vi.fn();
  render(<ChallengePlayer challenge={challenge} onBack={vi.fn()} onComplete={onComplete}
    initialPosition={{kind:"challenge",revision:assessmentRevision(challenge),blockIndex:4,finished:true}} />);
  expect(screen.getByText("Evaluación final de la etapa 4: Finanzas digitales", {exact:true})).toBeVisible();
  fireEvent.click(screen.getByRole("button", {name:"Volver a tu recorrido",exact:true}));
  expect(onComplete).toHaveBeenCalledOnce();
});

test("all Communication display copy and word banks have Spanish without changing choice identity", () => {
  const keys = new Set();
  const metadata = new Set(["id","type","track","variant","nextKind","textRole","tier","url","videoUrl","videoId","color","accent","lessonId"]);
  function collect(value) {
    if (typeof value === "string") keys.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.entries(value).filter(([key]) => !metadata.has(key)).forEach(([,child]) => collect(child));
  }
  communicationItems.forEach(collect);
  expect(communicationItems).toHaveLength(8);
  expect(keys.size).toBe(869);
  for (const key of keys) {
    expect(spanish[key] || t(key) !== key, key).toBeTruthy();
    expect(t(key).split("______").length, key).toBe(key.split("______").length);
  }
  for (const item of communicationItems) for (const block of item.blocks) {
    const options = (block.options ?? block.wordBank ?? []).map(option => typeof option === "string" ? option : option.text);
    expect(new Set(options.map(option => t(option).toLowerCase())).size).toBe(options.length);
    for (const word of block.wordBank ?? []) expect(spanish[`fillblank.word.${word}`], word).toBeTruthy();
  }
});

test.each(communicationItems.filter(item => item.quiz))("$id opens and completes with Spanish Communication copy", lesson => {
  const {unmount} = render(<LessonPlayer lesson={lesson} onBack={vi.fn()} onComplete={vi.fn()} />);
  expect(screen.getByRole("heading", {level:1})).toHaveTextContent(t(lesson.blocks[0].heading));
  expect(screen.getByRole("button", {name:"Leer en voz alta",exact:true})).toBeVisible();
  unmount();
  render(<Complete lesson={lesson} onDone={vi.fn()} />);
  expect(screen.getByText(t(lesson.complete.subtitle), {exact:true})).toBeVisible();
});

test.each(communicationItems)("$id fill practice scores canonical answers and inserts translated words", item => {
  const block = item.blocks.find(block => block.type === "fillblank");
  const onContinue = vi.fn();
  renderBlock(block, {onContinue});
  for (const [index, question] of block.questions.entries()) {
    fireEvent.click(screen.getByRole("button", {name:t(question.answer),exact:true}));
    const {before, word, after} = fillBlankParts(question.text, question.answer, t);
    expect(screen.getByRole("heading", {level:1})).toHaveTextContent(before + word + after);
    expect(screen.getByRole("status")).toHaveClass("lesson-feedback-positive");
    fireEvent.click(screen.getByRole("button", {name:index === block.questions.length - 1 ? "Continuar" : "Siguiente",exact:true}));
  }
  expect(onContinue).toHaveBeenCalledOnce();
});

test("Communication challenge completion leads to the translated exam", () => {
  const challenge = communicationItems.find(item => item.id === "phase3-challenge");
  const onComplete = vi.fn();
  render(<ChallengePlayer challenge={challenge} onBack={vi.fn()} onComplete={onComplete}
    initialPosition={{kind:"challenge",revision:assessmentRevision(challenge),blockIndex:4,finished:true}} />);
  expect(screen.getByText("Evaluación final de la etapa 3: Comunicación", {exact:true})).toBeVisible();
  fireEvent.click(screen.getByRole("button", {name:"Volver a tu recorrido",exact:true}));
  expect(onComplete).toHaveBeenCalledOnce();
});

test("all Safe Internet Habits lessons and the final challenge have translated copy and distinct answers", () => {
  const keys = new Set();
  const metadata = new Set(["id","type","track","variant","nextKind","textRole","tier","url","videoUrl","videoId","color","accent","lessonId"]);
  function collect(value) {
    if (typeof value === "string") keys.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.entries(value).filter(([key]) => !metadata.has(key)).forEach(([,child]) => collect(child));
  }
  safeInternetItems.forEach(collect);
  expect(safeInternetItems).toHaveLength(10);
  expect(keys.size).toBeGreaterThan(950);
  for (const key of keys) {
    expect(t(key), key).toBeTruthy();
    expect(spanish[key] || t(key) !== key, key).toBeTruthy();
    expect(t(key).split("______").length, key).toBe(key.split("______").length);
  }
  for (const item of safeInternetItems) for (const block of item.blocks) {
    const options = (block.options ?? block.wordBank ?? []).map(option => typeof option === "string" ? option : option.text);
    expect(new Set(options.map(option => t(option).toLowerCase())).size).toBe(options.length);
  }
});

test("Spanish location sentences preserve product names and grammatical context", () => {
  const sentence = (source, answer) => { const {before, after, word} = fillBlankParts(source, answer, t); return before + word + after; };
  expect(sentence("Google ______ uses your location to give directions.", "Maps")).toBe("Google Maps usa tu ubicación para darte indicaciones.");
  expect(sentence("Only share your live location with people you ______.", "Trusted")).toBe("Comparte tu ubicación en tiempo real solo con personas de confianza.");
  expect(sentence("Many updates repair ______ problems.", "Security")).toBe("Muchas actualizaciones corrigen problemas de seguridad.");
});

test("connection-security assessment teaches encryption without equating it with trust", () => {
  const wifi = safeInternetItems.find(item => item.id === "public-wifi");
  const question = wifi.quiz.find(item => item.question.startsWith("What does HTTPS"));
  expect(question.correctIndex).toBe(2);
  expect(question.options[question.correctIndex]).toBe("Data is encrypted in transit");
  expect(question.options.indexOf("The website is automatically trustworthy")).not.toBe(question.correctIndex);
  expect(new Set(question.options.map(t)).size).toBe(question.options.length);
});

test("all 50 exam questions preserve distinct translated answers and literal examples", () => {
  const questions=examsByOrder.flatMap(exam=>exam.questions);
  expect(questions).toHaveLength(50);
  for(const question of questions) {
    const reading=examPresentations[question.question] ?? {question:question.question};
    for(const key of [question.question,...question.options,question.explanation,reading.story,reading.question].filter(Boolean)) {
      expect(spanish[key],key).toBeTruthy();
      expect(spanish[key].split("______").length,key).toBe(key.split("______").length);
    }
    expect(new Set(question.options.map(option=>t(option).toLowerCase())).size).toBe(question.options.length);
    for(const option of question.options.filter(value=>/^(?:[a-z0-9-]+\.)+(?:com|net|gov)$/.test(value) || ["gov","DMV","USPS","password123","Linda1950","Sunshine2025","BlueRiver$Garden88"].includes(value))) expect(t(option)).toBe(option);
    if(reading.story) {
      expect([`${reading.story} ${reading.question}`,`True or False: ${reading.story}`,reading.story]).toContain(question.question);
    } else if(reading.question!==question.question) {
      expect(question.question).toBe("Which email address looks more trustworthy?");
      expect(reading.question).toBe("Which website address is the official PayPal domain?");
    }
  }
});

test.each(examsByOrder.flatMap(exam=>exam.questions.map((question,index)=>({exam,question,index,name:`${exam.id} question ${index+1}`}))))("$name renders Spanish question and every answer without changing its canonical selection", ({exam,question,index}) => {
  const onPositionChange=vi.fn();
  render(<ExamPlayer exam={exam} onBack={vi.fn()} onPass={vi.fn()} onPositionChange={onPositionChange}
    initialPosition={{kind:"exam",revision:assessmentRevision(exam),phase:"quiz",answers:Array(index).fill(null),selected:null}} />);
  const reading=examPresentations[question.question] ?? {question:question.question};
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent(t(reading.question));
  if(reading.story) expect(screen.getByText(t(reading.story))).toHaveClass("lesson-scenario-story");
  expect(screen.getAllByText(`Pregunta ${index+1} de ${exam.questions.length}`)).toHaveLength(1);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext",`Pregunta ${index+1} de ${exam.questions.length}`);
  for(const option of question.options) expect(screen.getByRole("button",{name:t(option),exact:true})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:t(question.options[question.correctIndex]),exact:true}));
  expect(onPositionChange).toHaveBeenLastCalledWith(expect.objectContaining({selected:question.correctIndex,answers:Array(index).fill(null)}));
});

test.each([["phase7-exam",0],["phase3-exam",2],["phase7-exam",7]])("exam narration follows the displayed %s question %s", (id,index) => {
  const exam=examsByOrder.find(exam=>exam.id===id);
  const fetch=vi.fn(()=>new Promise(()=>{}));
  vi.stubGlobal("fetch",fetch);
  render(<ExamPlayer exam={exam} onBack={vi.fn()} onPass={vi.fn()}
    initialPosition={{kind:"exam",revision:assessmentRevision(exam),phase:"quiz",answers:Array(index).fill(null),selected:null}} />);
  fireEvent.click(screen.getByRole("button",{name:"Leer esto en voz alta",exact:true}));
  const reading=examPresentations[exam.questions[index].question];
  expect(fetch).toHaveBeenCalledOnce();
  const fields=reading.question === "True or false?" ? [reading.question,reading.story] : [reading.story,reading.question];
  expect(JSON.parse(fetch.mock.calls[0][1].body).text).toBe(fields.filter(Boolean).map(text=>t(text)).join("\n\n"));
  if(reading.question === "True or false?") expect(screen.getByRole("heading",{level:1}).compareDocumentPosition(screen.getByText(t(reading.story)))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

test("an unknown exam question keeps its complete wording", () => {
  const exam={...examsByOrder[0],questions:[{question:"A future question with its complete context?",options:["Alpha","Beta"],correctIndex:0}]};
  render(<ExamPlayer exam={exam} onBack={vi.fn()} onPass={vi.fn()}
    initialPosition={{kind:"exam",revision:assessmentRevision(exam),phase:"quiz",answers:[],selected:null}} />);
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent(exam.questions[0].question);
  expect(screen.getByRole("button",{name:"Alpha",exact:true})).toBeVisible();
});

test("Spanish multiple-answer review distinguishes selection and correctness", () => {
  renderBlock(blockOf("multiselect"));
  fireEvent.click(screen.getByRole("button",{name:"Leer un periódico impreso",exact:true}));
  fireEvent.click(screen.getByRole("button",{name:"Ver Netflix",exact:true}));
  fireEvent.click(screen.getByRole("button",{name:"Comprobar",exact:true}));
  expect(screen.getByRole("status")).toHaveTextContent("Hay algunas opciones que debes revisar.");
  expect(screen.getByRole("button",{name:"Leer un periódico impreso Tu elección · Incorrecta"})).toHaveAttribute("aria-pressed","true");
  expect(screen.getByRole("button",{name:"Ver Netflix Tu elección · Correcta"})).toHaveAttribute("aria-pressed","true");
  expect(screen.getByRole("button",{name:"Enviar un correo electrónico Opción correcta · No seleccionada"})).toHaveAttribute("aria-pressed","false");
});

test("three account safety lessons have complete Spanish copy and distinct answers", () => {
  const keys=new Set();
  const metadata=new Set(["id","type","track","variant","nextKind","textRole","tier","url","videoUrl","videoId","color","accent","lessonId"]);
  function collect(value) {
    if(typeof value==="string") keys.add(value);
    else if(Array.isArray(value)) value.forEach(collect);
    else if(value && typeof value==="object") Object.entries(value).filter(([key])=>!metadata.has(key)).forEach(([,child])=>collect(child));
  }
  accountLessons.forEach(collect);
  expect(accountLessons).toHaveLength(3);
  expect(keys.size).toBe(332);
  for(const key of keys) {
    expect(spanish[key],key).toBeTruthy();
    expect(spanish[key].split("______").length,key).toBe(key.split("______").length);
  }
  for(const lesson of accountLessons) for(const block of lesson.blocks) {
    const options=(block.options ?? block.wordBank ?? []).map(option=>typeof option==="string"?option:option.text);
    expect(new Set(options.map(option=>t(option).toLowerCase())).size).toBe(options.length);
  }
});

test("every separated scenario preserves the complete authored text", () => {
  for(const [source,presentation] of Object.entries(scenarioPresentations)) {
    expect(`${presentation.story} ${presentation.question}`).toBe(source);
    expect(presentation.story.trim()).toBeTruthy();
    expect(presentation.question.trim()).toBeTruthy();
  }
  for(const lesson of [...lessons,...accountLessons]) for(const block of lesson.blocks) {
    if(block.type !== "scenario") continue;
    const presentation=scenarioPresentations[block.text];
    if(presentation) for(const field of Object.values(presentation)) expect(spanish[field],field).toBeTruthy();
  }
});

test.each(["en","es"])("scenario stories have body hierarchy and a focused question in %s", language => {
  setLocale(language);
  const block=accountLessons[2].blocks.find(block=>block.text?.startsWith("Robert receives a text:"));
  renderBlock(block);
  const presentation=scenarioPresentations[block.text];
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent(learningText(presentation.question,language));
  expect(screen.getByText(learningText(presentation.story,language))).toHaveClass("lesson-scenario-story");
  expect(screen.queryByRole("heading",{name:learningText(block.text,language)})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:learningText(block.options[block.correctIndex],language),exact:true}));
  expect(screen.getByRole("status")).toHaveClass("lesson-feedback-positive");
});

test("unmapped scenarios keep their full question and literal examples", () => {
  renderBlock({type:"scenario",title:"Example",text:"An unfamiliar example at https://example.com. What next?",options:["Pause","Proceed"],correctIndex:0});
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent("An unfamiliar example at https://example.com. What next?");
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

test.each(accountLessons)("$id opens and completes with Spanish course copy", lesson => {
  const {unmount}=render(<LessonPlayer lesson={lesson} onBack={vi.fn()} onComplete={vi.fn()} />);
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent(t(lesson.blocks[0].heading));
  expect(screen.getByRole("button",{name:"Continuar",exact:true})).toBeVisible();
  unmount();
  render(<Complete lesson={lesson} onDone={vi.fn()} />);
  expect(screen.getByText(t(lesson.complete.subtitle),{exact:true})).toBeVisible();
});

test("translated password choices and result survive a language change", () => {
  const block=accountLessons[0].blocks.find(block=>block.type==="builder");
  const onContinue=vi.fn();
  renderBlock(block,{onContinue});
  for(const column of block.columns) fireEvent.click(screen.getByRole("button",{name:t(column.items[0]),exact:true}));
  expect(screen.getAllByText("Bosque!42Café")).toHaveLength(2);
  act(()=>setLocale("en"));
  expect(screen.getAllByText("Forest!42Coffee")).toHaveLength(2);
  for(const column of block.columns) expect(screen.getByRole("button",{name:column.items[0],exact:true})).toHaveAttribute("aria-pressed","true");
  act(()=>setLocale("es"));
  fireEvent.click(screen.getByRole("button",{name:"Continuar",exact:true}));
  expect(screen.getByRole("status")).toHaveTextContent(t(block.feedback));
  fireEvent.click(screen.getByRole("button",{name:"Continuar",exact:true}));
  expect(onContinue).toHaveBeenCalledOnce();
  expect(block.columns[0].items[0]).toBe("Forest");
});

test("verification practice inserts Spanish phrases and scores canonical answers", () => {
  const block=accountLessons[2].blocks.find(block=>block.type==="fillblank");
  renderBlock(block);
  fireEvent.click(screen.getByRole("button",{name:"Verificación en dos pasos",exact:true}));
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent("La verificación en dos pasos añade una capa de seguridad a tu cuenta.");
  expect(screen.getByRole("status")).toHaveClass("lesson-feedback-positive");
  fireEvent.click(screen.getByRole("button",{name:"Siguiente",exact:true}));
  fireEvent.click(screen.getByRole("button",{name:t("Password"),exact:true}));
  expect(screen.getByRole("status")).toHaveClass("lesson-feedback-caution");
  expect(screen.getByRole("status")).toHaveTextContent("código de verificación");
  expect(block.questions[0].answer).toBe("2FA");
});

test("all Foundations display strings have Spanish copy without changing canonical answers", () => {
  const keys = new Set();
  const metadata = new Set(["id","type","track","variant","nextKind","textRole","tier","url","videoUrl","videoId","color","accent","lessonId"]);
  function collect(value) {
    if (typeof value === "string") keys.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.entries(value).filter(([key]) => !metadata.has(key)).forEach(([,child]) => collect(child));
  }
  [...lessons,challenge].forEach(collect);
  expect(lessons).toHaveLength(9);
  expect(keys.size).toBe(881);
  for (const key of keys) {
    expect(spanish[key], key).toBeTruthy();
    expect(spanish[key].split("______").length, key).toBe(key.split("______").length);
  }
  for (const item of [...lessons,challenge]) for (const block of item.blocks) {
    if (block.wordBank) {
      expect(new Set(block.wordBank.map(word => t(word).toLowerCase())).size).toBe(block.wordBank.length);
      for (const word of block.wordBank) expect(spanish[`fillblank.word.${word}`], word).toBeTruthy();
    }
  }
  expect(blockOf("fillblank").questions[1].answer).toBe("Website");
  expect(blockOf("fillblank").wordBank).toContain("Website");
});

test.each(lessons)("$id opens with Spanish reading and controls", lesson => {
  render(<LessonPlayer lesson={lesson} onBack={vi.fn()} onComplete={vi.fn()} />);
  expect(screen.getByRole("heading", {level:1})).toHaveTextContent(t(lesson.blocks[0].heading));
  expect(screen.getByRole("button", {name:"Continuar",exact:true})).toBeVisible();
  expect(screen.getByRole("button", {name:"Leer en voz alta",exact:true})).toBeVisible();
  expect(screen.getByRole("progressbar", {name:"Progreso de la lección"})).toHaveAttribute("aria-valuenow","1");
});

test("multiple selections survive a language change and score their original indices", () => {
  const block = blockOf("multiselect");
  renderBlock(block);
  block.options.forEach(option => { if(option.correct) fireEvent.click(screen.getByRole("button", {name:t(option.text),exact:true})); });
  act(() => setLocale("en"));
  for (const option of block.options.filter(option => option.correct)) expect(screen.getByRole("button", {name:option.text,exact:true})).toHaveAttribute("aria-pressed","true");
  act(() => setLocale("es"));
  fireEvent.click(screen.getByRole("button", {name:"Comprobar",exact:true}));
  expect(screen.getByRole("status")).toHaveTextContent(t(block.feedback));
  expect(screen.getByRole("status")).toHaveClass("lesson-feedback-positive");
});

test("a wrong fill answer keeps canonical scoring and displays the correct Spanish sentence", () => {
  const block = blockOf("fillblank");
  renderBlock(block);
  fireEvent.click(screen.getByRole("button", {name:t("Book"),exact:true}));
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Internet conecta millones de dispositivos en todo el mundo.");
  expect(screen.getByRole("status")).toHaveClass("lesson-feedback-caution");
  expect(screen.getByRole("status")).toHaveTextContent(t(block.questions[0].wrong.Book));
  fireEvent.click(screen.getByRole("button", {name:"Siguiente",exact:true}));
  fireEvent.click(screen.getByRole("button", {name:t("Website"),exact:true}));
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Google.com es un sitio web.");
  expect(screen.getByRole("status")).toHaveClass("lesson-feedback-positive");
});

test("sentence insertion translates the template before choosing contextual capitalization", () => {
  expect(fillBlankParts("Google.com is a ______.","Website",t)).toEqual({before:"Google.com es un ",after:".",word:"sitio web"});
  expect(fillBlankParts("The ______ connects millions of devices around the world.","Internet",t).word).toBe("Internet");
  expect(fillBlankParts("Google.com is a ______.","Website",s => learningText(s,"en"))).toEqual({before:"Google.com is a ",after:".",word:"Website"});
});

test("flashcards translate both faces, turn controls and card counts", () => {
  const block = blockOf("flashcards");
  renderBlock(block);
  expect(screen.getByText("Tarjeta 1 de 5")).toBeVisible();
  fireEvent.click(screen.getByRole("button", {name:"Mostrar el reverso de la tarjeta"}));
  expect(screen.getByRole("button", {name:"Mostrar el frente de la tarjeta"})).toHaveAttribute("aria-pressed","true");
  expect(screen.getByText(t(block.cards[0].back))).toBeVisible();
  fireEvent.click(screen.getByRole("button", {name:"Siguiente tarjeta"}));
  expect(screen.getByText("Tarjeta 2 de 5")).toBeVisible();
  expect(screen.getByRole("button", {name:"Mostrar el reverso de la tarjeta"})).toHaveAttribute("aria-pressed","false");
});

test("scenario feedback presents translated choices while evaluating their original index", () => {
  const block = blockOf("scenario");
  renderBlock(block);
  fireEvent.click(screen.getByRole("button",{name:t(block.options[(block.correctIndex+1)%block.options.length]),exact:true}));
  expect(screen.getByRole("status")).toHaveTextContent(t(block.explanation));
  expect(screen.getByRole("status")).toHaveTextContent(t(block.options[block.correctIndex]));
  expect(screen.getByRole("status")).toHaveClass("lesson-feedback-caution");
});

test.each(["en","es"])("the %s conversation preserves all four turns and their reading order", language => {
  setLocale(language);
  const block=lessons.find(lesson => lesson.id === "chatgpt").blocks.find(block => block.heading === "Example Conversation");
  renderBlock(block);
  const list=screen.getByRole("list",{name:learningText(block.heading,language)});
  const turns=[...list.querySelectorAll("li")];
  expect(turns).toHaveLength(4);
  const text=turns.map(turn => `${turn.querySelector(".conversation-speaker").textContent}: ${turn.querySelector(".conversation-message").textContent}`).join("\n\n");
  expect(text).toBe(learningText(block.text,language));
});

test("an unrecognized conversation format keeps the full readable paragraph", () => {
  renderBlock({type:"learn",heading:"Example Conversation",text:"A future example with a different format."});
  expect(screen.getByText("A future example with a different format.")).toBeVisible();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

test("true/false Spanish labels retain Boolean correctness", () => {
  const block = lessons.flatMap(lesson => lesson.blocks).find(block => block.type === "truefalse");
  renderBlock(block);
  fireEvent.click(screen.getByRole("button", {name:block.questions[0].answer ? "Verdadero" : "Falso",exact:true}));
  expect(screen.getByRole("status")).toHaveClass("lesson-feedback-positive");
  expect(screen.getByRole("status")).toHaveTextContent(t(block.questions[0].explanation));
});

test("a resumed Spanish quiz finishes with the original score and progress fields", () => {
  const onComplete=vi.fn(), onPositionChange=vi.fn();
  const last=internet.quiz.length-1, question=internet.quiz[last];
  render(<LessonPlayer lesson={internet} onBack={vi.fn()} onComplete={onComplete} onPositionChange={onPositionChange}
    initialPosition={{phase:"quiz",blockIndex:internet.blocks.length-1,quizIndex:last,score:last,answeredThrough:last,reviewQueue:[]}} />);
  fireEvent.click(screen.getByRole("button",{name:t(question.options[question.correctIndex]),exact:true}));
  expect(onPositionChange).toHaveBeenLastCalledWith(expect.objectContaining({score:internet.quiz.length,answeredThrough:internet.quiz.length,reviewQueue:[]}));
  fireEvent.click(screen.getByRole("button",{name:"Ver resultados",exact:true}));
  expect(onComplete).toHaveBeenCalledExactlyOnceWith(internet.quiz.length);
});

test.each(lessons)("$id completion keeps its Spanish summary, next step and return action", lesson => {
  const onDone=vi.fn();
  render(<Complete lesson={lesson} onDone={onDone} />);
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent(t(lesson.complete.title));
  const next=courseSuccessor(lesson.id,{lessons:lessonsByOrder,challenges:challengesByOrder,exams:examsByOrder});
  expect(screen.getByText(t(next.title),{exact:true})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Volver a tu recorrido",exact:true}));
  expect(onDone).toHaveBeenCalledOnce();
});

test("the Foundations final challenge returns from its translated completion with its original revision", () => {
  const onComplete=vi.fn();
  render(<ChallengePlayer challenge={challenge} onBack={vi.fn()} onComplete={onComplete}
    initialPosition={{kind:"challenge",revision:assessmentRevision(challenge),blockIndex:challenge.blocks.length-1,finished:true}} />);
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Repaso completado");
  expect(screen.getAllByText("Repaso completado",{exact:true})).toHaveLength(1);
  expect(screen.getByText("Terminaste el repaso de esta etapa.")).toBeVisible();
  expect(screen.getByText("Contraseñas seguras",{exact:true})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Volver a tu recorrido",exact:true}));
  expect(onComplete).toHaveBeenCalledOnce();
});

test("exam summaries translate scores and actions without claiming unsaved awards", () => {
  const exam=examsByOrder[0], onPass=vi.fn();
  const answers=exam.questions.map(question=>question.correctIndex);
  render(<ExamPlayer exam={exam} onBack={vi.fn()} onPass={onPass}
    initialPosition={{kind:"exam",revision:assessmentRevision(exam),phase:"results",answers,selected:null}} />);
  expect(screen.getByRole("heading",{name:"Puntuación aprobatoria"})).toHaveFocus();
  expect(screen.getByText(`Obtuviste ${answers.length} de ${answers.length} respuestas correctas.`)).toBeVisible();
  expect(screen.getByRole("heading",{name:"Resultado",exact:true})).toBeVisible();
  expect(screen.queryByText("Phase achievement")).not.toBeInTheDocument();
  expect(screen.queryByText("Trophy earned")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Volver a tu recorrido"}));
  expect(onPass).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({score:answers.length,tier:exam.results.find(result=>result.minScore===Math.max(...exam.results.map(result=>result.minScore)))}));
});

test("all five exam introductions and result tiers have Spanish display copy", () => {
  expect(examsByOrder).toHaveLength(5);
  for(const exam of examsByOrder) {
    for(const key of [exam.title,...exam.topics,...exam.results.flatMap(tier=>[tier.title,tier.message])].filter(Boolean)) {
      expect(spanish[key],key).toBeTruthy();
    }
  }
});

test("a Spanish exam retry returns to translated intro controls", () => {
  const exam=examsByOrder[0];
  render(<ExamPlayer exam={exam} onBack={vi.fn()} onPass={vi.fn()}
    initialPosition={{kind:"exam",revision:assessmentRevision(exam),phase:"results",answers:exam.questions.map(()=>null),selected:null}} />);
  expect(screen.getByRole("heading",{name:"Sigue practicando"})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Repetir evaluación"}));
  expect(screen.getByRole("heading",{name:"Temas incluidos"})).toBeVisible();
  expect(screen.getByText(`Para aprobar, necesitas ${exam.passingScore} de ${exam.questions.length} respuestas correctas.`)).toBeVisible();
  expect(screen.getByRole("button",{name:"Empezar evaluación"})).toBeEnabled();
});

test("Spanish save notices distinguish saving, local recovery and unsaved work", () => {
  const retry=vi.fn();
  const {rerender}=render(<ProgressSaveNotice status={{pending:true,saving:true,durable:true}} onRetry={retry}/>);
  expect(screen.getByRole("status")).toHaveTextContent("Guardando tu progreso…");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  rerender(<ProgressSaveNotice status={{pending:true,saving:false,durable:true}} onRetry={retry}/>);
  expect(screen.getByRole("status")).toHaveTextContent("guardado en este dispositivo");
  rerender(<ProgressSaveNotice status={{pending:true,saving:false,durable:false}} onRetry={retry}/>);
  expect(screen.getByRole("status")).toHaveTextContent("Mantén esta aplicación abierta");
  expect(screen.getByRole("status")).not.toHaveTextContent("guardado en este dispositivo");
  fireEvent.click(screen.getByRole("button",{name:"Volver a guardar el progreso"}));
  expect(retry).toHaveBeenCalledOnce();
});

test("read aloud receives separately translated sentences and requests a Spanish device voice", async () => {
  const block=lessons[0].blocks[0];
  const speak=vi.fn();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  vi.stubGlobal("SpeechSynthesisUtterance", class {constructor(text){this.text=text;}});
  vi.stubGlobal("speechSynthesis",{cancel:vi.fn(),speak});
  renderBlock(block);
  await act(async () => fireEvent.click(screen.getByRole("button",{name:"Leer en voz alta"})));
  const expected=[block.heading,block.text,...block.bullets,block.footer].map(t).join(". ");
  expect(JSON.parse(fetch.mock.calls[0][1].body).text).toBe(expected);
  expect(speak).toHaveBeenCalledWith(expect.objectContaining({text:expected,lang:"es"}));
});

test("the translated path keeps prerequisite ordering, completed/current states and canonical callbacks", () => {
  const onSelectLesson=vi.fn();
  render(<LessonPath completedLessons={["welcome"]} onSelectLesson={onSelectLesson} onBack={vi.fn()} />);
  expect(screen.getByRole("heading",{level:1,name:"Tu recorrido"})).toBeVisible();
  const current=screen.getByRole("button",{name:"Empezar lección: ¿Qué es Internet?",exact:true});
  expect(current).toHaveAttribute("aria-current","step");
  fireEvent.click(current);
  expect(onSelectLesson).toHaveBeenCalledExactlyOnceWith(1);
  expect(screen.queryByRole("button",{name:/Empezar lección: ¿Qué es la IA/})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Repasar la lección completada: Bienvenido a Everwise",exact:true}));
  expect(onSelectLesson).toHaveBeenLastCalledWith(0);
});

test("Spanish path search matches accented translated titles and original English titles", () => {
  render(<LessonPath completedLessons={[]} onSelectLesson={vi.fn()} onBack={vi.fn()} />);
  fireEvent.click(screen.getByRole("button",{name:"Buscar en el curso",exact:true}));
  fireEvent.change(screen.getByRole("searchbox",{name:"Lección o tema"}),{target:{value:"informacion personal"}});
  expect(screen.getByText("¿Qué es la información personal?",{exact:true})).toBeVisible();
  fireEvent.change(screen.getByRole("searchbox",{name:"Lección o tema"}),{target:{value:"What is the Internet"}});
  expect(screen.getByText("¿Qué es Internet?",{exact:true})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Cerrar la búsqueda del curso"}));
  expect(screen.getByRole("heading",{level:1,name:"Tu recorrido"})).toBeVisible();
});

test("Spanish settings and later phases disclose the actual translation boundary", () => {
  render(<><LanguageSelect showContentNotice /><LessonPath completedLessons={[]} onSelectLesson={vi.fn()} onBack={vi.fn()} /></>);
  expect(screen.getByRole("status")).toHaveTextContent("Fundamentos, Hábitos seguros en Internet, Comunicación, Finanzas digitales y Salud y servicios públicos están disponibles en español");
  fireEvent.click(screen.getByRole("button",{name:/Etapa 2 Hábitos seguros en Internet/}));
  expect(screen.queryByText("Las tres primeras lecciones están disponibles en español. El resto de esta etapa sigue en inglés.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Etapa 3 Comunicación/}));
  expect(screen.queryByText("Las lecciones de esta etapa están actualmente en inglés.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Etapa 4/}));
  expect(screen.queryByText("Las lecciones de esta etapa están actualmente en inglés.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Etapa 5/}));
  expect(screen.getByText("Las lecciones de esta etapa están actualmente en inglés.")).toBeVisible();
});
