import assert from "node:assert/strict";
import test from "node:test";
import { requestEmailPasswordReset } from "../src/utils/passwordRecovery.js";

test("email recovery normalizes the real address before calling the provider", async () => {
  const calls = [];
  await requestEmailPasswordReset("  Learner@Example.com  ", async email => calls.push(email));
  assert.deepEqual(calls, ["learner@example.com"]);
});

test("username-only and provisioned aliases never trigger an undeliverable email", async () => {
  for (const value of ["", "jane", "broken@", "Jane@ACCOUNTS.EVERWISE.APP", `ewp-${"a".repeat(48)}@accounts.everwise.app`]) {
    let called = false;
    await assert.rejects(requestEmailPasswordReset(value, async () => {called = true;}), {code:"recovery/email-required"});
    assert.equal(called, false, value);
  }
});

test("unknown addresses get the same completed response as existing accounts", async () => {
  const success = await requestEmailPasswordReset("known@example.com", async () => {});
  const unknown = await requestEmailPasswordReset("unknown@example.com", async () => { throw {code:"auth/user-not-found"}; });
  assert.equal(unknown, success);
});

test("network failures and provider throttling remain retryable errors", async () => {
  for (const code of ["auth/network-request-failed", "auth/too-many-requests"]) {
    await assert.rejects(requestEmailPasswordReset("learner@example.com", async () => {throw {code};}), {code});
  }
});
