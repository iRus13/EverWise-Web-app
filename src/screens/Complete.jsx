import {useLearningText} from "../i18n/learning.js";
import {Check} from "lucide-react";
import LearningSummary from "../components/LearningSummary";

export default function Complete({lesson, onDone}) {
  const t = useLearningText();
  const info = lesson.complete || {};
  return <LearningSummary className="complete-screen" eyebrow="Lesson complete" icon={Check}
    title={t(info.title || "Lesson complete")} subtitle={t(info.subtitle)}
    actions={<button className="btn-primary" onClick={onDone}>{t("Back to your path")}</button>}>
    {info.habit && <section className="summary-section summary-highlight">
      <h2>{t("Today's habit")}</h2><p className="summary-key-point">{t(info.habit)}</p>
    </section>}
    {info.warningSign && <section className="summary-section">
      <h2>{t("Today's warning sign")}</h2><p>{t(info.warningSign)}</p>
    </section>}
    {info.skills?.length > 0 && <section className="summary-section">
      <h2>{t("Skills you used")}</h2><ul>{info.skills.map(skill => <li key={skill}>{t(skill)}</li>)}</ul>
    </section>}
    {info.learned?.length > 0 && <section className="summary-section">
      <h2>{t("You learned")}</h2><ul>{info.learned.map(item => <li key={item}>{t(item)}</li>)}</ul>
    </section>}
    {lesson.badge && <section className="summary-section summary-award">
      <h2>{t(lesson.phaseBadge ? "Phase achievement" : "Badge earned")}</h2>
      <p className="summary-key-point">{t(lesson.badge)}</p>
    </section>}
    {info.next && <p className="summary-next">{t("Next lesson:")} <strong>{t(info.next)}</strong></p>}
  </LearningSummary>;
}
