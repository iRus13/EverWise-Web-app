import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import LearningContent from "../src/components/LearningContent.jsx";
import {setLocale} from "../src/i18n";

afterEach(() => { cleanup(); setLocale("en"); vi.useRealTimers(); });
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
  expect(screen.getByRole("progressbar")).toBeVisible();
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

test("the phase download stays pending after its loader arrives and a stale phase cannot replace the new activity", async () => {
  const old = deferred(), latest = deferred();
  const load = async () => ({learningItem: (_kind, id) => id === "old" ? old.promise : latest.promise});
  const {rerender} = render(<LearningContent kind="lesson" itemId="old" load={load} />);
  await act(async () => {});
  expect(screen.getByRole("progressbar")).toBeVisible();
  rerender(<LearningContent kind="lesson" itemId="new" load={load} />);
  await act(async () => latest.resolve(lessonModule.learningItem("lesson", "new")));
  expect(screen.getByRole("button", {name:"Complete new"})).toBeVisible();
  await act(async () => old.resolve(lessonModule.learningItem("lesson", "old")));
  expect(screen.queryByRole("button", {name:"Complete old"})).not.toBeInTheDocument();
});

test("a timed-out phase download can be retried and its late response stays ignored", async () => {
  vi.useFakeTimers();
  const stalled = deferred();
  const learningItem = vi.fn().mockReturnValueOnce(stalled.promise).mockResolvedValue(lessonModule.learningItem("lesson","welcome"));
  const load = async () => ({learningItem});
  render(<LearningContent kind="lesson" itemId="welcome" load={load} />);
  await act(async () => vi.advanceTimersByTimeAsync(15_000));
  expect(screen.getByRole("heading",{name:"Your lesson couldn’t load"})).toHaveFocus();
  fireEvent.click(screen.getByRole("button",{name:"Try again"}));
  await act(async () => {});
  expect(screen.getByRole("button",{name:"Complete welcome"})).toBeVisible();
  await act(async () => stalled.resolve(lessonModule.learningItem("lesson","old")));
  expect(screen.queryByRole("button",{name:"Complete old"})).not.toBeInTheDocument();
});


test("a failed summary preserves completion and sends the authored lesson to the summary after retry", async () => {
  const lesson = {id:"welcome", complete:{title:"Welcome Aboard!"}};
  const done = vi.fn();
  const load = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({
    learningItem: async () => ({item:lesson, Player: ({lesson:loaded, onDone}) => <button onClick={() => onDone(loaded)}>Back to your path</button>}),
  });
  render(<LearningContent kind="complete" itemId="welcome" load={load} onDone={done} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Your lesson is complete.");
  expect(done).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Try again"}));
  await act(async () => {});
  fireEvent.click(screen.getByRole("button",{name:"Back to your path"}));
  expect(done).toHaveBeenCalledExactlyOnceWith(lesson);
});

test("Spanish recovery offers translated feedback and a usable return to the path", async () => {
  setLocale("es");
  const back = vi.fn();
  render(<LearningContent kind="lesson" itemId="welcome" load={async () => {throw new Error("offline");}} onBack={back} />);
  expect(await screen.findByRole("heading",{name:"No se pudo abrir tu lección"})).toHaveFocus();
  expect(screen.getByRole("button",{name:"Intentar de nuevo"})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Volver a tu recorrido"}));
  expect(back).toHaveBeenCalledOnce();
});
