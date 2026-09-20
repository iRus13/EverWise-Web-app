import { initializeApp } from "firebase/app";
import { browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { FIRESTORE_DATABASE_ID } from "./firebaseDatabase.js";

export function createFirebaseClient(config, name) {
  const app = initializeApp(config, name);
  // Explicit persistence also works on Capacitor's custom URL scheme.
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });
  const db = getFirestore(app, FIRESTORE_DATABASE_ID);
  return { app, auth, db };
}
