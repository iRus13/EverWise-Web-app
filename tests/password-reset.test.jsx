import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import LogIn from "../src/screens/LogIn.jsx";
import PasswordReset from "../src/screens/PasswordReset.jsx";
import { requestEmailPasswordReset } from "../src/utils/passwordRecovery.js";

afterEach(() => {cleanup(); vi.useRealTimers();});

test("login offers email recovery, preserves the identifier and clears the password", async () => {
  const send = vi.fn().mockResolvedValue();
  render(<LogIn onResetPassword={email => requestEmailPasswordReset(email, send)} />);
  fireEvent.change(screen.getByLabelText("Username or email"), {target:{value:"Learner@Example.com"}});
  fireEvent.change(screen.getByLabelText("Password"), {target:{value:"private-password"}});
  fireEvent.click(screen.getByRole("button", {name:"Forgot password?"}));
  expect(screen.getByRole("heading", {name:"Reset your password"})).toHaveFocus();
  expect(screen.getByLabelText("Email address")).toHaveValue("Learner@Example.com");
  fireEvent.click(screen.getByRole("button", {name:"Send reset link"}));
  expect(await screen.findByRole("status")).toHaveTextContent("If an account uses this email address");
  expect(send).toHaveBeenCalledExactlyOnceWith("learner@example.com");
  fireEvent.click(screen.getByRole("button", {name:"Back to login"}));
  expect(screen.getByLabelText("Username or email")).toHaveValue("Learner@Example.com");
  expect(screen.getByLabelText("Password")).toHaveValue("");
});

test("recovery does not send to a username or the internal auth domain", () => {
  const send = vi.fn();
  render(<PasswordReset onResetPassword={send} />);
  for (const email of ["jane", "jane@accounts.everwise.app"]) {
    fireEvent.change(screen.getByLabelText("Email address"), {target:{value:email}});
    fireEvent.click(screen.getByRole("button", {name:"Send reset link"}));
    expect(screen.getByRole("alert")).toHaveTextContent("email address you used");
  }
  expect(send).not.toHaveBeenCalled();
});

test("failed network requests recover and duplicate submissions are suppressed", async () => {
  let fail;
  const send = vi.fn().mockImplementationOnce(() => new Promise((_, reject) => {fail = reject;})).mockResolvedValue();
  render(<PasswordReset initialEmail="learner@example.com" onResetPassword={send} />);
  const button = screen.getByRole("button", {name:"Send reset link"});
  await act(async () => { fireEvent.click(button); fireEvent.click(button); });
  expect(send).toHaveBeenCalledOnce();
  expect(screen.getByLabelText("Email address")).toBeDisabled();
  await act(async () => fail({code:"auth/network-request-failed"}));
  expect(screen.getByRole("alert")).toHaveTextContent("No internet connection");
  fireEvent.click(screen.getByRole("button", {name:"Send reset link"}));
  expect(await screen.findByRole("status")).toBeVisible();
  expect(send).toHaveBeenCalledTimes(2);
});

test("an uncertain request times out honestly and its late result does not replace recovery", async () => {
  vi.useFakeTimers();
  let resolve;
  render(<PasswordReset initialEmail="learner@example.com" onResetPassword={() => new Promise(done => {resolve = done;})} />);
  fireEvent.click(screen.getByRole("button", {name:"Send reset link"}));
  await act(async () => vi.advanceTimersByTimeAsync(20_000));
  expect(screen.getByRole("alert")).toHaveTextContent("A reset email may still arrive");
  await act(async () => resolve());
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("button", {name:"Send reset link"})).toBeEnabled();
});

test("leaving a pending reset returns to login and ignores its eventual response", async () => {
  let resolve;
  render(<LogIn onResetPassword={() => new Promise(done => {resolve = done;})} />);
  fireEvent.click(screen.getByRole("button", {name:"Forgot password?"}));
  fireEvent.change(screen.getByLabelText("Email address"), {target:{value:"learner@example.com"}});
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Send reset link"})));
  fireEvent.click(screen.getByRole("button", {name:"Back"}));
  await act(async () => resolve());
  expect(screen.getByRole("button", {name:"Forgot password?"})).toBeVisible();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
