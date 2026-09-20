import assert from "node:assert/strict";
export const QA_PROJECT = "demo-everwise-qa";
export const QA_HOST = "127.0.0.1";
export const QA_PORTS = Object.freeze({ auth:9099, firestore:8089, hub:4409, logging:4509 });
export function assertEmulatorEnvironment(env) {
  assert.equal(env.GCLOUD_PROJECT, QA_PROJECT, "Only the isolated demo project is allowed");
  assert.equal(env.FIREBASE_AUTH_EMULATOR_HOST, `${QA_HOST}:${QA_PORTS.auth}`, "Auth must use the local emulator");
  assert.equal(env.FIRESTORE_EMULATOR_HOST, `${QA_HOST}:${QA_PORTS.firestore}`, "Firestore must use the local emulator");
}

// WebKit can report canceled Firestore channels from the document being
// discarded as page errors. Only recognize a channel observed before reload
// AND independently reported canceled by the browser's network events.
export function isCanceledFirestoreNavigationError(message, abandoned, canceled) {
  if (!message.endsWith(" due to access control checks.")) return false;
  const match = message.match(/(?:https?:\/)?\/127\.0\.0\.1:\d+\/google\.firestore\.v1\.Firestore\/(?:Listen|Write)\/channel\?[^\s]+/);
  if (!match) return false;
  try {
    const url = new URL(match[0].startsWith("/") ? `http:/${match[0]}` : match[0]);
    const id = url.searchParams.get("SID");
    return url.origin === `http://${QA_HOST}:${QA_PORTS.firestore}` && Boolean(id) && abandoned.has(id) && canceled.has(id);
  } catch { return false; }
}

export function firebaseQaExitCode({ code, timedOut, result }) {
  // Firebase CLI catches SIGTERM and can exit zero after interrupting its child.
  // Neither that exit code nor a partial browser journey proves completion.
  if (timedOut) return 1;
  if (code !== 0) return Number.isInteger(code) && code > 0 ? code : 1;
  assert.equal(result?.project, QA_PROJECT, "Missing isolated suite completion proof");
  assert.equal(result?.version, 1, "Unsupported completion proof");
  assert.equal(result?.serviceScenarios, 15, "Incomplete service scenarios");
  assert.deepEqual(result?.browserWidths, [390, 1440], "Both browser journeys must finish");
  return 0;
}
