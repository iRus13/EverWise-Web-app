// Loaded only by qa-firebase-browser.mjs's isolated Vite alias.
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator, doc, getDocFromServer, updateDoc, disableNetwork, enableNetwork } from "firebase/firestore";
import { createFirebaseClient } from "../../src/config/firebaseClient.js";

const config = __EVERWISE_EMULATOR__;
if (config.projectId !== "demo-everwise-qa" || config.host !== "127.0.0.1") {
  throw new Error("Firebase browser QA requires isolated local emulators");
}
const { app, auth, db } = createFirebaseClient({
  projectId: config.projectId,
  apiKey: "local-demo-key",
  authDomain: "demo-everwise-qa.firebaseapp.com",
}, undefined, { experimentalForceLongPolling: true });
// The local emulator's streaming transport can stall in headless WebKit.
// Explicit long polling changes only this test connection; production keeps
// the SDK defaults. Real Auth, rules, writes and server reads remain required.
connectAuthEmulator(auth, `http://${config.host}:${config.authPort}`, { disableWarnings: true });
connectFirestoreEmulator(db, config.host, config.firestorePort);
export { auth, db };
export default app;
async function withinDeadline(operation) {
  let timer;
  try {
    return await Promise.race([operation, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Emulator operation exceeded 60 seconds")), 60_000);
    })]);
  } finally { clearTimeout(timer); }
}
export async function readOwnProfile() {
  if (!auth.currentUser) throw new Error("No signed-in test account");
  return (await withinDeadline(getDocFromServer(doc(db, "users", auth.currentUser.uid)))).data();
}
export const disconnectDatabase = () => disableNetwork(db);
export const reconnectDatabase = () => enableNetwork(db);
export const forgeSubscriptionMirror = () => withinDeadline(updateDoc(doc(db, "users", auth.currentUser.uid), { subscriptionStatus: "active", plan: "annual" }));
