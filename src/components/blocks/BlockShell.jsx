import { useEffect, useRef } from "react";
import LessonTopBar from "../LessonTopBar";

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
  owner?.scrollTo({ top: toEnd ? owner.scrollHeight : 0, behavior: "auto" });
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
    <div className="learning-focus learning-focus-shell flex h-full max-h-full min-h-0 flex-1 flex-col overflow-hidden">
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
