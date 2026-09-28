import React, {useRef} from "react";
import {afterEach,expect,test,vi} from "vitest";
import {act,cleanup,render,screen} from "@testing-library/react";
const mocks=vi.hoisted(()=>({native:false,getInsets:vi.fn(),register:vi.fn()}));
vi.mock("@capacitor/core",()=>({Capacitor:{isNativePlatform:()=>mocks.native},registerPlugin:(name)=>{mocks.register(name);return {getInsets:mocks.getInsets};}}));
import useNativeWindowInsets from "../src/hooks/useNativeWindowInsets";
function View(){const ref=useRef(null);useNativeWindowInsets(ref);return <main ref={ref} data-testid="viewport"/>;}
afterEach(()=>{cleanup();vi.clearAllMocks();vi.useRealTimers();mocks.native=false;});
test("web layouts do not request native insets",()=>{render(<View/>);expect(mocks.register).not.toHaveBeenCalled();});
test("window resizing rejects out-of-order inset responses and cleans up listeners",async()=>{
 vi.useFakeTimers();mocks.native=true;const pending=[];
 mocks.getInsets.mockImplementation(()=>new Promise(resolve=>pending.push(resolve)));
 const {unmount}=render(<View/>);const view=screen.getByTestId("viewport");
 act(()=>window.dispatchEvent(new Event("resize")));
 await act(async()=>vi.advanceTimersByTimeAsync(20));
 expect(pending).toHaveLength(2);
 await act(async()=>pending[1]({top:54}));
 await act(async()=>pending[0]({top:24}));
 expect(view.style.getPropertyValue("--native-window-top")).toBe("54px");
 act(()=>window.dispatchEvent(new Event("resize")));
 await act(async()=>vi.advanceTimersByTimeAsync(20));
 unmount();await act(async()=>pending[2]({top:70}));
 expect(view.style.getPropertyValue("--native-window-top")).toBe("54px");
 act(()=>window.dispatchEvent(new Event("resize")));
 await act(async()=>vi.advanceTimersByTimeAsync(20));
 expect(mocks.getInsets).toHaveBeenCalledTimes(3);
});
test.each(["missing",NaN,-1])("unavailable or invalid native insets retain the CSS fallback: %s",async(value)=>{
 mocks.native=true;mocks.getInsets.mockImplementation(()=>value==="missing"?Promise.reject(new Error("not installed")):Promise.resolve({top:value}));
 render(<View/>);await act(async()=>{});
 expect(screen.getByTestId("viewport").style.getPropertyValue("--native-window-top")).toBe("");
});
