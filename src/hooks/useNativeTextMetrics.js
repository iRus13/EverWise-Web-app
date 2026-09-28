import { useEffect } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

// Keep the learner's saved app preference separate from the system setting.
// Native metrics remain on the document between screens to avoid a size flash.
export default function useNativeTextMetrics() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const layout = registerPlugin("EverwiseLayout");
    const root = document.documentElement;
    let active = true, revision = 0, listener;
    const reflow = () => {
      const css = getComputedStyle(root);
      const scale = (parseFloat(css.getPropertyValue("--app-text-scale")) || 1) *
        (parseFloat(root.style.getPropertyValue("--system-text-scale")) || 1);
      root.dataset.expandedText = String(scale >= 1.44);
    };
    const apply = (metrics) => {
      if (!active || !metrics || !Number.isFinite(metrics.bodyScale) || metrics.bodyScale <= 0 ||
          !Number.isFinite(metrics.titleScale) || metrics.titleScale <= 0) return;
      root.style.setProperty("--system-text-scale", String(metrics.bodyScale));
      root.style.setProperty("--system-title-scale", String(metrics.titleScale));
      root.dataset.systemTextCategory = String(metrics.category || "");
      reflow();
    };
    const refresh = async () => {
      const request = ++revision;
      try {
        const metrics = await layout.getTextMetrics();
        if (request === revision) apply(metrics);
      } catch { /* Older native shells retain the app's existing size control. */ }
    };
    const changed = (metrics) => { ++revision; apply(metrics); };
    // Subscribe before requesting the snapshot. A newer change event wins
    // over any older snapshot still crossing the native bridge.
    void (async () => {
      try {
        const handle = await layout.addListener("textMetricsChanged", changed);
        if (active) listener = handle;
        else await handle.remove();
      } catch { /* Missing plugin/event support must not prevent rendering. */ }
      if (active) void refresh();
    })();
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", visible);
    const observer = new MutationObserver(reflow);
    observer.observe(root, { attributes: true, attributeFilter: ["data-text-size"] });
    return () => {
      active = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", visible);
      void listener?.remove().catch(() => {});
    };
  }, []);
}
