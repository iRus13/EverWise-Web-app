import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
import { allLessons } from "../src/data/lessons.js";
import LessonPlayer from "../src/screens/LessonPlayer.jsx";

vi.mock("../src/components/ReadAloud", () => ({ default: () => null }));
if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
afterEach(cleanup);

// Exercise one authored lesson at every activity type through the real player.
const samples = new Map();
for (const lesson of allLessons) {
  lesson.blocks.forEach((block, blockIndex) => {
    if (!samples.has(block.type)) samples.set(block.type, { type: block.type, lesson, blockIndex });
  });
}

function openActivity({ lesson, blockIndex }) {
  const onExit=vi.fn(), onBack=vi.fn(), onComplete=vi.fn(), onPositionChange=vi.fn();
  render(<LessonPlayer lesson={lesson} onExit={onExit} onBack={onBack}
    onComplete={onComplete} onPositionChange={onPositionChange}
    initialPosition={{ phase:"block", blockIndex, quizIndex:0, score:0, reviewQueue:[] }} />);
  return { onExit, onBack, onComplete, onPositionChange };
}

function expectExitWithoutAdvancing(callbacks) {
  fireEvent.click(screen.getByRole("button", { name:"Save and exit this lesson" }));
  expect(callbacks.onExit).toHaveBeenCalledOnce();
  expect(callbacks.onBack).not.toHaveBeenCalled();
  expect(callbacks.onComplete).not.toHaveBeenCalled();
  expect(callbacks.onPositionChange).not.toHaveBeenCalled();
}

test.each([...samples.values()])("$type activity lets the learner exit without advancing or completing", sample => {
  expectExitWithoutAdvancing(openActivity(sample));
});

test("confidence practice retains the same lesson exit", () => {
  const sample=samples.get("confidence");
  expect(sample.lesson.blocks[sample.blockIndex].practice.length).toBeGreaterThan(0);
  const callbacks=openActivity(sample);
  fireEvent.click(screen.getByRole("button", { name:/I'd like more practice/ }));
  expectExitWithoutAdvancing(callbacks);
});
