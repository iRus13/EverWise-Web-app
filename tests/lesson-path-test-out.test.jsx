import { afterEach, describe, expect, test, vi } from "vitest";

await vi.hoisted(async () => {
  globalThis.React = (await import("react")).default;
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LessonPath from "../src/screens/LessonPath.jsx";
import { lessonsByOrder } from "../src/data/lessons.js";

afterEach(cleanup);

// The path measures itself against the viewport.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

const firstLesson = lessonsByOrder[0];
const secondLesson = lessonsByOrder[1];

const renderPath = (overrides = {}) => {
  const props = {
    completedLessons: [],
    onSelectLesson: vi.fn(),
    onTestOutLesson: vi.fn(),
    onBack: vi.fn(),
    ...overrides,
  };
  render(<LessonPath {...props} />);
  return props;
};

const quickCheckFor = (lesson) =>
  screen.queryByRole("button", {
    name: `Already know this? Take a quick check: ${lesson.title}`,
    exact: true,
  });

describe("testing out from the course path", () => {
  test("the lesson you are up to offers a quick check beside it", () => {
    // Lesson 1 has no quiz, so the offer belongs to the next one along.
    const props = renderPath({ completedLessons: [firstLesson.id] });

    const quickCheck = quickCheckFor(secondLesson);
    expect(quickCheck).not.toBeNull();

    fireEvent.click(quickCheck);
    expect(props.onTestOutLesson).toHaveBeenCalledWith(1);
    // Tapping the node itself is untouched: it still just opens the lesson.
    expect(props.onSelectLesson).not.toHaveBeenCalled();
  });

  test("a lesson already finished is not offered a quick check", () => {
    renderPath({ completedLessons: [firstLesson.id, secondLesson.id] });
    expect(quickCheckFor(secondLesson)).toBeNull();
  });

  test("a lesson with no questions is never offered one", () => {
    renderPath({ completedLessons: [] });
    // Lesson 1 is the current one here and carries no quiz.
    expect(firstLesson.quiz?.length ?? 0).toBe(0);
    expect(quickCheckFor(firstLesson)).toBeNull();
  });

  test("locked lessons further along are not offered one", () => {
    renderPath({ completedLessons: [firstLesson.id] });
    const laterLesson = lessonsByOrder[4];
    expect(quickCheckFor(laterLesson)).toBeNull();
  });

  test("nothing is offered when the screen has no test-out handler", () => {
    renderPath({
      completedLessons: [firstLesson.id],
      onTestOutLesson: undefined,
    });
    expect(quickCheckFor(secondLesson)).toBeNull();
  });
});

// Validate the course's real prerequisite sequence as well as its presentation.
const catalog = await import("../src/data/course-catalog.js");
const {requiredCourseIds} = await import("../src/utils/courseProgress.js");
const required = requiredCourseIds(catalog.lessonsByOrder, catalog.challengesByOrder, catalog.examsByOrder);

test("phase disclosure is keyboard-compatible, retains its state and exposes full lesson titles", () => {
  renderPath();
  const phase = screen.getByRole("button", {name: /Phase 1 · In progress Foundations/});
  expect(phase).toHaveAttribute("aria-expanded", "true");
  const content = document.getElementById(phase.getAttribute("aria-controls"));
  expect(content).toBeVisible();
  fireEvent.click(phase);
  expect(content).not.toBeVisible();
  fireEvent.click(phase);
  expect(screen.getByRole("button", {name: `Start lesson: ${firstLesson.title}`})).toBeVisible();
  expect(screen.getByText(firstLesson.title)).toBeVisible();
});

test("only the current step and completed steps are actionable", () => {
  const props = renderPath({completedLessons: [firstLesson.id]});
  fireEvent.click(screen.getByRole("button", {name: `Redo completed lesson: ${firstLesson.title}`}));
  expect(props.onSelectLesson).toHaveBeenCalledExactlyOnceWith(0);
  expect(screen.getByRole("button", {name: `Start lesson: ${secondLesson.title}`})).toHaveAttribute("aria-current", "step");
  expect(screen.queryByRole("button", {name: `Start lesson: ${lessonsByOrder[2].title}`})).not.toBeInTheDocument();
  const futurePhase = screen.getByRole("button", {name: /Phase 2 Safe Internet Habits/});
  fireEvent.click(futurePhase);
  const region = document.getElementById(futurePhase.getAttribute("aria-controls"));
  expect(region.querySelector("button")).toBeNull();
});

test.each(catalog.challengesByOrder.map(challenge => [challenge.id, challenge]))("routes the ready challenge %s without skipping prerequisites", (_, challenge) => {
  const props = renderPath({completedLessons: required.slice(0, required.indexOf(challenge.id)), onSelectChallenge: vi.fn()});
  const action = screen.getByRole("button", {name: `Start challenge: ${challenge.title}`});
  expect(action).toHaveAttribute("aria-current", "step");
  fireEvent.click(action);
  expect(props.onSelectChallenge).toHaveBeenCalledExactlyOnceWith(challenge);
  expect(props.onSelectLesson).not.toHaveBeenCalled();
});

test.each(catalog.examsByOrder.map(exam => [exam.id, exam]))("routes the ready exam %s without skipping prerequisites", (_, exam) => {
  const props = renderPath({completedLessons: required.slice(0, required.indexOf(exam.id)), onSelectExam: vi.fn()});
  const action = screen.getByRole("button", {name: `Start exam: ${exam.title}`});
  expect(action).toHaveAttribute("aria-current", "step");
  fireEvent.click(action);
  expect(props.onSelectExam).toHaveBeenCalledExactlyOnceWith(exam);
  expect(props.onSelectLesson).not.toHaveBeenCalled();
});

test("course progress counts known steps once and ignores unknown IDs", () => {
  renderPath({completedLessons: [firstLesson.id, firstLesson.id, "unknown"]});
  expect(screen.getByRole("progressbar", {name: "Course progress"})).toHaveAttribute("aria-valuenow", "1");
  expect(screen.getByRole("progressbar", {name: "Course progress"})).toHaveAttribute("aria-valuemax", String(required.length));
});

test("completed course remains browsable and has no current step or quick check", () => {
  renderPath({completedLessons: required});
  expect(screen.getByText(/You've finished every step/)).toBeVisible();
  expect(document.querySelector('[aria-current="step"]')).toBeNull();
  expect(document.querySelector('.path-test-out')).toBeNull();
  expect(screen.getByRole("button", {name: `Redo completed lesson: ${firstLesson.title}`})).toBeVisible();
});


test("every lesson row has a valid phase-local number", () => {
  renderPath();
  expect(document.querySelectorAll('.course-step-meta')).toHaveLength(required.length);
  for (const label of document.querySelectorAll('.course-step-meta')) {
    expect(label.textContent).not.toMatch(/undefined|null|NaN/);
    if (label.textContent.startsWith('Lesson')) expect(label.textContent).toMatch(/^Lesson [1-9][0-9]* · /);
  }
});


test("a saved lesson offers resume instead of a quick check that would silently resume", () => {
  const saved = vi.fn(id => id === secondLesson.id);
  const props = renderPath({completedLessons:[firstLesson.id],hasSavedLessonPosition:saved});
  const resume = screen.getByRole('button',{name:`Resume lesson: ${secondLesson.title}`});
  expect(resume).toHaveTextContent('In progress');
  expect(resume).toHaveTextContent('Continue where you left off');
  expect(quickCheckFor(secondLesson)).toBeNull();
  fireEvent.click(resume);
  expect(props.onSelectLesson).toHaveBeenCalledExactlyOnceWith(1);
  expect(props.onTestOutLesson).not.toHaveBeenCalled();
  expect(saved).toHaveBeenCalledWith(secondLesson.id);
});

test("saved positions do not reopen locked lessons or change completed lessons into resume actions", () => {
  renderPath({completedLessons:[firstLesson.id],hasSavedLessonPosition:() => true});
  expect(screen.getByRole('button',{name:`Redo completed lesson: ${firstLesson.title}`})).toBeVisible();
  expect(screen.getByRole('button',{name:`Resume lesson: ${secondLesson.title}`})).toBeVisible();
  expect(screen.queryByRole('button',{name:`Resume lesson: ${lessonsByOrder[2].title}`})).toBeNull();
});

test.each(['challenge','exam'])('unfinished %s has a working Resume action without unlocking future content', kind => {
  const items=kind==='challenge'?catalog.challengesByOrder:catalog.examsByOrder;
  const item=items[0], index=required.indexOf(item.id);
  const onSelect=vi.fn();
  renderPath({completedLessons:required.slice(0,index),hasSavedAssessmentPosition:()=>true,
    onSelectChallenge:kind==='challenge'?onSelect:vi.fn(),onSelectExam:kind==='exam'?onSelect:vi.fn()});
  const resume=screen.getByRole('button',{name:`Resume ${kind}: ${item.title}`,exact:true});
  expect(resume).toBeEnabled();fireEvent.click(resume);expect(onSelect).toHaveBeenCalledOnce();
  expect(screen.getAllByText('Continue where you left off')).toHaveLength(1);
});

test('Find your current step reopens its collapsed phase without starting a lesson', async () => {
  const {waitFor}=await import('@testing-library/react');
  const props=renderPath({completedLessons:[firstLesson.id]});
  const phase=screen.getByRole('button',{name:/Phase 1 · In progress Foundations/});
  fireEvent.click(phase);expect(phase).toHaveAttribute('aria-expanded','false');
  fireEvent.click(screen.getByRole('button',{name:'Find your current step'}));
  expect(phase).toHaveAttribute('aria-expanded','true');
  await waitFor(()=>expect(screen.getByRole('button',{name:`Start lesson: ${secondLesson.title}`})).toHaveFocus());
  expect(props.onSelectLesson).not.toHaveBeenCalled();
});

test('a completed course keeps Home navigation and has no current-step shortcut',()=>{
 const props=renderPath({completedLessons:required});
 expect(screen.queryByRole('button',{name:'Find your current step'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Back to home'}));
 expect(props.onBack).toHaveBeenCalledOnce();
});

test('activity title comes before supporting details in both readable and locked rows',()=>{
 renderPath({completedLessons:[firstLesson.id]});
 for(const row of document.querySelectorAll('[data-course-step]')) {
  const title=row.querySelector('.course-step-title');
  const details=row.querySelector('.course-step-details');
  expect(title.textContent.trim().length).toBeGreaterThan(0);
  expect(title.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(details.querySelector('.course-step-meta').textContent).toMatch(/Completed|Ready to start|Locked/);
 }
});


test("course search finds completed, current and locked activities without changing access", () => {
  const props = renderPath({completedLessons:[firstLesson.id]});
  fireEvent.click(screen.getByRole("button", {name:"Search course"}));
  const input = screen.getByRole("searchbox", {name:"Lesson or topic"});
  expect(input).toHaveFocus();
  fireEvent.change(input, {target:{value:"FOUNDATIONS"}});
  expect(screen.getByRole("status")).toHaveTextContent(/results/);
  fireEvent.click(screen.getByRole("button", {name:`Redo completed lesson: ${firstLesson.title}`}));
  expect(props.onSelectLesson).toHaveBeenCalledExactlyOnceWith(0);
  expect(screen.getByRole("button", {name:`Start lesson: ${secondLesson.title}`})).toHaveAttribute("aria-current","step");
  expect(document.querySelectorAll(".course-step-locked").length).toBeGreaterThan(0);
  for (const locked of document.querySelectorAll(".course-step-locked")) expect(locked.querySelector("button")).toBeNull();
  expect(props.onTestOutLesson).not.toHaveBeenCalled();
});

test("search handles whitespace, reversed words, accents, empty results and clearing", () => {
  renderPath();
  fireEvent.click(screen.getByRole("button", {name:"Search course"}));
  const input = screen.getByRole("searchbox");
  fireEvent.change(input, {target:{value:"  Bankíng   Onlíne  "}});
  expect(screen.getByRole("status")).toHaveTextContent("1 result");
  expect(document.querySelector(".course-step-title")).toHaveTextContent("Online Banking");
  fireEvent.change(input, {target:{value:"nothing-matches-this-query"}});
  expect(screen.getByRole("status")).toHaveTextContent("0 results");
  expect(screen.getByText(/Try a shorter phrase/)).toBeVisible();
  expect(document.querySelector("[data-course-step]")).toBeNull();
  fireEvent.click(screen.getByRole("button", {name:"Clear search"}));
  expect(input).toHaveValue(""); expect(input).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("Type a lesson name or topic");
});

test("closing search preserves phase disclosures and restores keyboard focus", () => {
  renderPath();
  const phase = screen.getByRole("button", {name:/Phase 2 Safe Internet Habits/});
  fireEvent.click(phase);
  fireEvent.click(screen.getByRole("button", {name:"Search course"}));
  fireEvent.change(screen.getByRole("searchbox"), {target:{value:"banking"}});
  fireEvent.keyDown(screen.getByRole("searchbox"), {key:"Escape"});
  expect(screen.getByRole("button", {name:"Search course"})).toHaveFocus();
  expect(screen.getByRole("button", {name:/Phase 2 Safe Internet Habits/})).toHaveAttribute("aria-expanded","true");
  fireEvent.click(screen.getByRole("button", {name:"Search course"}));
  expect(screen.getByRole("searchbox")).toHaveValue("");
});

test("current-step shortcut leaves search and focuses the resumable activity without starting it", async () => {
  const {waitFor} = await import("@testing-library/react");
  const props = renderPath({completedLessons:[firstLesson.id],hasSavedLessonPosition:()=>true});
  fireEvent.click(screen.getByRole("button", {name:"Search course"}));
  fireEvent.change(screen.getByRole("searchbox"), {target:{value:"no-match"}});
  fireEvent.click(screen.getByRole("button", {name:"Find your current step"}));
  await waitFor(() => expect(screen.getByRole("button", {name:`Resume lesson: ${secondLesson.title}`})).toHaveFocus());
  expect(screen.queryByRole("searchbox")).toBeNull();
  expect(props.onSelectLesson).not.toHaveBeenCalled();
});

test.each(["challenge","exam"])("search opens a completed %s using its actual handler", kind => {
  const item = (kind === "challenge" ? catalog.challengesByOrder : catalog.examsByOrder)[0];
  const action = vi.fn();
  const props = renderPath({completedLessons:required, onSelectChallenge:action,onSelectExam:action});
  fireEvent.click(screen.getByRole("button", {name:"Search course"}));
  fireEvent.change(screen.getByRole("searchbox"), {target:{value:item.title}});
  fireEvent.click(screen.getByRole("button", {name:`Redo ${kind}: ${item.title}`,exact:true}));
  expect(action).toHaveBeenCalledExactlyOnceWith(item);
  expect(props.onSelectLesson).not.toHaveBeenCalled();
});
