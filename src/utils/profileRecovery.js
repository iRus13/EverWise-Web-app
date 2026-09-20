// Recreating a deleted document must satisfy the same rules as signup.
// Preserve learning/profile data; access comes from billing, StoreKit or the
// partner service, never these client-writable subscription mirrors. Billing
// may already have been cancelled before the failed Auth deletion.
export function profileForRecreation(profile) {
  return {
    ...profile,
    subscriptionStatus: "expired",
    trialStartedAt: null,
    plan: null,
  };
}
