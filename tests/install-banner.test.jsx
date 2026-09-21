import React from "react";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
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
  expect(screen.getByText('"Add to Home Screen."')).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Dismiss"}));
  expect(screen.queryByRole("button",{name:"Dismiss"})).not.toBeInTheDocument();
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
