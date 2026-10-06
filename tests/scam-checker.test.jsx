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
  expect(screen.getAllByRole("heading").map(item => item.textContent)).toEqual([
    "This is likely a scam", "What to do next", "Warning signs",
  ]);
  expect(screen.getByText("This is an AI assessment, not a guarantee.")).toBeVisible();
  const disclosure = screen.getByText("Message you checked").closest("details");
  expect(disclosure).not.toHaveAttribute("open");
  expect(disclosure).toHaveTextContent("Send money now");
  expect(disclosure.querySelector("a")).toBeNull();
});

test.each([["uncertain", "Verify before deciding"], ["likely_legitimate", "Fewer warning signs. Still verify."]])("%s result keeps the limitation alongside its cautious title", async (verdict, title) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok: true, json: async () => ({...valid, verdict})}));
  submit();
  expect(await screen.findByRole("heading", {name:title,level:1})).toBeVisible();
  expect(screen.getByText("This is an AI assessment, not a guarantee.")).toBeVisible();
  expect(screen.queryByRole("heading", {name:"Check before you reply"})).not.toBeInTheDocument();
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

test("cancel preserves input and ignores an old response after a new check starts", async () => {
  const pending = [];
  const fetchMock = vi.fn((_url, options) => new Promise(resolve => pending.push({ resolve, signal: options.signal })));
  vi.stubGlobal("fetch", fetchMock);
  submit();
  fireEvent.click(screen.getByRole("button", {name: "Cancel check"}));
  expect(pending[0].signal.aborted).toBe(true);
  const input = screen.getByLabelText("Message to check");
  expect(input).toHaveValue("Send money now");
  expect(input).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("Check stopped");
  fireEvent.change(input, {target: {value: "A different message"}});
  fireEvent.click(screen.getByRole("button", {name: "Check this message"}));
  await act(async () => pending[0].resolve({ok: true, json: async () => valid}));
  expect(screen.queryByText(valid.summary)).not.toBeInTheDocument();
  expect(screen.getByRole("button", {name: "Cancel check"})).toBeVisible();
  await act(async () => pending[1].resolve({ok: true, json: async () => ({...valid, summary: "The second result"})}));
  expect(screen.getByText("The second result")).toBeVisible();
  expect(screen.getByRole("heading", {name: "This is likely a scam"})).toHaveFocus();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({message: "A different message"});
});

test("timeout recovers even when transport ignores abort, and late rejection cannot replace retry", async () => {
  vi.useFakeTimers();
  const pending = [];
  vi.stubGlobal("fetch", vi.fn((_url, options) => new Promise((resolve, reject) => pending.push({resolve, reject, signal: options.signal}))));
  submit();
  await act(async () => vi.advanceTimersByTimeAsync(30_000));
  expect(screen.getByRole("alert")).toHaveTextContent("took too long");
  expect(screen.getByRole("alert")).toHaveFocus();
  expect(screen.getByLabelText("Message to check")).toBeEnabled();
  fireEvent.click(screen.getByRole("button", {name: "Check this message"}));
  await act(async () => pending[0].reject(new Error("old failure")));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await act(async () => pending[1].resolve({ok: true, json: async () => valid}));
  expect(screen.getByText(valid.summary)).toBeVisible();
  await act(async () => vi.advanceTimersByTimeAsync(30_000));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("editing preserves the original message; checking another clears it without sending", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ok: true, json: async () => valid});
  vi.stubGlobal("fetch", fetchMock);
  submit();
  fireEvent.click(await screen.findByRole("button", {name: "Edit this message"}));
  expect(screen.getByLabelText("Message to check")).toHaveValue("Send money now");
  expect(screen.getByLabelText("Message to check")).toHaveFocus();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", {name: "Check this message"}));
  fireEvent.click(await screen.findByRole("button", {name: "Check another message"}));
  expect(screen.getByLabelText("Message to check")).toHaveValue("");
  expect(screen.getByLabelText("Message to check")).toHaveFocus();
  expect(screen.getByRole("button", {name: "Check this message"})).toBeDisabled();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("unmount aborts the check and clears its timeout", async () => {
  vi.useFakeTimers();
  let signal;
  vi.stubGlobal("fetch", vi.fn((_url, options) => {signal = options.signal; return new Promise(() => {});}));
  submit();
  cleanup();
  expect(signal.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

test("repeated submit events produce one request and service errors preserve input", async () => {
  let resolve;
  const fetchMock = vi.fn(() => new Promise(r => {resolve = r;}));
  vi.stubGlobal("fetch", fetchMock);
  submit();
  const input = screen.getByLabelText("Message to check");
  fireEvent.submit(input.closest("form"));
  fireEvent.submit(input.closest("form"));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ok: false, status: 503}));
  expect(screen.getByRole("alert")).toHaveTextContent("currently unavailable");
  expect(input).toHaveValue("Send money now");
  expect(input).toBeEnabled();
  expect(screen.getByRole("alert")).toHaveFocus();
});
