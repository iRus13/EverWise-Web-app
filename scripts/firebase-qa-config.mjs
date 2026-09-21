import assert from "node:assert/strict";
export const QA_PROJECT = "demo-everwise-qa";
export const QA_HOST = "127.0.0.1";
export const QA_PORTS = Object.freeze({ auth:9099, firestore:8089, hub:4409, logging:4509 });
export function assertEmulatorEnvironment(env) {
  assert.equal(env.GCLOUD_PROJECT, QA_PROJECT, "Only the isolated demo project is allowed");
  assert.equal(env.FIREBASE_AUTH_EMULATOR_HOST, `${QA_HOST}:${QA_PORTS.auth}`, "Auth must use the local emulator");
  assert.equal(env.FIRESTORE_EMULATOR_HOST, `${QA_HOST}:${QA_PORTS.firestore}`, "Firestore must use the local emulator");
}

// Initial channel requests do not have a server-issued SID yet. Their entire
// URL is required so another request cannot supply cancellation evidence.
export function firestoreChannelKey(value) {
  const url = new URL(value);
  if (url.origin !== `http://${QA_HOST}:${QA_PORTS.firestore}` ||
      !/^\/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel$/.test(url.pathname)) return null;
  return url.searchParams.get("SID") || `url:${url.href}`;
}

function firestoreDiagnosticUrl(message) {
  if (!message.endsWith(" due to access control checks.")) return null;
  const match = message.match(/(?:https?:\/)?\/127\.0\.0\.1:\d+\/google\.firestore\.v1\.Firestore\/(?:Listen|Write)\/channel\?[^\s]+/);
  if (!match) return null;
  try {
    const url = new URL(match[0].startsWith("/") ? `http:/${match[0]}` : match[0]);
    return firestoreChannelKey(url) ? url : null;
  } catch { return null; }
}

// WebKit can report canceled Firestore channels from the document being
// discarded as page errors. Require independent browser cancellation evidence.
export function isCanceledFirestoreNavigationError(message, abandoned, canceled) {
  const url = firestoreDiagnosticUrl(message);
  const id = url && firestoreChannelKey(url);
  return Boolean(id) && abandoned.has(id) && canceled.has(id);
}

// A Firestore retry issued after beforeunload may be rejected before WebKit
// emits a network request event. Accept only the exact native fetch URL from
// that departing document, followed by its pagehide. Active-page errors fail.
export function isUnloadingFirestoreRetry(message, trace) {
  const url = firestoreDiagnosticUrl(message);
  if (!url || url.searchParams.has("SID") ||
      url.searchParams.get("database") !== `projects/${QA_PROJECT}/databases/default`) return false;
  return trace.some((failure, index) => {
    if (failure.event !== "error" || failure.url !== url.href ||
        failure.leaving !== true || failure.name !== "TypeError" ||
        failure.message !== "Load failed" || !failure.documentId) return false;
    const before = trace.slice(0, index).filter(event => event.documentId === failure.documentId);
    const unload = before.findIndex(event => event.event === "beforeunload" && event.leaving === true);
    return unload !== -1 && before.slice(unload + 1).some(event =>
      event.event === "fetch" && event.url === url.href && event.leaving === true
    ) && trace.slice(index + 1).some(event =>
      event.documentId === failure.documentId && event.event === "pagehide" &&
      event.hidden === true && event.leaving === true
    );
  });
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
