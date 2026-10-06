import { tr, useLocale } from '../i18n';
import { Capacitor } from "@capacitor/core";
import "../styles/native-shell.css";
import "../styles/design-system.css";
import "../styles/app-navigation.css";
import { Award } from "lucide-react";
import {
  BookIcon,
  HomeIcon,
  MessageSearchIcon,
  SettingsIcon,
} from "./Icons";
import { primaryNavigationState } from "../utils/responsiveNavigation.js";
import { PartnerLogo } from "./PartnerBrand.jsx";
import TextSizeControl from "./TextSizeControl";
import CourseProgressCard from "./CourseProgressCard";
import useNativeWindowInsets from "../hooks/useNativeWindowInsets";
import useVisibleFormFocus from "../hooks/useVisibleFormFocus";
import useViewportHeight from "../hooks/useViewportHeight";
import useNativeTextMetrics from "../hooks/useNativeTextMetrics";

const iconByDestination = {
  home: HomeIcon,
  course: BookIcon,
  "scam-checker": MessageSearchIcon,
  badges: Award,
  settings: SettingsIcon,
};

export default function AppShell({
  children,
  screen = "loading",
  isAuthenticated = false,
  partner = null,
  navigationDisabled = false,
  onHome,
  onCourse,
  onScamChecker,
  onBadges,
  onSettings,
  textSize,
  onTextSizeChange,
  courseProgress = null,
}) {
  useLocale();
  const canvas = useRef(null);
  const viewport = useRef(null);
  useNativeWindowInsets(viewport);
  useViewportHeight();
  useNativeTextMetrics();
  useVisibleFormFocus(canvas);
  useLayoutEffect(() => {
    // Wide layouts scroll the document. A new screen must not inherit the
    // course's current-step offset or a previous page's reading position.
    // Run before destination effects, so a course or form can then reveal its
    // own current item. Leave the persistent navigation's scroll position alone.
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    if (canvas.current) canvas.current.scrollTop = 0;
  }, [screen]);
  useEffect(() => {
    const main = canvas.current;
    if (!main) return;
    let target;
    const focusContent = () => {
      // Respect a child screen that has already focused its own field/heading.
      if (main.contains(document.activeElement) && document.activeElement !== main) {
        target = document.activeElement;
        return;
      }
      target = main.querySelector("h1") || main;
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    focusContent();
    const observer = new MutationObserver(() => {
      // A lazy screen can replace the focused loading heading. Restore focus
      // only if it was lost with that node, never over a learner's new focus.
      if ((!main.contains(target) && document.activeElement === document.body) ||
          (target === main && document.activeElement === main && main.querySelector("h1"))) {
        focusContent();
      }
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [screen]);
  const navigation = primaryNavigationState(screen, isAuthenticated);
  const handlers = {
    home: onHome,
    course: onCourse,
    "scam-checker": onScamChecker,
    badges: onBadges,
    settings: onSettings,
  };
  const showNavigation = navigation.length > 0;
  const partnerName = partner?.name?.trim();

  return (
    <div ref={viewport} className={`app-viewport app-screen-${screen}${showNavigation ? " has-primary-navigation" : ""}${Capacitor.isNativePlatform() ? " is-native-app" : ""}`}>
      <div
        className={`app-shell ${
          showNavigation ? "has-app-navigation" : "is-focus-shell"
        }`}
      >
        {showNavigation ? (
          <nav className="app-navigation" aria-label={tr("Primary navigation")}>
            <div className="app-navigation-brand">
              <img
                src={`${import.meta.env.BASE_URL}everwise-logo-192.png`}
                alt=""
                aria-hidden="true"
                className="app-navigation-logo"
              />
              <strong className="app-navigation-brand-name">Everwise</strong>
              {partnerName ? (
                <div className="app-navigation-partner-lockup">
                  <PartnerLogo
                    partner={partner}
                    className="app-navigation-partner-logo"
                  />
                  <small className="app-navigation-partner">{tr("Access provided by")} {partnerName}
                  </small>
                </div>
              ) : null}
            </div>
            <div className="app-navigation-items">
              {navigation.map((item) => {
                const Icon = iconByDestination[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={handlers[item.id]}
                    disabled={navigationDisabled}
                    aria-label={tr(item.label)}
                    aria-current={item.active ? "page" : undefined}
                    className={`app-navigation-item ${
                      item.active ? "is-active" : ""
                    }`}
                  >
                    <Icon className="h-6 w-6 shrink-0" />
                    <span>{item.id === "scam-checker" ? tr("Checker") : tr(item.label)}</span>
                  </button>
                );
              })}
              {onTextSizeChange ? (
                <div className="app-navigation-textsize">
                  <span className="app-navigation-textsize-label">{tr("Text size")}</span>
                  <TextSizeControl
                    textSize={textSize}
                    onTextSizeChange={onTextSizeChange}
                    buttonClassName="app-navigation-textsize-button"
                  />
                </div>
              ) : null}
            </div>

            {/* Pinned to the bottom of the sidebar: where you are in the
                course, visible from any screen. */}
            {courseProgress ? (
              <CourseProgressCard {...courseProgress} />
            ) : null}
          </nav>
        ) : null}

        <main ref={canvas} tabIndex={-1} className={`app-canvas app-canvas-${screen}`}>{children}</main>
      </div>
    </div>
  );
}
import { useEffect, useLayoutEffect, useRef } from "react";
