import {afterEach, beforeEach, expect, test, vi} from "vitest";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
const native = vi.hoisted(() => ({enabled:true,getProducts:vi.fn(),purchase:vi.fn(),restore:vi.fn()}));
vi.mock("@capacitor/core", () => ({Capacitor:{isNativePlatform:()=>native.enabled},registerPlugin:()=>native}));
import {getSubscriptionProducts, purchaseSubscription, restoreSubscriptions} from "../src/services/purchases.js";
import Paywall from "../src/screens/Paywall.jsx";
function deferred() { let resolve,reject; const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject}; }
beforeEach(()=>{vi.useFakeTimers();native.enabled=true;native.getProducts.mockReset();native.purchase.mockReset();native.restore.mockReset();});
afterEach(()=>{cleanup();vi.useRealTimers();});
test.each(["resolve","reject"])("a stalled catalog frees paywall controls after 15 seconds; late %s cannot affect the next read",async settlement=>{
 const stalled=deferred();native.getProducts.mockReturnValueOnce(stalled.promise);
 const exit=vi.fn(),free=vi.fn();
 render(<Paywall platform="native" storeProducts={[]} onRetry={getSubscriptionProducts} onMaybeLater={exit} onStartLearning={free} />);
 fireEvent.click(screen.getByRole("button",{name:"Retry"}));
 expect(screen.getByRole("button",{name:"Back to home"})).toBeDisabled();
 await act(async()=>vi.advanceTimersByTimeAsync(14999));
 expect(screen.getByRole("button",{name:"Retry"})).toBeDisabled();
 await act(async()=>vi.advanceTimersByTimeAsync(1));
 expect(screen.getByRole("alert")).toHaveTextContent("Subscription options could not be loaded");
 expect(screen.getByRole("button",{name:"Retry"})).toBeEnabled();
 expect(screen.getByRole("button",{name:"Back to home"})).toBeEnabled();
 const fresh=deferred();native.getProducts.mockReturnValueOnce(fresh.promise);
 fireEvent.click(screen.getByRole("button",{name:"Retry"}));
 await act(async()=>Promise.resolve());
 await act(async()=>settlement==="resolve"?stalled.resolve({products:[]}):stalled.reject(new Error("Late failure")));
 expect(screen.getByRole("button",{name:"Retry"})).toBeDisabled();
 await act(async()=>fresh.resolve({products:[]}));
 expect(screen.queryByRole("alert")).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"Open free introduction"}));
 fireEvent.click(screen.getByRole("button",{name:"Back to home"}));
 expect(free).toHaveBeenCalledOnce();expect(exit).toHaveBeenCalledOnce();
 expect(native.purchase).not.toHaveBeenCalled();expect(native.restore).not.toHaveBeenCalled();
 expect(vi.getTimerCount()).toBe(0);
});
test("successful catalog preserves localized metadata and clears its timer",async()=>{
 const products=[{id:"com.everwise.app.monthly",displayPrice:"€12,99",periodUnit:"month",periodValue:1}];
 native.getProducts.mockResolvedValue({products});expect(await getSubscriptionProducts()).toEqual(products);expect(vi.getTimerCount()).toBe(0);
 native.enabled=false;expect(await getSubscriptionProducts()).toEqual([]);expect(native.getProducts).toHaveBeenCalledOnce();
});
test.each(["purchase","restore"])("the catalog deadline does not cancel or retry an in-flight %s",async operation=>{
 const pending=deferred();native[operation].mockReturnValue(pending.promise);
 const request=operation==="purchase"?purchaseSubscription("annual"):restoreSubscriptions();
 let settled=false;request.then(()=>{settled=true;});await vi.advanceTimersByTimeAsync(60000);
 expect(settled).toBe(false);expect(native[operation]).toHaveBeenCalledOnce();
 pending.resolve({active:true});expect(await request).toEqual({active:true});
});
