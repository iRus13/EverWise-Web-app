import {useLearningText} from "../../i18n/learning.js";
import { Check, CircleAlert } from "lucide-react";

export default function AnswerFeedback({ positive, title, children }) {
  const t = useLearningText();
  const Icon = positive ? Check : CircleAlert;
  return <div data-lesson-feedback className={`lesson-feedback ${positive ? "lesson-feedback-positive" : "lesson-feedback-caution"}`} role="status" aria-atomic="true">
    <div className="lesson-feedback-heading"><Icon size={22} aria-hidden="true" /><p>{t(title)}</p></div>
    {children && <div className="lesson-feedback-body">{children}</div>}
  </div>;
}
