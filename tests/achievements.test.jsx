import React from "react";
import {afterEach, expect, test, vi} from "vitest";
import {cleanup, fireEvent, render, screen, within} from "@testing-library/react";
import Badges from "../src/screens/Badges.jsx";
import Complete from "../src/screens/Complete.jsx";
import ExamPlayer from "../src/screens/ExamPlayer.jsx";
import {badgeCatalog} from "../src/utils/badges.js";
import {lessonsByOrder} from "../src/data/lessons.js";
vi.mock("../src/components/ReadAloud", () => ({default: () => null}));
Element.prototype.scrollTo = () => {};
afterEach(cleanup);
const exam={title:"Safety exam",totalQuestions:2,passingScore:2,topics:["Passwords"],questions:[{question:"First question",options:["Correct first","Wrong first"],correctIndex:0},{question:"Second question",options:["Correct second","Wrong second"],correctIndex:0}],results:[{title:"Safety award",minScore:2,trophy:true}],phaseBadge:"Phase completed"};

test("exam choices can be changed before Next, only the submitted answers are scored, and results receive focus", () => {
  const pass=vi.fn();
  render(<ExamPlayer exam={exam} onPass={pass} onBack={vi.fn()}/>);
  expect(screen.getByRole("heading",{name:"Safety exam"})).toHaveFocus();
  fireEvent.click(screen.getByRole("button",{name:"Start exam"}));
  fireEvent.click(screen.getByRole("button",{name:"Wrong first"}));
  expect(screen.getByRole("button",{name:"Wrong first"})).toHaveAttribute("aria-pressed","true");
  fireEvent.click(screen.getByRole("button",{name:"Correct first"}));
  expect(screen.getByRole("button",{name:"Wrong first"})).toHaveAttribute("aria-pressed","false");
  expect(screen.getByRole("button",{name:"Correct first"})).toHaveAttribute("aria-pressed","true");
  fireEvent.click(screen.getByRole("button",{name:"Next",exact:true}));
  expect(screen.getByRole("heading",{name:"Second question"})).toHaveFocus();
  fireEvent.click(screen.getByRole("button",{name:"Correct second"}));
  fireEvent.click(screen.getByRole("button",{name:"See results"}));
  expect(screen.getByRole("heading",{name:"Passing score"})).toHaveFocus();
  expect(screen.getByText("You scored 2 of 2.")).toBeVisible();
  expect(pass).not.toHaveBeenCalled();
  expect(screen.queryByText("Trophy earned")).not.toBeInTheDocument();
  expect(screen.queryByText("Phase achievement")).not.toBeInTheDocument();
  expect(screen.queryByText(/Unlocks next/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Back to your path"}));
  expect(pass).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({score:2,earnedPhaseBadge:true,phaseBadge:"Phase completed"}));
});

test("a failed exam offers retry, resets focus and does not award its phase badge", () => {
  const pass=vi.fn();
  render(<ExamPlayer exam={exam} onPass={pass} onBack={vi.fn()}/>);
  fireEvent.click(screen.getByRole("button",{name:"Start exam"}));
  for(const ordinal of ["first","second"]) {
    fireEvent.click(screen.getByRole("button",{name:`Wrong ${ordinal}`}));
    fireEvent.click(screen.getByRole("button",{name:ordinal === "first" ? "Next" : "See results",exact:true}));
  }
  expect(screen.getByRole("heading",{name:"Keep practicing"})).toHaveFocus();
  expect(screen.queryByText("Phase completed")).not.toBeInTheDocument();
  expect(pass).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Retake exam"}));
  expect(screen.getByRole("heading",{name:"Safety exam"})).toHaveFocus();
  fireEvent.click(screen.getByRole("button",{name:"Start exam"}));
  expect(screen.getByRole("button",{name:"Choose an answer before continuing"})).toBeDisabled();
});

test("earned filter includes saved honors once, preserves course counts and reveals only earned catalog badges", () => {
  const catalog=badgeCatalog().flatMap(group=>group.badges);
  render(<Badges badges={[catalog[0].name,"Extra honor","Extra honor"]} onBack={vi.fn()}/>);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow","1");
  expect(screen.getAllByRole("heading",{name:"Extra honor",exact:true})).toHaveLength(1);
  fireEvent.click(within(screen.getByRole("group",{name:"Show badges"})).getByRole("button",{name:"Earned",exact:true}));
  expect(screen.getByRole("heading",{name:catalog[0].name,exact:true})).toBeVisible();
  expect(screen.queryByRole("heading",{name:catalog[1].name,exact:true})).not.toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow","1");
  fireEvent.click(screen.getByRole("button",{name:"All badges"}));
  fireEvent.click(screen.getByRole("button",{name:"Phase 1: Foundations"}));
  expect(screen.getByRole("heading",{name:catalog[1].name,exact:true})).toBeVisible();
});

test("empty earned filter keeps a useful message and Home navigation", () => {
  const back=vi.fn();render(<Badges badges={[]} onBack={back}/>);
  fireEvent.click(screen.getByRole("button",{name:"Earned",exact:true}));
  expect(screen.getByRole("status")).toHaveTextContent("Finish your first lesson");
  fireEvent.click(screen.getByRole("button",{name:"Back to home"}));
  expect(back).toHaveBeenCalledOnce();
});

test("completion preserves authored takeaways, does not fabricate a badge, and waits for navigation", () => {
  const done=vi.fn();
  render(<Complete lesson={{complete:{title:"Lesson finished",habit:"Pause first",warningSign:"Pressure",skills:["Verify"],learned:["Use trusted contacts"],next:"Next topic"}}} onDone={done}/>);
  expect(screen.getByRole("heading",{name:"Lesson finished"})).toHaveFocus();
  for(const text of ["Pause first","Pressure","Verify","Use trusted contacts"]) expect(screen.getByText(text,{exact:true})).toBeVisible();
  expect(screen.queryByText("Next topic")).not.toBeInTheDocument();
  expect(screen.queryByText("Badge earned")).not.toBeInTheDocument();
  expect(done).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Back to your path"}));
  expect(done).toHaveBeenCalledOnce();
});

test("real App lesson summary names VPN next and only displays an explicitly earned badge", () => {
  const lesson=lessonsByOrder.find(item=>item.id==="app");
  const {rerender}=render(<Complete lesson={lesson} onDone={vi.fn()}/>);
  expect(screen.getByText("What is a VPN?",{exact:true})).toBeVisible();
  expect(screen.queryByText("What is Wi-Fi?",{exact:true})).not.toBeInTheDocument();
  expect(screen.queryByText("Badge earned")).not.toBeInTheDocument();
  rerender(<Complete lesson={lesson} earnedBadge={lesson.badge} onDone={vi.fn()}/>);
  expect(screen.getByText("Badge earned")).toBeVisible();
  expect(screen.getByText(lesson.badge,{exact:true})).toBeVisible();
  rerender(<Complete lesson={lesson} earnedBadge="Unrelated badge" onDone={vi.fn()}/>);
  expect(screen.queryByText("Badge earned")).not.toBeInTheDocument();
});


test("saved awards open first while the full catalog can be browsed phase by phase with keyboard", async () => {
  const {default:userEvent}=await import("@testing-library/user-event"); const user=userEvent.setup();
  const groups=badgeCatalog();render(<Badges badges={[groups[3].badges[0].name]} onBack={vi.fn()}/>);
  expect(screen.getByRole("button",{name:"Earned",exact:true})).toHaveAttribute("aria-pressed","true");
  expect(screen.getByRole("heading",{name:groups[3].badges[0].name,exact:true})).toBeVisible();
  expect(screen.queryByRole("heading",{name:groups[0].badges[0].name,exact:true})).toBeNull();
  await user.click(screen.getByRole("button",{name:"All badges"}));
  for (const group of groups) {
    const toggle=screen.getByRole("button",{name:`Phase ${group.phase.number}: ${group.phase.title}`});
    expect(toggle).toHaveAttribute("aria-expanded","false");toggle.focus();await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded","true");
    for(const badge of group.badges) expect(screen.getByRole("heading",{name:badge.name,exact:true})).toBeVisible();
    await user.keyboard("{Enter}");expect(toggle).toHaveFocus();expect(toggle).toHaveAttribute("aria-expanded","false");
  }
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow","1");
});

test("new learners can see the first phase immediately and filters preserve phase choices", () => {
  render(<Badges badges={[]} onBack={vi.fn()}/>);
  const first=screen.getByRole("button",{name:"Phase 1: Foundations"});expect(first).toHaveAttribute("aria-expanded","true");
  const second=screen.getByRole("button",{name:"Phase 2: Safe Internet Habits"});fireEvent.click(second);
  fireEvent.click(screen.getByRole("button",{name:"Earned",exact:true}));expect(screen.getByRole("status")).toHaveTextContent("Finish your first lesson");
  fireEvent.click(screen.getByRole("button",{name:"All badges"}));expect(screen.getByRole("button",{name:"Phase 2: Safe Internet Habits"})).toHaveAttribute("aria-expanded","true");
});
