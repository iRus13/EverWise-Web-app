import {afterEach, expect, test, vi} from "vitest";
import {act, cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
import Home from "../src/screens/Home.jsx";
afterEach(cleanup);

test.each(["lesson", "challenge", "exam"])("Home offers a named %s shortcut and a separate course route", async kind => {
  const onStart=vi.fn(),onStartNext=vi.fn();
  render(<Home nextActivity={{id:"next",title:"Your next activity",kind,phaseNumber:3,phaseTitle:"Communication",resumable:true}}
    textSize="size-2" onStart={onStart} onStartNext={onStartNext} />);
  expect(screen.getByRole("heading",{name:"Your next activity"})).toBeVisible();
  expect(screen.getByText("Phase 3 · Communication")).toBeVisible();
  await userEvent.click(screen.getByRole("button",{name:`Resume ${kind}: Your next activity`}));
  expect(onStartNext).toHaveBeenCalledOnce();expect(onStart).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button",{name:"View course"}));expect(onStart).toHaveBeenCalledOnce();
});

test("Home shows pending entry, prevents repeated requests and allows retry after failure", async () => {
  let reject;
  const onStartNext=vi.fn().mockImplementationOnce(() => new Promise((_,fail)=>{reject=fail;})).mockResolvedValue();
  render(<Home nextActivity={{id:"welcome",title:"Welcome to Everwise",kind:"lesson",phaseNumber:1}}
    textSize="size-2" onStartNext={onStartNext} />);
  await userEvent.click(screen.getByRole("button",{name:"Start lesson: Welcome to Everwise"}));
  expect(screen.getByRole("button",{name:"Opening lesson: Welcome to Everwise"})).toBeDisabled();
  expect(screen.getByRole("button",{name:"View course"})).toBeEnabled();
  await userEvent.click(screen.getByRole("button",{name:"Opening lesson: Welcome to Everwise"}));expect(onStartNext).toHaveBeenCalledOnce();
  await act(async()=>reject(new Error("offline")));
  expect(screen.getByRole("alert")).toHaveTextContent("Please try again");
  await userEvent.click(screen.getByRole("button",{name:"Start lesson: Welcome to Everwise"}));
  expect(onStartNext).toHaveBeenCalledTimes(2);expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
test("Home labels actual completed lessons rather than claiming real scams were caught", () => {
  render(<Home name="Jane" lessonsCompleted={12} textSize="size-2" onTextSizeChange={() => {}}/>);
  expect(screen.getByText("12")).toBeVisible();
  expect(screen.getByText("lessons completed")).toBeVisible();
  expect(screen.queryByText("scams caught")).not.toBeInTheDocument();
  expect(screen.getAllByRole("heading", {level: 1}).length).toBeGreaterThan(0);
});

test("Home preserves each destination after reorganizing the learning and tools sections", async () => {
  const user = userEvent.setup();
  const actions = {onStart: vi.fn(), onOpenBadges: vi.fn(), onOpenSettings: vi.fn(), onOpenScamChecker: vi.fn(), onTextSizeChange: vi.fn()};
  render(<Home name="Jane Smith" lessonsCompleted={12} badgesEarned={1} textSize="size-2" {...actions} />);
  expect(screen.getByRole("heading", {level: 1, name: "Today"})).toBeVisible();
  await user.click(screen.getByRole("button", {name: "View course"}));
  await user.click(screen.getByRole("button", {name: /Message Checker/}));
  await user.click(screen.getByRole("button", {name: /View your badges/}));
  await user.click(screen.getByRole("button", {name: "Settings"}));
  for (const action of [actions.onStart, actions.onOpenBadges, actions.onOpenSettings, actions.onOpenScamChecker]) expect(action).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Hello, Jane.")).toBeVisible();
});

test("completed learners can revisit the course without being asked to begin again", async () => {
  const onStart = vi.fn();
  render(<Home allDone lessonsCompleted={111} textSize="size-2" onStart={onStart} />);
  expect(screen.getByText("Revisit a lesson whenever you need a refresher.")).toBeVisible();
  await userEvent.click(screen.getByRole("button", {name: "Review course"}));
  expect(onStart).toHaveBeenCalledOnce();
  expect(screen.queryByRole("button", {name: "View course"})).not.toBeInTheDocument();
});
