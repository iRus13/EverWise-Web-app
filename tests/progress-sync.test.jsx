import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
const mocks=vi.hoisted(()=>({write:vi.fn()}));
vi.mock("../src/firebase.js",()=>({db:{}}));
vi.mock("firebase/firestore",()=>({
  arrayUnion:(...values)=>({operation:"arrayUnion",values}),
  doc:(_db,collection,uid)=>({collection,uid}), updateDoc:mocks.write,
}));
import useProgressSync from "../src/hooks/useProgressSync.js";

beforeEach(()=>{mocks.write.mockReset().mockImplementation(()=>new Promise(()=>{}));});
afterEach(()=>{cleanup();window.localStorage.clear();});
const profile={completedLessons:[],badges:[]};

test("a stale deletion callback only clears its own account's pending records", async()=>{
  const currentUid={current:"alice"};
  const setProfile=vi.fn();
  const {result,rerender}=renderHook(({uid})=>useProgressSync({uid,profile,enabled:true,setProfile,currentUid}),{initialProps:{uid:"alice"}});
  await act(async()=>result.current.record({completedLessons:["welcome"]}));
  const oldClear=result.current.clear;
  currentUid.current="bob";
  rerender({uid:"bob"});
  await act(async()=>result.current.record({completedLessons:["internet"]}));
  act(()=>oldClear());
  expect(result.current.status.uid).toBe("bob");
  expect(result.current.status.pending).toBe(true);
  const keys=Array.from({length:localStorage.length},(_,index)=>localStorage.key(index));
  expect(keys).toHaveLength(1);
  expect(keys[0]).toContain(":bob:");
});

test("an account change before a queued writer runs prevents the old request", async()=>{
  const currentUid={current:"alice"};
  const setProfile=vi.fn();
  const {result}=renderHook(()=>useProgressSync({uid:"alice",profile,enabled:true,setProfile,currentUid}));
  await act(async()=>{
    result.current.record({completedLessons:["welcome"]});
    currentUid.current="bob";
  });
  expect(mocks.write).not.toHaveBeenCalled();
});
