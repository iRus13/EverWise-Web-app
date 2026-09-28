import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
import Paywall from "../src/screens/Paywall.jsx";
afterEach(cleanup);
const products = [
  { id: "com.everwise.app.monthly", displayPrice: "€12,99", periodUnit: "month", periodValue: 1 },
  { id: "com.everwise.app.annual", displayPrice: "€79,99", periodUnit: "year", periodValue: 1, eligibleForTrial: true, trialValue: 1, trialUnit: "week" },
];
const props = { platform: "native", onStartTrial: vi.fn(), onMaybeLater: vi.fn(), onStartLearning: vi.fn(), onRestore: vi.fn(), onRetry: vi.fn() };
test("native price and renewal terms use the same localized Apple catalog", () => {
  render(<Paywall {...props} storeProducts={products} />);
  expect(document.body).not.toHaveTextContent(/\$|7.50|89.99|14.99/);
  expect(screen.getByRole("button", {name: "Continue with monthly"})).toHaveAccessibleDescription(/€12,99\/month/);
  fireEvent.click(screen.getByRole("radio", { name: /Annual/ }));
  expect(screen.getByRole("button", { name: "Start 1 week free trial" })).toHaveAccessibleDescription(/1 week free, then €79,99\/year/);
  expect(screen.getByRole("button", { name: "Open free introduction" })).toBeVisible();
});
test.each([false, undefined])("does not advertise a trial when eligibility is %s", (eligibleForTrial) => {
  render(<Paywall {...props} storeProducts={products.map(p => ({...p, eligibleForTrial}))} />);
  fireEvent.click(screen.getByRole("radio", { name: /Annual/ }));
  expect(screen.getByRole("button", { name: "Continue with annual" })).toBeVisible();
  expect(document.body).not.toHaveTextContent(/free trial|No charge today/);
});
test.each([[], products.slice(0, 1), products.map(p => ({...p, periodValue: 3})), products.map(p => ({...p, displayPrice: ""}))].map(value => [value]))("unavailable or unsupported products do not expose a purchase action", (storeProducts) => {
  render(<Paywall {...props} storeProducts={storeProducts} />);
  expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  expect(screen.getByRole("button", {name: "Retry"})).toBeVisible();
  expect(screen.getByRole("button", {name: "Restore"})).toBeVisible();
});
test("restore errors remain visible even when product loading failed", async () => {
  render(<Paywall {...props} onRestore={vi.fn().mockRejectedValue(new Error("No active subscription"))} />);
  fireEvent.click(screen.getByRole("button", {name: "Restore"}));
  expect(await screen.findByText("No active subscription")).toBeVisible();
});

function pending() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

test("native purchase progress keeps its selected price and prevents repeated requests", async () => {
  const request = pending();
  const purchase = vi.fn(() => request.promise);
  const restore = vi.fn();
  render(<Paywall {...props} storeProducts={products} onStartTrial={purchase} onRestore={restore} />);
  const cta = screen.getByRole("button", {name: "Continue with monthly"});
  act(() => { cta.click(); cta.click(); screen.getByRole("button", {name: "Restore"}).click(); });
  expect(purchase).toHaveBeenCalledExactlyOnceWith("monthly");
  expect(restore).not.toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("Waiting for the App Store…");
  expect(cta).toBeDisabled();
  expect(cta).toHaveAccessibleDescription(/€12,99\/month/);
  await act(async () => request.reject({code: "PURCHASE_CANCELLED"}));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(cta).toBeEnabled();
});

test("native purchase failure is visible and the selected plan can be retried", async () => {
  const purchase = vi.fn().mockRejectedValueOnce(new Error("App Store is unavailable.")).mockResolvedValueOnce(undefined);
  render(<Paywall {...props} storeProducts={products} onStartTrial={purchase} />);
  fireEvent.click(screen.getByRole("radio", {name: /Annual/}));
  fireEvent.click(screen.getByRole("button", {name: "Start 1 week free trial"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("App Store is unavailable.");
  await act(async () => fireEvent.click(screen.getByRole("button", {name: "Start 1 week free trial"})));
  expect(purchase.mock.calls).toEqual([["annual"], ["annual"]]);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("restore has distinct visible progress and successful feedback", async () => {
  const request = pending();
  const restore = vi.fn(() => request.promise);
  render(<Paywall {...props} storeProducts={products} onRestore={restore} />);
  fireEvent.click(screen.getByRole("button", {name: "Restore"}));
  expect(screen.getByRole("status")).toHaveTextContent("Checking your App Store purchases…");
  expect(screen.getByRole("button", {name: "Continue with monthly"})).toBeDisabled();
  await act(async () => request.resolve());
  expect(screen.getByRole("status")).toHaveTextContent("Purchase restored.");
  expect(screen.getByRole("status")).not.toHaveClass("sr-only");
  expect(restore).toHaveBeenCalledOnce();
});

test("retry stays pending, suppresses duplicates and reports catalog errors", async () => {
  const request = pending();
  const retry = vi.fn(() => request.promise);
  render(<Paywall {...props} onRetry={retry} />);
  const button = screen.getByRole("button", {name: "Retry"});
  act(() => { button.click(); button.click(); });
  expect(retry).toHaveBeenCalledOnce();
  expect(screen.getByText("Loading subscription options…")).toBeVisible();
  expect(button).toBeDisabled();
  await act(async () => request.reject(new Error("Offline")));
  expect(screen.getByRole("alert")).toHaveTextContent("Subscription options could not be loaded. Please try again.");
  expect(button).toBeEnabled();
});

test.each([[products], [[]]])("free introduction has its own action with or without App Store products", (storeProducts) => {
  const introduction=vi.fn(),close=vi.fn(),purchase=vi.fn(),restore=vi.fn();
  render(<Paywall {...props} storeProducts={storeProducts} onStartLearning={introduction} onMaybeLater={close} onStartTrial={purchase} onRestore={restore} />);
  fireEvent.click(screen.getByRole("button", {name:"Open free introduction"}));
  expect(introduction).toHaveBeenCalledOnce();
  expect(close).not.toHaveBeenCalled();expect(purchase).not.toHaveBeenCalled();expect(restore).not.toHaveBeenCalled();
});
