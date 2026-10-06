import {useLearningText} from "../i18n/learning.js";
import {Check} from "lucide-react";
import LearningSummary from "../components/LearningSummary";
import ProgressSaveNotice from "../components/ProgressSaveNotice.jsx";
import {lessonsByOrder, challengesByOrder, examsByOrder} from "../data/course-catalog.js";
import {courseSuccessor} from "../utils/courseProgress.js";

export default function Complete({lesson, earnedBadge = null, progressStatus, onRetryProgress, onDone}) {
  const t = useLearningText();
  const info = lesson.complete || {};
  const next = courseSuccessor(lesson.id, {lessons:lessonsByOrder, challenges:challengesByOrder, exams:examsByOrder});
  return <LearningSummary className="complete-screen" eyebrow="Lesson complete" icon={Check}
    title={t(info.title || "Lesson complete")} subtitle={t(info.subtitle)}
    notice={<ProgressSaveNotice inline status={progressStatus} onRetry={onRetryProgress}/>}
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
    {earnedBadge && earnedBadge === lesson.badge && <section className="summary-section summary-award">
      <h2>{t(lesson.phaseBadge ? "Phase achievement" : "Badge earned")}</h2>
      <p className="summary-key-point">{t(lesson.badge)}</p>
    </section>}
    {next && <section className="summary-section summary-next-step">
      <h2>{t("Up next")}</h2><p className="summary-key-point">{t(next.title)}</p>
    </section>}
  </LearningSummary>;
}
