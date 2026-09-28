import { useEffect } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

// WebKit's CSS safe area does not include iPadOS window controls. Ask UIKit
// for its corner-adapted region as the native window changes size.
export default function useNativeWindowInsets(viewport) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const layout = registerPlugin("EverwiseLayout");
    let active = true;
    let generation = 0;
    let frame;
    const update = async () => {
      const request = ++generation;
      try {
        const { top } = await layout.getInsets();
        if (active && request === generation && Number.isFinite(top) && top >= 0) {
          viewport.current?.style.setProperty("--native-window-top", `${top}px`);
        }
      } catch {
        // Older installed native shells keep CSS's existing safe-area fallback.
      }
    };
    const resized = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    void update();
    window.addEventListener("resize", resized);
    window.visualViewport?.addEventListener("resize", resized);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resized);
      window.visualViewport?.removeEventListener("resize", resized);
    };
  }, [viewport]);
}
