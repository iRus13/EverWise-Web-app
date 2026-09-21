import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
import Paywall from "../src/screens/Paywall.jsx";
afterEach(cleanup);
const products = [
  { id: "com.everwise.app.monthly", displayPrice: "€12,99", periodUnit: "month", periodValue: 1 },
  { id: "com.everwise.app.annual", displayPrice: "€79,99", periodUnit: "year", periodValue: 1, eligibleForTrial: true, trialValue: 1, trialUnit: "week" },
];
const props = { platform: "native", onStartTrial: vi.fn(), onMaybeLater: vi.fn(), onRestore: vi.fn(), onRetry: vi.fn() };
test("native price and renewal terms use the same localized Apple catalog", () => {
  render(<Paywall {...props} storeProducts={products} />);
  expect(document.body).not.toHaveTextContent(/\$|7.50|89.99|14.99/);
  expect(screen.getByRole("button", {name: "Continue with monthly"})).toHaveAccessibleDescription(/€12,99\/month/);
  fireEvent.click(screen.getByRole("radio", { name: /Annual/ }));
  expect(screen.getByRole("button", { name: "Start 1 week free trial" })).toHaveAccessibleDescription(/1 week free, then €79,99\/year/);
  expect(screen.getByRole("button", { name: "Continue with free lessons" })).toBeVisible();
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
