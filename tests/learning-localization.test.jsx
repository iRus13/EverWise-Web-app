import React from "react";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, expect, test, vi} from "vitest";
import {setLocale} from "../src/i18n";
import spanish from "../src/i18n/learning-es.json";
import {fillBlankParts, learningText} from "../src/i18n/learning.js";
import {lessonsByOrder, challengesByOrder} from "../src/data/lessons.js";
import BlockRenderer from "../src/components/blocks/BlockRenderer.jsx";
import LessonPlayer from "../src/screens/LessonPlayer.jsx";
import ChallengePlayer from "../src/screens/ChallengePlayer.jsx";
import Complete from "../src/screens/Complete.jsx";
import LessonPath from "../src/screens/LessonPath.jsx";
import LanguageSelect from "../src/components/LanguageSelect.jsx";
import {assessmentRevision} from "../src/utils/assessmentProgress.js";

const lessons = lessonsByOrder.filter(item => item.phase === 1);
const challenge = challengesByOrder.find(item => item.phase === 1);
const internet = lessons.find(item => item.id === "internet");
const t = (text, values) => learningText(text, "es", values);
const blockOf = type => internet.blocks.find(block => block.type === type);
const renderBlock = (block, props = {}) => render(<BlockRenderer block={block} progress={1} progressTotal={2} onBack={vi.fn()} onContinue={vi.fn()} {...props} />);
beforeEach(() => setLocale("es"));
afterEach(() => {cleanup(); setLocale("en"); vi.unstubAllGlobals();});

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
  expect(screen.getByText(t(lesson.complete.next),{exact:true})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Volver a tu recorrido",exact:true}));
  expect(onDone).toHaveBeenCalledOnce();
});

test("the Foundations final challenge returns from its translated completion with its original revision", () => {
  const onComplete=vi.fn();
  render(<ChallengePlayer challenge={challenge} onBack={vi.fn()} onComplete={onComplete}
    initialPosition={{kind:"challenge",revision:assessmentRevision(challenge),blockIndex:challenge.blocks.length-1,finished:true}} />);
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Repaso completado");
  expect(screen.getAllByText("Repaso completado",{exact:true})).toHaveLength(1);
  expect(screen.getByText(t("Nice work reviewing Phase {phase}. Next: {next}.",{phase:1,next:t(challenge.nextLabel)}))).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Volver a tu recorrido",exact:true}));
  expect(onComplete).toHaveBeenCalledOnce();
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
  expect(screen.getByRole("status")).toHaveTextContent("Fundamentos está disponible en español.");
  fireEvent.click(screen.getByRole("button",{name:/Etapa 2 Hábitos seguros en Internet/}));
  expect(screen.getByText("Las lecciones de esta etapa están actualmente en inglés.")).toBeVisible();
});
