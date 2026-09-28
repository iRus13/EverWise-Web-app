import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import BillingConfirmation from "../src/screens/BillingConfirmation";
import PartnerAccessError from "../src/screens/PartnerAccessError";
import { PartnerReleaseRecovery, PartnerDeletionReconciliation } from "../src/screens/Settings";
import PersonalPlan from "../src/screens/PersonalPlan";
import Loading from "../src/screens/Loading";

globalThis.React = React;
afterEach(() => { cleanup(); vi.useRealTimers(); });

test("confirmation changes restore the heading without making actions a live region", () => {
  const back = vi.fn();
  const { rerender } = render(<main><BillingConfirmation onBack={back} /></main>);
  expect(screen.getAllByRole("main")).toHaveLength(1);
  expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  fireEvent.click(screen.getByRole("button", {name: "Back to home"}));
  expect(back).toHaveBeenCalledOnce();
  const pane = document.querySelector(".status-screen");
  pane.scrollTop = 700;
  rerender(<main><BillingConfirmation phase="timeout" onRetry={() => {}} onBack={back} /></main>);
  expect(screen.getByRole("heading", {level: 1})).toHaveFocus();
  expect(pane.scrollTop).toBe(0);
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByRole("button", {name: "Retry"}).closest('[aria-live], [role="status"]')).toBeNull();
});

test("a busy recovery prevents repeat retries while logout remains available", () => {
  const retry = vi.fn(), logout = vi.fn();
  const { rerender } = render(<PartnerAccessError code="PARTNER_PROFILE_INCOMPLETE" onRetry={retry} onLogOut={logout} retryBusy retryLabel="Saving profile…" />);
  fireEvent.click(screen.getByRole("button", {name: "Saving profile…"}));
  expect(retry).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", {name: "Log out"}));
  expect(logout).toHaveBeenCalledOnce();
  rerender(<PartnerAccessError code="PARTNER_PROFILE_INCOMPLETE" onRetry={retry} onLogOut={logout} />);
  fireEvent.click(screen.getByRole("button", {name: "Retry"}));
  expect(retry).toHaveBeenCalledOnce();
});

test("busy label changes retain focus but a new recovery problem restores context", () => {
  const { rerender } = render(<PartnerAccessError code="PARTNER_PROFILE_INCOMPLETE" onRetry={() => {}} onLogOut={() => {}} />);
  const logout = screen.getByRole("button", {name:"Log out"}); logout.focus();
  rerender(<PartnerAccessError code="PARTNER_PROFILE_INCOMPLETE" retryBusy retryLabel="Saving profile…" onRetry={() => {}} onLogOut={() => {}} />);
  expect(logout).toHaveFocus();
  rerender(<PartnerAccessError code="PARTNER_PROFILE_MISSING" onRetry={() => {}} />);
  expect(screen.getByRole("heading", {level:1})).toHaveFocus();
});

test.each(["INVALID_INVITE", "PARTNER_FULL", "PARTNER_SUSPENDED", "PARTNER_CLEANUP_INCOMPLETE"])("%s never offers an unsafe retry", code => {
  render(<PartnerAccessError code={code} onRetry={vi.fn()} showSupport />);
  expect(screen.queryByRole("button", {name:"Retry"})).toBeNull();
  expect(screen.getByRole("link", {name:"Contact support"})).toHaveAttribute("href", "mailto:everwisedigitalliteracy@gmail.com");
});

test("terminal release recovery removes retry and exposes the support path", () => {
  const retry=vi.fn();
  const {rerender}=render(<PartnerReleaseRecovery busy onRetry={retry} />);
  fireEvent.click(screen.getByRole("button", {name:"Retrying…"})); expect(retry).not.toHaveBeenCalled();
  rerender(<PartnerReleaseRecovery terminal="deletion-status" onRetry={retry} />);
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByRole("link", {name:"Contact support"})).toBeVisible();
  expect(screen.getByRole("heading", {level:1})).toHaveFocus();
  rerender(<PartnerDeletionReconciliation reconciliation="cancellation" />);
  expect(screen.getByRole("heading", {name:"Account deletion needs help"})).toHaveFocus();
});

test("personal recommendations are immediately ready with no simulated progress delay", async () => {
  vi.useFakeTimers(); const next=vi.fn();
  render(<PersonalPlan sponsored profile={{profileInterview:{concerns:["Suspicious links"],scamFrequency:"never"}}} onContinue={next} />);
  expect(screen.getByRole("heading", {name:"Your personal learning plan"})).toHaveFocus();
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.getByText("Check links before opening them")).toBeVisible();
  expect(screen.queryByRole("progressbar")).toBeNull();
  fireEvent.click(screen.getByRole("button", {name:"Start learning"})); expect(next).toHaveBeenCalledOnce();
  await act(async()=>vi.advanceTimersByTimeAsync(3000));
  expect(next).toHaveBeenCalledOnce();
});

test("startup activity has an indeterminate accessible progress label", () => {
  render(<Loading />);
  expect(screen.getByRole("progressbar", {name:"Starting Everwise"})).not.toHaveAttribute("aria-valuenow");
});

test("slow startup offers an explicit reload without reloading automatically or moving focus", async () => {
  vi.useFakeTimers();
  const reload = vi.fn();
  render(<><button>Existing focus</button><Loading onReload={reload} /></>);
  const focus = screen.getByRole("button", {name: "Existing focus"}); focus.focus();
  await act(async () => vi.advanceTimersByTimeAsync(14_999));
  expect(screen.queryByRole("button", {name: "Try again"})).toBeNull();
  await act(async () => vi.advanceTimersByTimeAsync(1));
  expect(screen.getByRole("status")).toHaveTextContent("taking longer than usual");
  expect(focus).toHaveFocus();
  expect(reload).not.toHaveBeenCalled();
  const action = screen.getByRole("button", {name: "Try again"});
  expect(action.closest('[role="status"], [aria-live]')).toBeNull();
  fireEvent.click(action); expect(reload).toHaveBeenCalledOnce();
});

test("known-account loading removes generic reload recovery and clears its timer", async () => {
  vi.useFakeTimers();
  const {rerender,unmount}=render(<Loading />);
  await act(async () => vi.advanceTimersByTimeAsync(15_000));
  expect(screen.getByRole("button", {name:"Try again"})).toBeVisible();
  rerender(<Loading allowReload={false} />);
  expect(screen.queryByRole("button", {name:"Try again"})).toBeNull();
  await act(async () => vi.advanceTimersByTimeAsync(30_000));
  expect(screen.queryByText(/taking longer/)).toBeNull();
  rerender(<Loading />);unmount();expect(vi.getTimerCount()).toBe(0);
});
