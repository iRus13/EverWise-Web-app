import React from "react";
import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import AppShell from "../src/components/AppShell.jsx";
afterEach(cleanup);

test("navigation moves keyboard focus from the old page to the new heading", () => {
  const view=render(<AppShell screen="home" isAuthenticated><h1>Home</h1></AppShell>);
  screen.getByRole("button", {name:"Settings"}).focus();
  view.rerender(<AppShell screen="settings" isAuthenticated><h1>Settings</h1></AppShell>);
  expect(screen.getByRole("heading", {name:"Settings"})).toHaveFocus();
});

test("a loaded lesson receives focus when its focused loading heading is removed", async () => {
  const view=render(<AppShell screen="lesson"><section key="loading"><h1>Opening your lesson</h1></section></AppShell>);
  view.rerender(<AppShell screen="lesson"><section key="ready"><h1>Welcome to your lesson</h1><button>Continue</button></section></AppShell>);
  await waitFor(() => expect(screen.getByRole("heading", {name:"Welcome to your lesson"})).toHaveFocus());
});

test("async content does not steal focus after the learner moves to navigation", async () => {
  const view=render(<AppShell screen="home" isAuthenticated><section key="loading"><h1>Opening your lesson</h1></section></AppShell>);
  const home=screen.getByRole("button", {name:"Home"});
  home.focus();
  view.rerender(<AppShell screen="home" isAuthenticated><section key="ready"><h1>Ready</h1></section></AppShell>);
  await Promise.resolve();
  expect(home).toHaveFocus();
});

test("ordinary input updates keep focus in the field", () => {
  const view=render(<AppShell screen="login"><h1>Log in</h1><input aria-label="Email" defaultValue="" /></AppShell>);
  const input=screen.getByRole("textbox", {name:"Email"});
  input.focus();
  fireEvent.change(input, {target:{value:"learner@example.com"}});
  view.rerender(<AppShell screen="login"><h1>Log in</h1><input aria-label="Email" defaultValue="" /><p role="status">Ready</p></AppShell>);
  expect(input).toHaveFocus();
});
