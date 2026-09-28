import { useEffect, useRef } from "react";
import LessonTopBar from "../LessonTopBar";
import "../../styles/lesson-experience.css";

// Short screens and desktop use a flowing lesson instead of a fixed content
// pane. Scroll its actual scroll owner so new questions and feedback still show.
function scrollLesson(content, toEnd = false) {
  if (!content) return;
  let owner = content;
  while (owner && !/^(auto|scroll)$/.test(window.getComputedStyle(owner).overflowY)) {
    owner = owner.parentElement;
  }
  if (!owner || owner === document.body || owner === document.documentElement) {
    owner = document.scrollingElement;
  }
  const feedback = toEnd ? content.querySelector("[data-lesson-feedback]") : null;
  if (!owner) return;
  const maximum = Math.max(0, owner.scrollHeight - owner.clientHeight);
  let top = toEnd ? maximum : 0;
  if (feedback) {
    const bounds = owner === document.scrollingElement ? {top: 0, bottom: window.innerHeight} : owner.getBoundingClientRect();
    const visibleTop = Math.max(0, bounds.top) + 12;
    const visibleBottom = Math.min(window.innerHeight, bounds.bottom) - 12;
    const rect = feedback.getBoundingClientRect();
    // Avoid unnecessary scrolling when feedback already fits. WKWebView can
    // otherwise report a document offset that disagrees with its visible controls.
    if (rect.top >= visibleTop && rect.bottom <= visibleBottom) return;
    const delta = rect.height > visibleBottom - visibleTop || rect.top < visibleTop
      ? rect.top - visibleTop : rect.bottom - visibleBottom;
    top = owner.scrollTop + delta;
  }
  owner.scrollTo({ top: Math.max(0, Math.min(maximum, top)), behavior: "auto" });
}

// Shared chrome for every lesson block and quiz question.
export default function BlockShell({
  label,
  progress,
  progressTotal,
  onBack,
  onSkip,
  onExit,
  children,
  footer,
  scrollKey,
  revealKey,
}) {
  const contentRef = useRef(null);
  const hadFooterRef = useRef(Boolean(footer));

  // Multi-question activities reuse the same shell. Always begin a new
  // question at the top instead of leaving the learner at the old scroll spot.
  useEffect(() => {
    scrollLesson(contentRef.current);
    const heading = contentRef.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({preventScroll: true});
  }, [scrollKey]);

  // When feedback and its action appear, bring them into view automatically.
  // Follow the active layout's scroll owner, including the flowing short view.
  useEffect(() => {
    const hasFooter = Boolean(footer);
    const shouldReveal = hasFooter && !hadFooterRef.current;
    hadFooterRef.current = hasFooter;

    if (!shouldReveal) return undefined;

    const frame = window.requestAnimationFrame(() => {
      scrollLesson(contentRef.current, true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [footer]);

  // Some activities always have a footer (for example, Check becomes
  // Continue), so they explicitly signal when their feedback should be shown.
  useEffect(() => {
    if (revealKey == null) return undefined;

    const frame = window.requestAnimationFrame(() => {
      scrollLesson(contentRef.current, true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [revealKey]);

  return (
    <div className="lesson-experience learning-focus learning-focus-shell flex h-full max-h-full min-h-0 flex-1 flex-col overflow-hidden">
      <LessonTopBar
        label={label}
        progress={progress}
        progressTotal={progressTotal}
        onBack={onBack}
        onSkip={onSkip}
        onExit={onExit}
      />
      <div
        ref={contentRef}
        className="lesson-content flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-4 pt-3"
      >
        {children}
      </div>
      <div className="lesson-footer shrink-0 border-t border-ink/5 bg-cream px-6 pb-3 pt-3">
        {footer || (
          <button
            type="button"
            className="btn-primary"
            disabled
            aria-label="Choose an answer before continuing"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
