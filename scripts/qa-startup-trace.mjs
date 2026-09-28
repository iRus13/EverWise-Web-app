// Instrument only the isolated QA build; never record identity or response data.
export function instrumentStartup(source) {
  const replaceOnce = (before, after) => {
    if (source.split(before).length !== 2) throw new Error(`Startup trace target changed: ${before}`);
    source = source.replace(before, after);
  };
  replaceOnce('  updateDoc,\n} from "firebase/firestore";',
    '  updateDoc as qaUpdateDoc,\n} from "firebase/firestore";\nconst updateDoc = (...args) => { window.__qaStartupMark("profile-write"); return qaUpdateDoc(...args); };');
  replaceOnce('const unsub = onAuthStateChanged(auth, async (u) => {',
    'window.__qaStartupMark("auth-listen");\nconst unsub = onAuthStateChanged(auth, async (u) => {\nawait window.__qaStartupAuth();\nwindow.__qaStartupMark("auth-received");');
  replaceOnce('const snap = await readStartupProfile(() => getDoc(doc(db, "users", u.uid)));',
    'const snap = await window.__qaStartupTrace("profile", () => readStartupProfile(() => window.__qaStartupProfileRead(() => getDoc(doc(db, "users", u.uid)))));');
  replaceOnce('const normalized = normalizeSubscription(snap.data());',
    'const normalized = await window.__qaStartupTrace("normalize", () => normalizeSubscription(snap.data()));');
  for (const owner of ["firebaseUser", "cred.user", "expectedUser"]) {
    replaceOnce(`readWithDeadline(() => ${owner}.getIdToken(true), { message: "Account verification timed out" })`,
      `readWithDeadline(() => window.__qaFreshTokenRead(() => ${owner}.getIdToken(true)), { message: "Account verification timed out" })`);
  }
  // This isolated fault case must never reach destructive storage APIs, even
  // if a future regression accidentally continues beyond the held read.
  replaceOnce('  reauthenticateWithCredential,\n', '  reauthenticateWithCredential as qaReauthenticate,\n');
  replaceOnce('  signOut,\n', '  signOut as qaSignOut,\n');
  source += '\nconst signOut = (...args) => window.__qaSignOut(() => qaSignOut(...args));\n';
  source += '\nconst reauthenticateWithCredential = (...args) => window.__qaReauthenticate(() => qaReauthenticate(...args));\n';
  replaceOnce('  deleteUser,\n', '  deleteUser as qaDeleteUser,\n');
  replaceOnce('  deleteDoc,\n', '  deleteDoc as qaDeleteDoc,\n');
  source += '\nconst deleteUser = (...args) => window.__qaDeletionGuard(() => qaDeleteUser(...args));\nconst deleteDoc = (...args) => window.__qaDeletionGuard(() => qaDeleteDoc(...args));\n';
  replaceOnce('const idToken = await readWithDeadline(() => firebaseUser.getIdToken(), { message: "Account access token timed out" });\n  return fetchPartnerAccess({ idToken });',
    'const idToken = await window.__qaStartupTrace("access-token", () => readWithDeadline(() => window.__qaStartupTokenRead(() => firebaseUser.getIdToken()), { message: "Account access token timed out" }));\n  return window.__qaStartupTrace("access-request", () => fetchPartnerAccess({ idToken }));');
  return source;
}

export function instrumentBillingToken(source) {
  const before = '() => authenticatedToken(user), { message: "Billing access token timed out" }';
  if (source.split(before).length !== 2) throw new Error("Billing token trace target changed");
  return source.replace(before, '() => window.__qaBillingTokenRead(() => authenticatedToken(user)), { message: "Billing access token timed out" }');
}
