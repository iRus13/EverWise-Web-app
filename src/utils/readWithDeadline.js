// For non-mutating reads only. Do not use a deadline to retry writes or purchases.
export async function readWithDeadline(read, { timeoutMs = 15_000, message = "Read timed out" } = {}) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = globalThis.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    // A late SDK result cannot resume work after this attempt has rejected.
    return await Promise.race([Promise.resolve().then(read), deadline]);
  } finally {
    globalThis.clearTimeout(timer);
  }
}
