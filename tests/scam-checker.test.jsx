import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
import ScamChecker from "../src/screens/ScamChecker.jsx";
vi.mock("../src/components/ReadAloud", () => ({ default: () => null }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const valid = { verdict: "likely_scam", summary: "Verify independently.", warning_signs: ["Urgency"], next_steps: ["Call your bank"], urgent_action: null };
function submit() {
  render(<ScamChecker onBack={() => {}} />);
  fireEvent.change(screen.getByLabelText("Message to check"), {target: {value: "Send money now"}});
  fireEvent.click(screen.getByRole("button", {name: "Check this message"}));
}
test.each([null, { ...valid, summary: {} }, {...valid, verdict: "toString"}, {...valid, next_steps: "oops"}, {...valid, warning_signs: [{}]}, {...valid, urgent_action: {}}])("malformed assessment %j shows a recoverable error instead of crashing", async (payload) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok: true, json: async () => payload}));
  submit();
  expect(await screen.findByRole("alert")).toHaveTextContent("We could not check");
  expect(screen.getByRole("button", {name: "Check this message"})).toBeEnabled();
});
test("valid results render warning signs and next steps", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok: true, json: async () => valid}));
  submit();
  expect(await screen.findByText("This is likely a scam")).toBeVisible();
  expect(screen.getByText("Call your bank")).toBeVisible();
});
test("a stalled request aborts and offers retry within 30 seconds", async () => {
  vi.useFakeTimers();
  let signal;
  vi.stubGlobal("fetch", vi.fn((_url, options) => new Promise((_resolve, reject) => {
    signal = options.signal;
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  })));
  submit();
  expect(screen.getByLabelText("Message to check")).toBeDisabled();
  await act(async () => vi.advanceTimersByTimeAsync(30_000));
  expect(signal.aborted).toBe(true);
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.getByRole("button", {name: "Check this message"})).toBeEnabled();
});
