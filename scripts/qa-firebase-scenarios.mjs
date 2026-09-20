import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { initializeApp, deleteApp } from "firebase/app";
import { initializeAuth, inMemoryPersistence, connectAuthEmulator, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, collection, setDoc, updateDoc, getDocFromServer, getDocs, deleteDoc, arrayUnion, disableNetwork, enableNetwork, terminate } from "firebase/firestore";
import { FIRESTORE_DATABASE_ID } from "../src/config/firebaseDatabase.js";
import { assertEmulatorEnvironment, QA_PROJECT, QA_HOST, QA_PORTS } from "./firebase-qa-config.mjs";

assertEmulatorEnvironment(process.env);
// Firebase CLI runs in its temporary config folder; Vite/Tailwind use the app root.
process.chdir(fileURLToPath(new URL("../", import.meta.url)));
const clients = [];
const password = "local-synthetic-password-42";
const profile = { name: "QA Learner", completedLessons: [], badges: [], subscriptionStatus: "expired", trialStartedAt: null, plan: null };
let passed = 0;
async function check(name, action) { await action(); passed++; console.log(`PASS: ${name}`); }
function client(name) {
  const app = initializeApp({ projectId: QA_PROJECT, apiKey: "local-demo-key" }, name);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, `http://${QA_HOST}:${QA_PORTS.auth}`, { disableWarnings: true });
  const db = getFirestore(app, FIRESTORE_DATABASE_ID);
  connectFirestoreEmulator(db, QA_HOST, QA_PORTS.firestore);
  const value = { app, auth, db }; clients.push(value); return value;
}
const denied = promise => assert.rejects(promise, error => error.code === "permission-denied");
try {
  const alice = client("alice"), bob = client("bob"), guest = client("guest"), aliceTab = client("alice-tab");
  const { user: a } = await createUserWithEmailAndPassword(alice.auth, "alice@example.test", password);
  const { user: b } = await createUserWithEmailAndPassword(bob.auth, "bob@example.test", password);
  const own = doc(alice.db, "users", a.uid);
  await check("new accounts cannot create paid entitlement mirrors", () => denied(setDoc(own, { ...profile, subscriptionStatus: "active" })));
  await check("new accounts cannot create trial entitlement mirrors", () => denied(setDoc(own, { ...profile, trialStartedAt: new Date().toISOString() })));
  await check("owner can create and read an unpaid profile", async () => {
    await setDoc(own, profile);
    assert.deepEqual((await getDocFromServer(own)).data(), profile);
    await setDoc(doc(bob.db, "users", b.uid), profile);
  });
  await check("other account cannot read a private profile", () => denied(getDocFromServer(doc(bob.db, "users", a.uid))));
  await check("other account cannot update a private profile", () => denied(updateDoc(doc(bob.db, "users", a.uid), { name: "Forbidden" })));
  await check("other account cannot delete a private profile", () => denied(deleteDoc(doc(bob.db, "users", a.uid))));
  await check("signed-out visitor cannot read profiles", () => denied(getDocFromServer(doc(guest.db, "users", a.uid))));
  await check("signed-out visitor cannot write profiles", () => denied(setDoc(doc(guest.db, "users", a.uid), profile)));
  await check("signed-in users cannot list the user directory", () => denied(getDocs(collection(alice.db, "users"))));
  await check("undeclared collections remain inaccessible", () => denied(setDoc(doc(alice.db, "private", a.uid), { value: true })));
  await signInWithEmailAndPassword(aliceTab.auth, "alice@example.test", password);
  await check("concurrent lesson saves preserve both completions without duplicates", async () => {
    await Promise.all([
      updateDoc(own, { completedLessons: arrayUnion("welcome"), badges: arrayUnion("Welcome Aboard") }),
      updateDoc(doc(aliceTab.db, "users", a.uid), { completedLessons: arrayUnion("safety"), badges: arrayUnion("Safety") }),
    ]);
    await updateDoc(own, { completedLessons: arrayUnion("welcome") });
    const saved = (await getDocFromServer(own)).data();
    assert.deepEqual(saved.completedLessons.sort(), ["safety", "welcome"]);
    assert.deepEqual(saved.badges.sort(), ["Safety", "Welcome Aboard"]);
  });
  await check("offline writes reach the server after reconnection", async () => {
    await disableNetwork(alice.db);
    const pending = updateDoc(own, { completedLessons: arrayUnion("offline") });
    assert.equal((await getDocFromServer(doc(aliceTab.db, "users", a.uid))).data().completedLessons.includes("offline"), false);
    await enableNetwork(alice.db); await pending;
    assert.equal((await getDocFromServer(doc(aliceTab.db, "users", a.uid))).data().completedLessons.includes("offline"), true);
  });
  await check("logging out revokes server reads; signing in restores saved progress", async () => {
    await signOut(alice.auth); await denied(getDocFromServer(own));
    await signInWithEmailAndPassword(alice.auth, "alice@example.test", password);
    assert.equal((await getDocFromServer(own)).data().completedLessons.length, 3);
  });
  await check("one learner's saves never appear in another account", async () => {
    assert.deepEqual((await getDocFromServer(doc(bob.db, "users", b.uid))).data().completedLessons, []);
  });
  await check("owner can delete their profile and synthetic Auth account", async () => {
    await deleteDoc(own); assert.equal((await getDocFromServer(own)).exists(), false);
    await deleteUser(alice.auth.currentUser);
    await assert.rejects(signInWithEmailAndPassword(alice.auth, "alice@example.test", password));
  });
  console.log(`PASS: ${passed} real Firebase Auth/Firestore emulator scenarios`);
  const { runBrowserScenarios } = await import("./qa-firebase-browser.mjs");
  await runBrowserScenarios();
} finally {
  await Promise.all(clients.map(async ({ app, db }) => { await terminate(db); await deleteApp(app); }));
}
