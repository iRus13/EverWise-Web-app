import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import "../styles/install-help.css";

const DISMISS_KEY = "everwise-a2hs-dismissed";

function detectPlatform() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  // iPad Safari can send a Mac user agent. Its standalone capability remains
  // available, so installation guidance must not depend on the device name.
  const isIOS = (typeof navigator.standalone === "boolean" || /iphone|ipad|ipod/i.test(ua)) && !window.MSStream;
  const isAndroid = /android/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "desktop";
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// Optional web installation help, kept below the learner's main activities.
export default function AddToHomeScreenBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState("");
  const installingRef = useRef(false);
  const mounted = useRef(true);
  const help = useRef(null);
  const error = useRef(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (installError) error.current?.scrollIntoView?.({ block: "nearest" });
  }, [installError]);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }
    function handleInstalled() { dismiss(); }
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  if (Capacitor.isNativePlatform()) return null;
  if (isStandalone()) return null;
  if (dismissed) return null;

  const platform = detectPlatform();
  // On an actual desktop computer, "add to home screen" isn't a meaningful
  // action — skip the banner there rather than show irrelevant instructions.
  if (platform === "desktop") return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore — storage may be unavailable (private browsing, etc.).
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt || installingRef.current) return;
    const prompt = deferredPrompt;
    installingRef.current = true;
    setInstalling(true);
    setInstallError("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (mounted.current && choice?.outcome === "accepted") dismiss();
    } catch {
      if (mounted.current) setInstallError("Installation could not open. You can add Everwise from your browser’s menu instead.");
    } finally {
      installingRef.current = false;
      if (mounted.current) {
        // A browser prompt can only be used once. Keep manual help after cancel.
        setDeferredPrompt(current => current === prompt ? null : current);
        setInstalling(false);
        help.current?.focus({ preventScroll: true });
      }
    }
  }

  return (
    <details className="install-help">
      <summary ref={help}>Add Everwise to your Home Screen</summary>
      <div className="install-help-content">
        <p>Open Everwise from an icon on your device.</p>
        {platform === "ios" ? (
          <ol>
            <li>Open Everwise in Safari.</li>
            <li>Tap <strong>Share</strong> in Safari’s toolbar or menu, then <strong>Add to Home Screen</strong>.</li>
            <li>Keep <strong>Open as Web App</strong> on if shown, then tap <strong>Add</strong>.</li>
          </ol>
        ) : (
          <p>Open your browser’s menu and choose <strong>Add to Home screen</strong> or <strong>Install app</strong>.</p>
        )}
        {platform === "android" && deferredPrompt ? (
          <button type="button" className="btn-secondary" onClick={handleInstallClick} disabled={installing} aria-busy={installing}>
            {installing ? "Opening installation…" : "Install app"}
          </button>
        ) : null}
        {installError ? <p ref={error} role="alert" className="install-help-error">{installError}</p> : null}
        <button type="button" className="install-help-dismiss" onClick={dismiss}>Don’t show this again</button>
      </div>
    </details>
  );
}
