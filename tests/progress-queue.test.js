import assert from "node:assert/strict";
import test from "node:test";
import { createProgressQueue, mergeProgress } from "../src/utils/progressQueue.js";

class Storage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes,no) => {resolve=yes; reject=no;});
  return {promise, resolve, reject};
};
const tick = () => new Promise(resolve => setImmediate(resolve));
const completion = (id, badge = id) => ({completedLessons:[id], badges:[badge]});

test("pending progress survives reload and is sent only for the owning account", async () => {
  const storage = new Storage(), stalled = deferred();
  const first = createProgressQueue({uid:"alice", storage, write:() => stalled.promise});
  first.enqueue(completion("welcome"));
  assert.equal(first.snapshot().durable, true);
  first.dispose();
  const other = createProgressQueue({uid:"bob", storage, write:() => assert.fail("Bob must not send Alice's progress")});
  await other.flush();
  assert.equal(other.snapshot().pending, false);
  const calls=[];
  const restored = createProgressQueue({uid:"alice", storage, write:async (...args) => calls.push(args)});
  assert.deepEqual(restored.snapshot().progress, completion("welcome"));
  await restored.flush();
  assert.deepEqual(calls, [["alice", completion("welcome")]]);
  assert.equal(storage.length, 0);
  assert.equal(restored.snapshot().pending, false);
  other.dispose(); restored.dispose();
});

test("acknowledging one completion cannot erase a later pending completion", async () => {
  const storage=new Storage(), first=deferred(), second=deferred(), calls=[];
  const queue=createProgressQueue({uid:"learner", storage, write:(_uid,progress) => {
    calls.push(progress); return calls.length===1 ? first.promise : second.promise;
  }});
  queue.enqueue(completion("welcome"));
  await tick();
  queue.enqueue(completion("internet"));
  assert.equal(calls.length, 1);
  first.resolve(); await tick();
  assert.deepEqual(calls, [completion("welcome"), completion("internet")]);
  assert.deepEqual(queue.snapshot().progress, completion("internet"));
  assert.equal(storage.length,1);
  second.resolve(); await tick();
  assert.equal(storage.length,0); assert.equal(queue.snapshot().pending,false);
  queue.dispose();
});

test("rejected saves stay durable and manual retry clears them only after success", async () => {
  const storage=new Storage(); let attempts=0;
  const queue=createProgressQueue({uid:"learner",storage,write:async()=>{if(++attempts===1)throw new Error("offline");}});
  queue.enqueue(completion("welcome")); await tick();
  assert.equal(queue.snapshot().failed,true); assert.equal(queue.snapshot().durable,true);
  assert.equal(storage.length,1);
  await queue.flush(); assert.equal(attempts,2); assert.equal(storage.length,0);
  queue.dispose();
});

test("a timed-out write permits retry and its late acknowledgement preserves new work", async () => {
  const first=deferred(), retry=deferred(), calls=[];
  const queue=createProgressQueue({uid:"learner",storage:new Storage(),timeoutMs:15,write:(_uid,progress)=>{
    calls.push(progress); return calls.length===1 ? first.promise : retry.promise;
  }});
  queue.enqueue(completion("welcome")); await queue.flush();
  assert.equal(queue.snapshot().saving,false); assert.equal(queue.snapshot().failed,true);
  queue.enqueue(completion("internet")); await tick();
  assert.deepEqual(calls[1], mergeProgress(completion("welcome"),completion("internet")));
  first.resolve(); await tick();
  assert.deepEqual(queue.snapshot().progress, completion("internet"));
  assert.equal(queue.snapshot().saving,true);
  retry.resolve(); await tick();
  assert.equal(queue.snapshot().pending,false); queue.dispose();
});

test("blocked storage keeps progress in memory without claiming a durable copy", async () => {
  const storage={get length(){throw new Error("blocked");},setItem(){throw new Error("quota");},removeItem(){throw new Error("blocked");}};
  let online=false;
  const queue=createProgressQueue({uid:"learner",storage,write:async()=>{if(!online)throw new Error("offline");}});
  queue.enqueue(completion("welcome")); await tick();
  assert.equal(queue.snapshot().pending,true); assert.equal(queue.snapshot().durable,false);
  online=true; await queue.flush(); assert.equal(queue.snapshot().pending,false);
  queue.dispose();
});

test("independent tabs use distinct journal entries and merge without overwriting", async () => {
  const storage=new Storage(), blocked=deferred();
  const cloud={completedLessons:["already-saved"],badges:[]};
  const first=createProgressQueue({uid:"learner",storage,write:()=>blocked.promise});
  const second=createProgressQueue({uid:"learner",storage,write:async(_uid,delta)=>Object.assign(cloud,mergeProgress(cloud,delta))});
  first.enqueue(completion("welcome")); await tick();
  second.enqueue(completion("internet")); await second.flush();
  assert.deepEqual(new Set(cloud.completedLessons),new Set(["already-saved","welcome","internet"]));
  assert.equal(storage.length,0);
  blocked.resolve(); await tick();
  first.dispose(); second.dispose();
});

test("malformed, oversized and cross-account records never become cloud updates", async () => {
  const storage=new Storage(); const prefix="everwise.progress.pending.v1:learner:";
  for(const [id,raw] of [["json","{"],["big","x".repeat(100001)],["owner",JSON.stringify({version:1,uid:"other",id:"owner",...completion("welcome")})],["type",JSON.stringify({version:1,uid:"learner",id:"type",completedLessons:[{}],badges:[]})]])storage.setItem(prefix+id,raw);
  const queue=createProgressQueue({uid:"learner",storage,write:()=>assert.fail("invalid storage was sent")});
  await queue.flush(); assert.equal(queue.snapshot().pending,false); queue.dispose();
});

test("deletion clears only the owner's journal and ignores late completion", async () => {
  const storage=new Storage(), pending=deferred();
  const alice=createProgressQueue({uid:"alice",storage,write:()=>pending.promise});
  const bob=createProgressQueue({uid:"bob",storage,write:()=>pending.promise});
  alice.enqueue(completion("welcome")); bob.enqueue(completion("internet")); await tick();
  let notices=0; alice.subscribe(()=>notices++); alice.clear();
  assert.equal(storage.length,1);
  assert.ok(storage.key(0).startsWith("everwise.progress.pending.v1:bob:"));
  pending.resolve(); await tick();
  assert.equal(notices,0);
  assert.equal(alice.snapshot().pending,false);
  assert.equal(bob.snapshot().pending,false);
  assert.equal(storage.length,0);
  bob.dispose();
});

test("only completion and badge arrays are sent, never local access claims", async () => {
  const sent=[];
  const queue=createProgressQueue({uid:"learner",storage:new Storage(),write:async(_uid,delta)=>sent.push(delta)});
  queue.enqueue({...completion("welcome"),subscriptionStatus:"active",partnerId:"spoof"});
  await queue.flush(); assert.deepEqual(sent,[completion("welcome")]); queue.dispose();
});

test("cleared device storage is no longer described as a durable pending copy", async () => {
  const storage=new Storage(), pending=deferred();
  const queue=createProgressQueue({uid:"learner",storage,write:()=>pending.promise});
  queue.enqueue(completion("welcome")); await tick();
  assert.equal(queue.snapshot().durable,true);
  storage.values.clear(); queue.refresh();
  assert.equal(queue.snapshot().durable,false);
  assert.deepEqual(queue.snapshot().progress,completion("welcome"));
  pending.resolve(); await tick(); queue.dispose();
});
