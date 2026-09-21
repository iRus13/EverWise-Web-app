import assert from "node:assert/strict";
import test from "node:test";
import { assertEmulatorEnvironment, firebaseQaExitCode, firestoreChannelKey, isCanceledFirestoreNavigationError, isUnloadingFirestoreRetry } from "../scripts/firebase-qa-config.mjs";

const isolated = {
  GCLOUD_PROJECT: "demo-everwise-qa",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8089",
};
test("Firebase integration runner accepts only the isolated demo environment", () => {
  assert.doesNotThrow(() => assertEmulatorEnvironment(isolated));
  for (const [key, value] of Object.entries(isolated)) {
    assert.throws(() => assertEmulatorEnvironment({ ...isolated, [key]: undefined }));
    assert.throws(() => assertEmulatorEnvironment({ ...isolated, [key]: value.replace("127.0.0.1", "example.com").replace("demo-everwise-qa", "games-caf0e") }));
  }
  assert.throws(() => assertEmulatorEnvironment({ ...isolated, FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" }));
});

const complete = { version: 1, project: "demo-everwise-qa", serviceScenarios: 15, browserWidths: [390, 1440] };
test("a zero CLI exit after watchdog interruption can never pass Firebase QA", () => {
  assert.equal(firebaseQaExitCode({ code: 0, timedOut: true, result: complete }), 1);
  assert.equal(firebaseQaExitCode({ code: 2, timedOut: false, result: complete }), 2);
  assert.equal(firebaseQaExitCode({ code: null, timedOut: false, result: complete }), 1);
});
test("Firebase QA success requires complete service and both-width browser evidence", () => {
  assert.equal(firebaseQaExitCode({ code: 0, timedOut: false, result: complete }), 0);
  for (const result of [undefined, { ...complete, browserWidths: [390] }, { ...complete, serviceScenarios: 14 }, { ...complete, project: "wrong-project" }]) {
    assert.throws(() => firebaseQaExitCode({ code: 0, timedOut: false, result }));
  }
});

test("navigation diagnostics require both an abandoned channel and a browser cancellation", () => {
  const message = "/127.0.0.1:8089/google.firestore.v1.Firestore/Listen/channel?SID=old%3D%3D&t=2 due to access control checks.";
  const old = new Set(["old=="]), none = new Set();
  assert.equal(isCanceledFirestoreNavigationError(message, old, old), true);
  assert.equal(isCanceledFirestoreNavigationError(`Fetch API cannot load http:/${message}`, old, old), true);
  assert.equal(isCanceledFirestoreNavigationError(message, none, old), false);
  assert.equal(isCanceledFirestoreNavigationError(message, old, none), false);
  assert.equal(isCanceledFirestoreNavigationError(message.replace("old%3D%3D", "live"), old, old), false);
  assert.equal(isCanceledFirestoreNavigationError(message.replace(":8089", ":8080"), old, old), false);
  assert.equal(isCanceledFirestoreNavigationError(message.replace("127.0.0.1", "example.com"), old, old), false);
  assert.equal(isCanceledFirestoreNavigationError("TypeError: invalid profile", old, old), false);
});

test("initial channel diagnostics require the exact request to be abandoned and canceled", () => {
  const url = "http://127.0.0.1:8089/google.firestore.v1.Firestore/Write/channel?VER=8&RID=72100&CVER=22&X-HTTP-Session-Id=gsessionid&zx=unique&t=1";
  const message = `${url.slice(6)} due to access control checks.`;
  const key = firestoreChannelKey(url), observed = new Set([key]), none = new Set();
  assert.equal(key, `url:${url}`);
  assert.equal(isCanceledFirestoreNavigationError(message, observed, observed), true);
  assert.equal(isCanceledFirestoreNavigationError(message, none, observed), false);
  assert.equal(isCanceledFirestoreNavigationError(message, observed, none), false);
  assert.equal(isCanceledFirestoreNavigationError(message.replace("unique", "other"), observed, observed), false);
  assert.equal(isCanceledFirestoreNavigationError(message.replace("72100", "72101"), observed, observed), false);
  assert.equal(isCanceledFirestoreNavigationError(message.replace(":8089", ":8080"), observed, observed), false);
  assert.equal(firestoreChannelKey(url.replace("127.0.0.1", "example.com")), null);
  assert.equal(firestoreChannelKey(url.replace("Write/channel", "Write/other")), null);
});

test("unload retry diagnostics require the exact URL and ordered lifecycle of the same document", () => {
  const url = "http://127.0.0.1:8089/google.firestore.v1.Firestore/Write/channel?database=projects%2Fdemo-everwise-qa%2Fdatabases%2Fdefault&RID=42&zx=unique";
  const message = `${url.slice(6)} due to access control checks.`;
  const trace = [
    { documentId: "old", event: "beforeunload", leaving: true },
    { documentId: "old", event: "fetch", leaving: true, url },
    { documentId: "old", event: "error", leaving: true, url, name: "TypeError", message: "Load failed" },
    { documentId: "old", event: "pagehide", leaving: true, hidden: true },
  ];
  assert.equal(isUnloadingFirestoreRetry(message, trace), true);
  for (let index = 0; index < trace.length; index++) {
    assert.equal(isUnloadingFirestoreRetry(message, trace.filter((_, i) => i !== index)), false);
    assert.equal(isUnloadingFirestoreRetry(message, trace.map((e, i) => i === index ? { ...e, documentId: "live" } : e)), false);
  }
  assert.equal(isUnloadingFirestoreRetry(message, [trace[1], trace[0], trace[2], trace[3]]), false);
  assert.equal(isUnloadingFirestoreRetry(message, [trace[0], trace[1], trace[3], trace[2]]), false);
  assert.equal(isUnloadingFirestoreRetry(message, trace.map(e => ({ ...e, leaving: false }))), false);
  assert.equal(isUnloadingFirestoreRetry(message.replace("unique", "other"), trace), false);
  assert.equal(isUnloadingFirestoreRetry(message.replace(":8089", ":8080"), trace), false);
  assert.equal(isUnloadingFirestoreRetry(message.replace("demo-everwise-qa", "live-project"), trace), false);
  assert.equal(isUnloadingFirestoreRetry("TypeError: invalid profile", trace), false);
  assert.equal(isUnloadingFirestoreRetry(message, trace.map(e => e.event === "error" ? { ...e, message: "Active app error" } : e)), false);
});
