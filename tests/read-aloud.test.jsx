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
