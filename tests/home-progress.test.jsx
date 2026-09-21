import {afterEach, expect, test, vi} from "vitest";
import {cleanup, render, screen} from "@testing-library/react";
await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
import Home from "../src/screens/Home.jsx";
afterEach(cleanup);
test("Home labels actual completed lessons rather than claiming real scams were caught", () => {
  render(<Home name="Jane" lessonsCompleted={12} textSize="size-2" onTextSizeChange={() => {}}/>);
  expect(screen.getByText("12")).toBeVisible();
  expect(screen.getByText("lessons completed")).toBeVisible();
  expect(screen.queryByText("scams caught")).not.toBeInTheDocument();
  expect(screen.getAllByRole("heading", {level: 1}).length).toBeGreaterThan(0);
});
