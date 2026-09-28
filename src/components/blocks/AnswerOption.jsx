import { Check, X } from "lucide-react";

// One selection treatment across single-answer activities. Keep the icon out
// of the accessible name; the button state and feedback announce the result.
export default function AnswerOption({ children, selected, state, className = "", ...props }) {
  const correct = state === "correct" || state === "safe";
  const incorrect = state === "incorrect";
  return (
    <button {...props} type="button" aria-pressed={selected}
      data-answer-state={state} className={`lesson-answer lesson-option ${className}`}>
      <span className="lesson-option-copy">{children}</span>
      <span className="lesson-option-mark" aria-hidden="true">
        {incorrect ? <X size={16} strokeWidth={2.5} /> : correct || selected ? <Check size={16} strokeWidth={2.5} /> : null}
      </span>
    </button>
  );
}
