import { useEffect } from "react";

export function revealFocusedField(container) {
  const active = document.activeElement;
  if (!container?.contains(active) ||
      !active.matches("input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable=true], [data-form-choices] [role=radio], [data-form-choices] [role=checkbox]")) return;
  const field = active.closest("[data-form-field]") || active;
  // WebKit's focus scrolling can align with the WebView rather than the
  // nested form pane. Move only scrollable ancestors, keeping fixed actions
  // and headers in place. Prefer including the label when it fits.
  for (let parent = active.parentElement; parent; parent = parent.parentElement) {
    if (/^(auto|scroll)$/.test(getComputedStyle(parent).overflowY) && parent.clientHeight > 0) {
      const bounds = parent.getBoundingClientRect();
      const top = Math.max(0, bounds.top) + 12;
      const bottom = Math.min(innerHeight, bounds.bottom) - 12;
      let rect = field.getBoundingClientRect();
      if (rect.height > bottom - top) rect = active.getBoundingClientRect();
      const delta = rect.bottom > bottom ? rect.bottom - bottom : rect.top < top ? rect.top - top : 0;
      // Wide web layouts scroll the document outside the app canvas. body.scrollTop
      // does not move the viewport in standards mode; use the window there.
      if (parent === document.body || parent === document.documentElement) window.scrollBy(0, delta);
      else parent.scrollTop += delta;
    }
  }
}

export default function useVisibleFormFocus(container) {
  useEffect(() => {
    let frame;
    const reveal = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => revealFocusedField(container.current));
    };
    const viewport = window.visualViewport;
    document.addEventListener("focusin", reveal);
    window.addEventListener("resize", reveal);
    // @capacitor/keyboard emits this after the native keyboard animation.
    window.addEventListener("keyboardDidShow", reveal);
    viewport?.addEventListener("resize", reveal);
    // Native keyboard resizing can finish after keyboardDidShow. Observe the
    // form's actual available height instead of guessing an animation delay.
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(reveal) : null;
    if (container.current) observer?.observe(container.current);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener("focusin", reveal);
      window.removeEventListener("resize", reveal);
      window.removeEventListener("keyboardDidShow", reveal);
      viewport?.removeEventListener("resize", reveal);
    };
  }, [container]);
}
