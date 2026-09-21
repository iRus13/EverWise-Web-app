import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import Settings from "../src/screens/Settings.jsx";

afterEach(() => { cleanup(); vi.useRealTimers(); });
const props = {onBack:() => {}, onLogOut:() => {}, onDeleteAccount:() => {}};

test("a stalled settings reset releases its controls and reports uncertain delivery", async () => {
  vi.useFakeTimers();
  let resolve;
  const send=vi.fn(() => new Promise(done => { resolve=done; }));
  render(<Settings {...props} onResetPassword={send} />);
  fireEvent.click(screen.getByRole("button", {name:"Reset password"}));
  await act(async () => vi.advanceTimersByTimeAsync(20_000));
  expect(screen.getByRole("alert")).toHaveTextContent("A reset email may still arrive");
  expect(screen.getByRole("button", {name:"Reset password"})).toBeEnabled();
  await act(async () => resolve());
  expect(screen.queryByText("Password reset email sent.")).not.toBeInTheDocument();
});

test("a pending reset keeps back and logout available without allowing duplicate requests", async () => {
  const send=vi.fn(() => new Promise(() => {}));
  render(<Settings {...props} onResetPassword={send} />);
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Reset password"})));
  expect(screen.getByRole("button", {name:"Back to home"})).toBeEnabled();
  expect(screen.getByRole("button", {name:"Log out"})).toBeEnabled();
  const reset=screen.getByRole("button", {name:"Reset password"});
  expect(reset).toBeDisabled();
  fireEvent.click(reset);
  expect(send).toHaveBeenCalledOnce();
});

test("network errors are explained and retry can complete without claiming email delivery", async () => {
  const send=vi.fn().mockRejectedValueOnce({code:"auth/network-request-failed"}).mockResolvedValue();
  render(<Settings {...props} onResetPassword={send} />);
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Reset password"})));
  expect(screen.getByRole("alert")).toHaveTextContent("No internet connection");
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Reset password"})));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("If an account uses your email address");
  expect(send).toHaveBeenCalledTimes(2);
});

test("leaving before the request starts cancels it and clears the deadline", async () => {
  vi.useFakeTimers();
  const send=vi.fn();
  const view=render(<Settings {...props} onResetPassword={send} />);
  fireEvent.click(screen.getByRole("button", {name:"Reset password"}));
  view.unmount();
  await act(async () => {});
  expect(send).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

test("changing the settings owner ignores the old request's eventual response", async () => {
  let resolve;
  const view=render(<Settings key="alice" {...props} onResetPassword={() => new Promise(done => {resolve=done;})} />);
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Reset password"})));
  view.rerender(<Settings key="bob" {...props} onResetPassword={vi.fn()} />);
  await act(async () => resolve());
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("button", {name:"Reset password"})).toBeEnabled();
});

test("synchronous provider failures release controls and clear the deadline", async () => {
  vi.useFakeTimers();
  render(<Settings {...props} onResetPassword={() => {throw {code:"auth/too-many-requests"};}} />);
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Reset password"})));
  expect(screen.getByRole("alert")).toHaveTextContent("Too many attempts");
  expect(screen.getByRole("button", {name:"Reset password"})).toBeEnabled();
  expect(vi.getTimerCount()).toBe(0);
});
