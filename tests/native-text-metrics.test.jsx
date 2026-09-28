import React from "react";
import {afterEach,beforeEach,expect,test,vi} from "vitest";
import {act,cleanup,render} from "@testing-library/react";
const mocks=vi.hoisted(()=>({native:false,get:vi.fn(),add:vi.fn(),remove:vi.fn(),register:vi.fn(),changed:null}));
vi.mock("@capacitor/core",()=>({Capacitor:{isNativePlatform:()=>mocks.native},registerPlugin:name=>{mocks.register(name);return {getTextMetrics:mocks.get,addListener:mocks.add};}}));
import useNativeTextMetrics from "../src/hooks/useNativeTextMetrics";
function View(){useNativeTextMetrics();return <main/>;}
const metrics=(scale,category="large")=>({bodyScale:scale,titleScale:1+(scale-1)/2,category});
const root=document.documentElement;
beforeEach(()=>{
 mocks.native=true;mocks.get.mockResolvedValue(metrics(1));mocks.remove.mockResolvedValue();
 mocks.add.mockImplementation((name,handler)=>{expect(name).toBe("textMetricsChanged");mocks.changed=handler;return Promise.resolve({remove:mocks.remove});});
 root.style.setProperty("--app-text-scale","1");
});
afterEach(()=>{cleanup();vi.resetAllMocks();mocks.changed=null;root.removeAttribute("style");delete root.dataset.expandedText;delete root.dataset.systemTextCategory;delete root.dataset.textSize;localStorage.clear();});
test("web leaves font preferences and native APIs untouched",async()=>{
 mocks.native=false;render(<View/>);await act(async()=>{});expect(mocks.register).not.toHaveBeenCalled();expect(root.style.getPropertyValue("--system-text-scale")).toBe("");
});
test("native body and title metrics do not overwrite the saved app size",async()=>{
 localStorage.setItem("everwise-text-size","size-4");root.dataset.textSize="size-4";
 mocks.get.mockResolvedValue(metrics(3.12,"accessibilityXXXL"));render(<View/>);await act(async()=>{});
 expect(root.style.getPropertyValue("--system-text-scale")).toBe("3.12");expect(root.style.getPropertyValue("--system-title-scale")).toBe("2.06");
 expect(root.dataset.expandedText).toBe("true");expect(root.dataset.systemTextCategory).toBe("accessibilityXXXL");
 expect(root.dataset.textSize).toBe("size-4");expect(localStorage.getItem("everwise-text-size")).toBe("size-4");
});
test("live system changes beat an older snapshot and restore compact layout",async()=>{
 let finish;mocks.get.mockImplementation(()=>new Promise(r=>finish=r));render(<View/>);await act(async()=>{});
 act(()=>mocks.changed(metrics(3.12)));await act(async()=>finish(metrics(1)));
 expect(root.style.getPropertyValue("--system-text-scale")).toBe("3.12");
 act(()=>mocks.changed(metrics(1)));expect(root.dataset.expandedText).toBe("false");
});
test("layout responds when the in-app size changes at a fixed system size",async()=>{
 mocks.get.mockResolvedValue(metrics(1.2));render(<View/>);await act(async()=>{});expect(root.dataset.expandedText).toBe("false");
 await act(async()=>{root.style.setProperty("--app-text-scale","1.89");root.dataset.textSize="size-10";});
 expect(root.dataset.expandedText).toBe("true");
});
test.each([{bodyScale:NaN,titleScale:1},{bodyScale:-1,titleScale:1},{bodyScale:2,titleScale:0},{bodyScale:"2",titleScale:1},null])("invalid bridge metrics keep the previous valid value: %j",async invalid=>{
 render(<View/>);await act(async()=>{});act(()=>mocks.changed(invalid));expect(root.style.getPropertyValue("--system-text-scale")).toBe("1");
});
test("older shells without the new methods still render",async()=>{
 mocks.get.mockRejectedValue(new Error("not implemented"));mocks.add.mockRejectedValue(new Error("not implemented"));render(<View/>);await act(async()=>{});
 expect(root.style.getPropertyValue("--system-text-scale")).toBe("");
});
test("subscription is ready before the snapshot and late subscriptions are removed",async()=>{
 let subscribe;mocks.add.mockImplementation(()=>new Promise(r=>subscribe=r));
 const {unmount}=render(<View/>);expect(mocks.get).not.toHaveBeenCalled();unmount();await act(async()=>subscribe({remove:mocks.remove}));
 expect(mocks.get).not.toHaveBeenCalled();expect(root.style.getPropertyValue("--system-text-scale")).toBe("");expect(mocks.remove).toHaveBeenCalledOnce();
});
test("unmount rejects an in-flight snapshot and future events",async()=>{
 let snapshot;mocks.get.mockImplementation(()=>new Promise(r=>snapshot=r));
 const {unmount}=render(<View/>);await act(async()=>{});unmount();
 await act(async()=>{snapshot(metrics(3));mocks.changed(metrics(2));});
 expect(root.style.getPropertyValue("--system-text-scale")).toBe("");expect(mocks.remove).toHaveBeenCalledOnce();
});
test("returning to the foreground refreshes preferences and cleans up",async()=>{
 const {unmount}=render(<View/>);await act(async()=>{});mocks.get.mockResolvedValue(metrics(2));
 await act(async()=>document.dispatchEvent(new Event("visibilitychange")));expect(root.style.getPropertyValue("--system-text-scale")).toBe("2");
 unmount();document.dispatchEvent(new Event("visibilitychange"));expect(mocks.get).toHaveBeenCalledTimes(2);expect(mocks.remove).toHaveBeenCalledOnce();
});
