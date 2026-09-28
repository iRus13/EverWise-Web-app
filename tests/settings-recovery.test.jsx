import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import Settings from "../src/screens/Settings.jsx";
import { Capacitor } from "@capacitor/core";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
const props = {onBack:() => {}, onLogOut:() => {}, onDeleteAccount:() => {}};

test("deletion confirmation announces its heading and cancel restores focus without retaining a password", () => {
  const onDeleteAccount = vi.fn();
  render(<Settings {...props} onDeleteAccount={onDeleteAccount} />);
  fireEvent.click(screen.getByRole("button", {name:"Delete account"}));
  expect(screen.getByRole("heading", {name:"Delete your account?"})).toHaveFocus();
  fireEvent.change(screen.getByLabelText("Current password"), {target:{value:"local-test-only"}});
  fireEvent.click(screen.getByRole("button", {name:"Cancel"}));
  expect(screen.getByRole("button", {name:"Delete account"})).toHaveFocus();
  expect(onDeleteAccount).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", {name:"Delete account"}));
  expect(screen.getByLabelText("Current password")).toHaveValue("");
  expect(screen.getByRole("button", {name:"Yes, delete"})).toBeDisabled();
});

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

test("deletion explains Apple billing separately and offers management without submitting deletion", () => {
  const onDeleteAccount = vi.fn();
  const open = vi.spyOn(window, "open").mockImplementation(() => null);
  render(<Settings {...props} onDeleteAccount={onDeleteAccount} />);
  fireEvent.click(screen.getByRole("button", {name:"Delete account"}));
  expect(screen.getByText(/Deleting your account does not stop Apple billing/)).toBeVisible();
  expect(screen.queryByText(/so you will not be billed again/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", {name:"Open Apple billing"}));
  expect(open).toHaveBeenCalledWith("https://apps.apple.com/account/subscriptions", "_blank", "noopener,noreferrer");
  expect(onDeleteAccount).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", {name:"Delete your account?"})).toBeVisible();
  expect(screen.getByRole("button", {name:"Cancel"})).toBeEnabled();
  open.mockRestore();
});

test.each([
  ["web public", false, false, true],
  ["native public", true, false, false],
  ["web sponsored", false, true, false],
  ["native sponsored", true, true, false],
])("%s deletion only promises the website cancellation its flow performs", (_name, native, sponsored, cancels) => {
  vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(native);
  render(<Settings {...props} sponsored={sponsored} />);
  fireEvent.click(screen.getByRole("button", {name:"Delete account"}));
  if (cancels) {
    expect(screen.getByText(/If cancellation fails, your account is kept/)).toBeVisible();
    expect(screen.queryByText(/cancel in EverWise web Settings/)).not.toBeInTheDocument();
  } else {
    expect(screen.getByText(/cancel in EverWise web Settings/)).toBeVisible();
    expect(screen.queryByText(/is cancelled before deletion/)).not.toBeInTheDocument();
  }
  expect(screen.getByRole("button", {name:"Open Apple billing"})).toBeEnabled();
});

test("Apple management remains optional and is disabled only while deletion is submitted", async () => {
  const pending = new Promise(() => {});
  const onDeleteAccount = vi.fn(() => pending);
  render(<Settings {...props} onDeleteAccount={onDeleteAccount} />);
  fireEvent.click(screen.getByRole("button", {name:"Delete account"}));
  fireEvent.change(screen.getByLabelText("Current password"), {target:{value:"local-test-only"}});
  expect(screen.getByRole("button", {name:"Yes, delete"})).toBeEnabled();
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Yes, delete"})));
  expect(onDeleteAccount).toHaveBeenCalledExactlyOnceWith("local-test-only");
  expect(screen.getByRole("button", {name:"Open Apple billing"})).toBeDisabled();
  expect(screen.getByLabelText("Current password")).toHaveValue("");
});
