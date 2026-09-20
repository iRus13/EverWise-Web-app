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
});
connectAuthEmulator(auth, `http://${config.host}:${config.authPort}`, { disableWarnings: true });
connectFirestoreEmulator(db, config.host, config.firestorePort);
export { auth, db };
export default app;
export async function readOwnProfile() {
  if (!auth.currentUser) throw new Error("No signed-in test account");
  return (await getDocFromServer(doc(db, "users", auth.currentUser.uid))).data();
}
export const disconnectDatabase = () => disableNetwork(db);
export const reconnectDatabase = () => enableNetwork(db);
export const forgeSubscriptionMirror = () => updateDoc(doc(db, "users", auth.currentUser.uid), { subscriptionStatus: "active", plan: "annual" });
