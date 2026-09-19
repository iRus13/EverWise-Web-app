import { Capacitor } from "@capacitor/core";

const configuredOrigin = (import.meta.env.VITE_EVERWISE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

function secureNativeOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && !url.username && !url.password
      && url.pathname === "/" && !url.search && !url.hash ? url.origin : "";
  } catch { return ""; }
}

export function apiEndpoint(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = Capacitor.isNativePlatform() ? secureNativeOrigin(configuredOrigin) : configuredOrigin;
  // An invalid native origin stays local and fails recoverably; never send
  // authentication or pasted message text over an insecure network endpoint.
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}

export function warnIfNativeApiIsMissing() {
  if (Capacitor.isNativePlatform() && !secureNativeOrigin(configuredOrigin)) {
    console.error(
      "[Everwise] Native API URL is missing or is not a secure HTTPS origin. Build with VITE_EVERWISE_API_URL set to the secure HTTPS API origin.",
    );
  }
}
