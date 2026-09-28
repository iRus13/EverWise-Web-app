import React from "react";
import {act,cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,expect,test,vi} from "vitest";
import {Capacitor} from "@capacitor/core";
import AddToHomeScreenBanner from "../src/components/AddToHomeScreenBanner.jsx";

beforeEach(()=>{
  localStorage.clear();
  vi.spyOn(Capacitor,"isNativePlatform").mockReturnValue(false);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();delete navigator.standalone;});
function ipad(standalone=false) {
  vi.spyOn(navigator,"userAgent","get").mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15");
  Object.defineProperty(navigator,"standalone",{value:standalone,configurable:true});
}
test("iPad Safari with a desktop user agent shows installation guidance and remembers dismissal",()=>{
  ipad();
  const view=render(<AddToHomeScreenBanner/>);
  expect(screen.getByText("Add Everwise to your Home Screen")).toBeInTheDocument();
  const details = screen.getByText("Add Everwise to your Home Screen").closest("details");
  expect(details.open).toBe(false);
  fireEvent.click(screen.getByText("Add Everwise to your Home Screen"));
  expect(details.open).toBe(true);
  expect(screen.getByText("Add to Home Screen")).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Don’t show this again"}));
  expect(screen.queryByRole("button",{name:"Don’t show this again"})).not.toBeInTheDocument();
  view.unmount();render(<AddToHomeScreenBanner/>);
  expect(screen.queryByText("Add Everwise to your Home Screen")).not.toBeInTheDocument();
});
test.each(["standalone","native","desktop"])("%s app does not show mobile installation instructions",kind=>{
  ipad(kind==="standalone");
  if(kind==="native")Capacitor.isNativePlatform.mockReturnValue(true);
  if(kind==="desktop")delete navigator.standalone;
  render(<AddToHomeScreenBanner/>);
  expect(screen.queryByText("Add Everwise to your Home Screen")).not.toBeInTheDocument();
});

function android() {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 16) Chrome/140 Mobile Safari/537.36");
}
function installPrompt(prompt, userChoice) {
  const event = new Event("beforeinstallprompt", {cancelable: true});
  Object.assign(event, {prompt, userChoice});
  fireEvent(window, event);
  expect(event.defaultPrevented).toBe(true);
  return event;
}
function expand() { fireEvent.click(screen.getByText("Add Everwise to your Home Screen")); }
test("cancelled install keeps manual help and allows a fresh browser prompt", async () => {
  android(); render(<AddToHomeScreenBanner/>); expand();
  const prompt = vi.fn().mockResolvedValue(undefined);
  installPrompt(prompt, Promise.resolve({outcome:"dismissed"}));
  fireEvent.click(screen.getByRole("button", {name:"Install app"}));
  await waitFor(() => expect(screen.queryByRole("button", {name:"Install app"})).not.toBeInTheDocument());
  expect(localStorage.getItem("everwise-a2hs-dismissed")).toBeNull();
  expect(screen.getByText("Add Everwise to your Home Screen")).toHaveFocus();
  expect(screen.getByText("Add to Home screen")).toBeVisible();
  const next = vi.fn().mockResolvedValue(undefined);
  installPrompt(next, Promise.resolve({outcome:"accepted"}));
  fireEvent.click(screen.getByRole("button", {name:"Install app"}));
  await waitFor(() => expect(screen.queryByText("Add Everwise to your Home Screen")).not.toBeInTheDocument());
  expect(next).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem("everwise-a2hs-dismissed")).toBe("1");
});
test.each(["throw", "reject"])("installation %s is caught and shows fallback instructions", async kind => {
  android(); render(<AddToHomeScreenBanner/>); expand();
  const prompt = kind === "throw" ? vi.fn(() => {throw new Error("unavailable");}) : vi.fn().mockRejectedValue(new Error("unavailable"));
  installPrompt(prompt, Promise.resolve({outcome:"dismissed"}));
  fireEvent.click(screen.getByRole("button", {name:"Install app"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Installation could not open");
  expect(screen.getByText("Add to Home screen")).toBeVisible();
  expect(localStorage.getItem("everwise-a2hs-dismissed")).toBeNull();
});
test("pending installation blocks duplicate requests and safely settles after leaving Home", async () => {
  android(); const view = render(<AddToHomeScreenBanner/>); expand();
  let resolve;
  const choice = new Promise(done => {resolve = done;});
  const prompt = vi.fn().mockResolvedValue(undefined);
  installPrompt(prompt, choice);
  const button = screen.getByRole("button", {name:"Install app"});
  fireEvent.click(button); fireEvent.click(button);
  expect(button).toBeDisabled();
  expect(button).toHaveTextContent("Opening installation");
  expect(prompt).toHaveBeenCalledTimes(1);
  view.unmount();
  await act(async () => resolve({outcome:"accepted"}));
  expect(localStorage.getItem("everwise-a2hs-dismissed")).toBeNull();
});
test("installation through browser controls hides help immediately", () => {
  android(); render(<AddToHomeScreenBanner/>);
  fireEvent(window, new Event("appinstalled"));
  expect(screen.queryByText("Add Everwise to your Home Screen")).not.toBeInTheDocument();
  expect(localStorage.getItem("everwise-a2hs-dismissed")).toBe("1");
});
