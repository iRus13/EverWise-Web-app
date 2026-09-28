import React, { useRef } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import useVisibleFormFocus, { revealFocusedField } from "../src/hooks/useVisibleFormFocus";

function Form() {
  const container = useRef(null);
  useVisibleFormFocus(container);
  return <div ref={container} data-testid="pane" style={{overflowY: "auto"}}><div data-form-field data-testid="field"><label htmlFor="name">Name</label><input id="name" /></div><button>Continue</button></div>;
}
let bottom;
function form() {
  const view = render(<Form />);
  const pane = screen.getByTestId("pane");
  Object.defineProperty(pane, "clientHeight", {get: () => bottom - 100});
  pane.getBoundingClientRect = () => ({top: 100, bottom, height: bottom - 100});
  screen.getByTestId("field").getBoundingClientRect = () => ({top: 200 - pane.scrollTop, bottom: 300 - pane.scrollTop, height: 100});
  screen.getByLabelText("Name").getBoundingClientRect = () => ({top: 250 - pane.scrollTop, bottom: 300 - pane.scrollTop, height: 50});
  return {...view, pane};
}
beforeEach(() => {
  bottom = 400;
  vi.useFakeTimers();
  vi.stubGlobal("visualViewport", new EventTarget());
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function frame() { act(() => vi.advanceTimersByTime(40)); }

test("keyboard completion reveals the field and label inside the resized pane, above fixed actions", () => {
  const {pane} = form();
  screen.getByLabelText("Name").focus();
  frame();
  expect(pane.scrollTop).toBe(0);
  bottom = 250;
  window.dispatchEvent(new Event("keyboardDidShow"));
  frame();
  expect(pane.scrollTop).toBe(62);
  expect(screen.getByTestId("field").getBoundingClientRect().bottom).toBe(238);
  expect(document.activeElement).toBe(screen.getByLabelText("Name"));
});

test("viewport changes reveal an edited field but never redirect button focus", () => {
  const {pane} = form();
  screen.getByLabelText("Name").focus();
  frame();
  bottom = 250;
  window.visualViewport.dispatchEvent(new Event("resize"));
  frame();
  expect(pane.scrollTop).toBe(62);
  screen.getByRole("button").focus();
  bottom = 220;
  window.dispatchEvent(new Event("keyboardDidShow"));
  frame();
  expect(pane.scrollTop).toBe(62);
  expect(document.activeElement).toBe(screen.getByRole("button"));
});

test("a dismissed screen cancels pending focus work", () => {
  const {unmount, pane} = form();
  screen.getByLabelText("Name").focus();
  bottom = 250;
  unmount();
  frame();
  window.dispatchEvent(new Event("keyboardDidShow"));
  frame();
  expect(pane.scrollTop).toBe(0);
});


test('a missing choice below the fold is revealed without scrolling the fixed shell', () => {
  const {container} = render(<div style={{overflowY:'hidden'}}><div data-testid="choices-pane" style={{overflowY:'auto'}}><div data-form-choices data-form-field><button role="radio" aria-checked="false">Smartphone</button></div></div></div>);
  const pane = screen.getByTestId('choices-pane');
  const shell = pane.parentElement;
  const choice = screen.getByRole('radio');
  Object.defineProperty(pane, 'clientHeight', {value:300});
  pane.getBoundingClientRect = () => ({top:100,bottom:400,height:300});
  choice.parentElement.getBoundingClientRect = () => ({top:600-pane.scrollTop,bottom:1100-pane.scrollTop,height:500});
  choice.getBoundingClientRect = () => ({top:600-pane.scrollTop,bottom:660-pane.scrollTop,height:60});
  choice.focus({preventScroll:true});
  revealFocusedField(container);
  expect(pane.scrollTop).toBe(272);
  expect(choice.getBoundingClientRect().bottom).toBe(388);
  expect(shell.scrollTop).toBe(0);
  expect(choice).toHaveAttribute('aria-checked','false');
});


test('desktop form focus reveals a target through document scrolling outside the canvas', () => {
  const {container} = render(<div data-form-choices data-form-field><button role="radio" aria-checked="false">Every day</button></div>);
  const choice = screen.getByRole('radio');
  const scroll = vi.spyOn(window,'scrollBy').mockImplementation(() => {});
  document.body.style.overflowY='auto';
  Object.defineProperty(document.body,'clientHeight',{value:900,configurable:true});
  const bounds=vi.spyOn(document.body,'getBoundingClientRect').mockReturnValue({top:0,bottom:900,height:900});
  choice.parentElement.getBoundingClientRect = () => ({top:-500,bottom:1000,height:1500});
  choice.getBoundingClientRect = () => ({top:-500,bottom:-440,height:60});
  try {
    choice.focus({preventScroll:true});
    revealFocusedField(container);
    expect(scroll).toHaveBeenCalledWith(0,-512);
    expect(document.body.scrollTop).toBe(0);
  } finally {
    document.body.style.overflowY='';
    delete document.body.clientHeight;
    bounds.mockRestore();scroll.mockRestore();
  }
});
