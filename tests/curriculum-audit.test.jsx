import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
import { allLessons, challengesByOrder, examsByOrder } from "../src/data/lessons.js";
import BlockRenderer from "../src/components/blocks/BlockRenderer.jsx";
import LessonPlayer from "../src/screens/LessonPlayer.jsx";
import ExamPlayer from "../src/screens/ExamPlayer.jsx";
vi.mock("../src/components/ReadAloud", () => ({ default: () => null }));
Element.prototype.scrollTo = () => {};
afterEach(cleanup);
const supported = new Set(["learn", "reading", "tiered", "confidence", "memory", "finalboss", "video", "multiselect", "flashcards", "fillblank", "scenario", "truefalse", "choice", "builder"]);
const blocks = [...allLessons, ...challengesByOrder].flatMap(lesson => lesson.blocks.map((block, index) => ({id: `${lesson.id}/${index}/${block.type}`, block})));
test("curriculum IDs and path positions are unique, with every phase populated", () => {
  expect(new Set(allLessons.map(l => l.id)).size).toBe(allLessons.length);
  expect(new Set(allLessons.map(l => l.phase)).size).toBe(17);
  allLessons.forEach((lesson, index) => expect(lesson.pathOrder).toBe(index));
});
test.each(blocks)("activity $id renders and has valid answer data", ({block}) => {
  expect(supported.has(block.type)).toBe(true);
  const html = renderToStaticMarkup(<BlockRenderer block={block} progress={1} progressTotal={2} onContinue={() => {}} onBack={() => {}} />);
  expect(html).not.toContain("Unknown block type");
  expect(html).toContain("button");
  if (["choice", "scenario"].includes(block.type)) {
    expect(block.options.length).toBeGreaterThan(1);
    expect(block.options[block.correctIndex]).toBeTruthy();
  }
  if (block.type === "fillblank") block.questions.forEach(q => {
    expect(block.wordBank).toContain(q.answer);
    expect(q.text.split("______")).toHaveLength(2);
  });
  if (block.type === "truefalse") block.questions.forEach(q => expect(typeof q.answer).toBe("boolean"));
  if (block.type === "flashcards") expect(block.cards.length).toBeGreaterThan(0);
});
test.each(allLessons.filter(l => l.quiz?.length))("lesson $id can complete every scored question", (lesson) => {
  const complete = vi.fn();
  render(<LessonPlayer lesson={lesson} onBack={() => {}} onComplete={complete} initialPosition={{phase: "quiz", blockIndex: 0, quizIndex: 0, score: 0, reviewQueue: []}} />);
  for (const question of lesson.quiz) {
    expect(question.options[question.correctIndex]).toBeTruthy();
    fireEvent.click(screen.getByRole("button", {name: question.options[question.correctIndex]}));
    fireEvent.click(screen.getByRole("button", {name: /^(Next|See results)$/}));
  }
  expect(complete).toHaveBeenCalledWith(lesson.quiz.length);
});
test.each(examsByOrder)("exam $id supports passing and failing without inflating a score", (exam) => {
  expect(exam.questions).toHaveLength(exam.totalQuestions);
  for (const pass of [true, false]) {
    const onPass = vi.fn();
    render(<ExamPlayer exam={exam} onBack={() => {}} onPass={onPass} />);
    fireEvent.click(screen.getByRole("button", {name: "Start exam"}));
    for (const question of exam.questions) {
      const index = pass ? question.correctIndex : (question.correctIndex + 1) % question.options.length;
      fireEvent.click(screen.getByRole("button", {name: question.options[index]}));
      fireEvent.click(screen.getByRole("button", {name: /^(Next|See results)$/}));
    }
    if (pass) {
      fireEvent.click(screen.getByRole("button", {name: "Back to your path"}));
      expect(onPass).toHaveBeenCalledWith(expect.objectContaining({score: exam.questions.length}));
    } else {
      expect(onPass).not.toHaveBeenCalled();
      expect(screen.getByRole("button", {name: /Retake exam|Try again/})).toBeVisible();
    }
    cleanup();
  }
});

test.each(examsByOrder)("exam $id honors its stated passing-score boundary", (exam) => {
  for (const score of [exam.passingScore - 1, exam.passingScore]) {
    const onPass = vi.fn();
    render(<ExamPlayer exam={exam} onBack={() => {}} onPass={onPass} />);
    fireEvent.click(screen.getByRole("button", { name: "Start exam" }));
    for (const [index, question] of exam.questions.entries()) {
      const answer = index < score ? question.correctIndex : (question.correctIndex + 1) % question.options.length;
      fireEvent.click(screen.getByRole("button", { name: question.options[answer] }));
      fireEvent.click(screen.getByRole("button", { name: /^(Next|See results)$/ }));
    }
    expect(screen.getByText(`You scored ${score} of ${exam.totalQuestions}.`)).toBeVisible();
    if (score < exam.passingScore) {
      expect(screen.queryByRole("button", { name: "Back to your path" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retake exam|Try again/ })).toBeVisible();
      expect(onPass).not.toHaveBeenCalled();
    } else {
      fireEvent.click(screen.getByRole("button", { name: "Back to your path" }));
      expect(onPass).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ score }));
    }
    cleanup();
  }
});
