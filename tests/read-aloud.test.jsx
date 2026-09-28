import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
import ReadAloud from "../src/components/ReadAloud.jsx";
let audios;
beforeEach(() => {
  audios = [];
  vi.stubGlobal("Audio", class {
    constructor(src) { this.src = src; audios.push(this); }
    pause = vi.fn(); play = vi.fn().mockResolvedValue();
  });
  vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(text) {this.text = text;} });
  vi.stubGlobal("speechSynthesis", {cancel: vi.fn(), speak: vi.fn()});
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
test("a response arriving after Stop cannot start audio", async () => {
  let resolve;
  vi.stubGlobal("fetch", vi.fn(() => new Promise(r => {resolve = r;})));
  render(<ReadAloud text="Stale response test" />);
  fireEvent.click(screen.getByRole("button"));
  fireEvent.click(screen.getByRole("button"));
  await act(async () => resolve({ok: true, blob: async () => new Blob(["audio"])}));
  expect(audios).toHaveLength(0);
  expect(screen.getByRole("button", {name: "Read aloud"})).toHaveAttribute("aria-busy", "false");
});
test("changing lesson text resets playing state and stops old audio", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok: true, blob: async () => new Blob(["audio"])}));
  const {rerender} = render(<ReadAloud text="First lesson" />);
  await act(async () => fireEvent.click(screen.getByRole("button")));
  expect(screen.getByRole("button", {name: "Stop"})).toBeVisible();
  rerender(<ReadAloud text="Next lesson" />);
  expect(audios[0].pause).toHaveBeenCalled();
  expect(screen.getByRole("button", {name: "Read aloud"})).toHaveAttribute("aria-pressed", "false");
});
test("a hung narration request falls back to device speech after eight seconds", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn((_url, {signal}) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  })));
  render(<ReadAloud text="Timeout fallback" />);
  fireEvent.click(screen.getByRole("button"));
  await act(async () => vi.advanceTimersByTimeAsync(8000));
  expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", {name: "Stop"})).toHaveAttribute("aria-busy", "false");
});
test("rejected playback releases audio and falls back only once", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok: true, blob: async () => new Blob(["audio"])}));
  vi.stubGlobal("Audio", class {
    constructor(src) {this.src=src; audios.push(this);}
    pause=vi.fn(); play=vi.fn().mockRejectedValue(new Error("blocked playback"));
  });
  render(<ReadAloud text="Playback failure" />);
  await act(async () => fireEvent.click(screen.getByRole("button")));
  await act(async () => audios[0].onerror());
  expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  expect(audios[0].pause).toHaveBeenCalled();
});

test.each(["onend", "onerror"].flatMap(event => ["device", "recorded"].map(mode => ({event, mode}))))(
  "a canceled device utterance's $event cannot reset newer $mode playback",
  async ({event, mode}) => {
    const response = {ok:true, blob:async () => new Blob(["new audio"])};
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("provider unavailable"));
    if (mode === "recorded") fetchMock.mockResolvedValueOnce(response);
    else fetchMock.mockRejectedValueOnce(new Error("provider unavailable"));
    vi.stubGlobal("fetch", fetchMock);
    render(<ReadAloud text={`Restart ${event} ${mode}`} />);
    await act(async () => fireEvent.click(screen.getByRole("button")));
    const oldUtterance = window.speechSynthesis.speak.mock.calls[0][0];
    const staleCallback = oldUtterance[event];
    fireEvent.click(screen.getByRole("button", {name:"Stop"}));
    await act(async () => fireEvent.click(screen.getByRole("button", {name:"Read aloud"})));
    const cancellations = window.speechSynthesis.cancel.mock.calls.length;
    act(() => staleCallback());
    expect(screen.getByRole("button", {name:"Stop"})).toHaveAttribute("aria-pressed", "true");
    expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(cancellations);
    fireEvent.click(screen.getByRole("button", {name:"Stop"}));
    if (mode === "recorded") expect(audios[0].pause).toHaveBeenCalled();
    else expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(cancellations + 1);
    expect(screen.getByRole("button", {name:"Read aloud"})).toHaveAttribute("aria-pressed", "false");
  },
);

test("leaving one lesson invalidates its speech callback before the next lesson starts", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("provider unavailable")));
  const view = render(<ReadAloud text="First device-spoken lesson" />);
  await act(async () => fireEvent.click(screen.getByRole("button")));
  const oldCallback = window.speechSynthesis.speak.mock.calls[0][0].onend;
  view.rerender(<ReadAloud text="Second device-spoken lesson" />);
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Read aloud"})));
  act(() => oldCallback());
  expect(screen.getByRole("button", {name:"Stop"})).toHaveAttribute("aria-pressed", "true");
  const currentCallback = window.speechSynthesis.speak.mock.calls[1][0].onend;
  act(() => currentCallback());
  expect(screen.getByRole("button", {name:"Read aloud"})).toHaveAttribute("aria-pressed", "false");
});

test("an ended recording from an unmounted screen cannot cancel the new screen's device speech", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce({ok:true, blob:async () => new Blob(["old recording"])})
    .mockRejectedValueOnce(new Error("provider unavailable")));
  const oldScreen = render(<ReadAloud text="Unmounted recorded lesson" />);
  await act(async () => fireEvent.click(screen.getByRole("button")));
  const staleEnded = audios[0].onended;
  oldScreen.unmount();
  render(<ReadAloud text="New screen's device-spoken lesson" />);
  await act(async () => fireEvent.click(screen.getByRole("button")));
  const cancellations = window.speechSynthesis.cancel.mock.calls.length;
  act(() => staleEnded());
  expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(cancellations);
  expect(screen.getByRole("button", {name:"Stop"})).toHaveAttribute("aria-pressed", "true");
});


test.each(["missing engine", "missing utterance", "throws", "error event"])("unavailable narration reports %s and a retry clears the error", async failure => {
  const voice = window.speechSynthesis;
  const Utterance = globalThis.SpeechSynthesisUtterance;
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("provider offline")));
  if (failure === "missing engine") vi.stubGlobal("speechSynthesis", undefined);
  if (failure === "missing utterance") vi.stubGlobal("SpeechSynthesisUtterance", undefined);
  if (failure === "throws") voice.speak.mockImplementationOnce(() => { throw new Error("voice unavailable"); });
  render(<ReadAloud text={`Unavailable narration ${failure}`} />);
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Read aloud"})));
  if (failure === "error event") act(() => voice.speak.mock.calls[0][0].onerror());
  expect(screen.getByRole("status")).toHaveTextContent("Audio isn't available right now. Please try again.");
  expect(screen.getByRole("button", {name:"Read aloud"})).toHaveAttribute("aria-pressed", "false");
  vi.stubGlobal("speechSynthesis", voice);
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Read aloud"})));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("button", {name:"Stop"})).toHaveAttribute("aria-pressed", "true");
});

test("a canceled utterance error cannot show an unavailable message after Stop", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("provider offline")));
  render(<ReadAloud text="Canceled utterance must stay quiet" />);
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Read aloud"})));
  const utterance = window.speechSynthesis.speak.mock.calls[0][0];
  fireEvent.click(screen.getByRole("button", {name:"Stop"}));
  act(() => utterance.onerror());
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
