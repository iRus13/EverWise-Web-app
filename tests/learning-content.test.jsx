import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import LearningContent from "../src/components/LearningContent.jsx";

afterEach(() => { cleanup(); vi.useRealTimers(); });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const lessonModule = {
  learningItem: (_kind, id) => ({
    item: { id },
    Player: ({ lesson, onComplete }) => <button onClick={onComplete}>Complete {lesson.id}</button>,
  }),
};

test("a pending activity can be left without completing or reopening it", async () => {
  const request = deferred();
  const load = vi.fn(() => request.promise);
  const back = vi.fn(), complete = vi.fn();
  const {unmount} = render(<LearningContent kind="lesson" itemId="welcome" load={load} onBack={back} onComplete={complete} />);
  expect(screen.getByRole("status")).toBeVisible();
  fireEvent.click(screen.getByRole("button", {name: "Back to your path"}));
  expect(back).toHaveBeenCalledOnce();
  unmount();
  await act(async () => request.resolve(lessonModule));
  expect(complete).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", {name: "Complete welcome"})).not.toBeInTheDocument();
});

test("failed lesson download retries without firing completion", async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(lessonModule);
  const complete = vi.fn();
  render(<LearningContent kind="lesson" itemId="welcome" load={load} onComplete={complete} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Check your connection");
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", {name: "Try again"}));
  fireEvent.click(await screen.findByRole("button", {name: "Complete welcome"}));
  expect(complete).toHaveBeenCalledOnce();
  expect(load).toHaveBeenCalledTimes(2);
});

test("a stale download never substitutes a previously selected lesson", async () => {
  const old = deferred(), current = deferred();
  const load = vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  const {rerender} = render(<LearningContent kind="lesson" itemId="old" load={load} />);
  await act(async () => {});
  rerender(<LearningContent kind="lesson" itemId="new" load={load} />);
  await act(async () => current.resolve(lessonModule));
  expect(screen.getByRole("button", {name: "Complete new"})).toBeVisible();
  await act(async () => old.resolve(lessonModule));
  expect(screen.queryByRole("button", {name: "Complete old"})).not.toBeInTheDocument();
});

test("stalled downloads time out and a late response cannot dismiss recovery", async () => {
  vi.useFakeTimers();
  const request = deferred();
  render(<LearningContent kind="lesson" itemId="welcome" load={() => request.promise} />);
  await act(async () => vi.advanceTimersByTimeAsync(15_000));
  expect(screen.getByRole("alert")).toBeVisible();
  await act(async () => request.resolve(lessonModule));
  expect(screen.getByRole("button", {name: "Try again"})).toBeVisible();
  expect(screen.queryByRole("button", {name: "Complete welcome"})).not.toBeInTheDocument();
});

test.each(["lesson", "challenge", "exam"])("the deferred %s player receives the authored content", async kind => {
  const content = {id:"test-content", marker:kind};
  const complete = vi.fn();
  const module = {learningItem: vi.fn(() => ({item:content, Player: props => <button onClick={() => props.onComplete(props[kind])}>Finish</button>}))};
  render(<LearningContent kind={kind} itemId={content.id} load={async () => module} onComplete={complete} />);
  fireEvent.click(await screen.findByRole("button", {name:"Finish"}));
  expect(module.learningItem).toHaveBeenCalledWith(kind, content.id);
  expect(complete).toHaveBeenCalledWith(content);
});
