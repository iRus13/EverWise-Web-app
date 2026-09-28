// Keep the default aligned with EVERWISE_PUBLIC_APP_ORIGIN in .env.example.
export function partnerLearnerBaseUrl({ native = false, currentUrl, publicOrigin = "https://everwise.tips" }) {
  try {
    const url = new URL(native ? publicOrigin : currentUrl);
    if (url.username || url.password) return null;
    if (native) {
      if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) return null;
    } else if (!["https:", "http:"].includes(url.protocol)) return null;
    url.hash = "";
    return url;
  } catch { return null; }
}
