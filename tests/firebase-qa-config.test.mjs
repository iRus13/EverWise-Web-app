import assert from "node:assert/strict";
import test from "node:test";
import { assertEmulatorEnvironment, firebaseQaExitCode, isCanceledFirestoreNavigationError } from "../scripts/firebase-qa-config.mjs";

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
