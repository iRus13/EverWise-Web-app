import { useLayoutEffect } from "react";

// Safari 15.0–15.3 does not understand dvh. Its innerHeight follows the
// browser's visible layout viewport, including toolbar/orientation changes.
// Modern engines keep their native dynamic viewport behavior.
export default function useViewportHeight() {
  useLayoutEffect(() => {
    if (globalThis.CSS?.supports?.("height", "100dvh")) return;
    const style = document.documentElement.style;
    const property = "--app-viewport-height";
    const previous = style.getPropertyValue(property);
    const priority = style.getPropertyPriority(property);
    let applied;
    const update = () => {
      const height = window.innerHeight;
      if (!Number.isFinite(height) || height <= 0) return;
      const value = `${height}px`;
      if (value !== applied) {
        style.setProperty(property, value);
        applied = value;
      }
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      if (style.getPropertyValue(property) !== applied) return;
      if (previous) style.setProperty(property, previous, priority);
      else style.removeProperty(property);
    };
  }, []);
}
