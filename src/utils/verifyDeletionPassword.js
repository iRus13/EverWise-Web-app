// Stop waiting before any deletion/billing mutation begins. This does not cancel
// Firebase reauthentication: its eventual result can refresh authentication, but
// must never resume an abandoned deletion or automatically retry verification.
export async function verifyDeletionPassword(verify) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = globalThis.setTimeout(() => {
      const error = new Error("Password verification timed out");
      error.code = "account/password-verification-timeout";
      reject(error);
    }, 15_000);
  });
  try {
    return await Promise.race([Promise.resolve().then(verify), deadline]);
  } finally {
    globalThis.clearTimeout(timer);
  }
}
