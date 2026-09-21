import { isValidEmail, normalizeEmail, USERNAME_AUTH_DOMAIN } from "./validation.js";

export function canReceivePasswordReset(value) {
  const email = normalizeEmail(value);
  return isValidEmail(email) && !email.endsWith(`@${USERNAME_AUTH_DOMAIN}`);
}

export async function requestEmailPasswordReset(value, sendReset) {
  if (!canReceivePasswordReset(value)) {
    const error = new Error("Enter the email address you used to create your account.");
    error.code = "recovery/email-required";
    throw error;
  }
  try {
    await sendReset(normalizeEmail(value));
  } catch (error) {
    // Keep the public response identical whether an address has an account.
    if (error?.code !== "auth/user-not-found") throw error;
  }
}
