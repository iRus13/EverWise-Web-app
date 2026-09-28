import {Check} from "lucide-react";
import LearningSummary from "../components/LearningSummary";

export default function Complete({lesson, onDone}) {
  const info = lesson.complete || {};
  return <LearningSummary className="complete-screen" eyebrow="Lesson complete" icon={Check}
    title={info.title || "Lesson complete"} subtitle={info.subtitle}
    actions={<button className="btn-primary" onClick={onDone}>Back to your path</button>}>
    {info.habit && <section className="summary-section summary-highlight">
      <h2>Today's habit</h2><p className="summary-key-point">{info.habit}</p>
    </section>}
    {info.warningSign && <section className="summary-section">
      <h2>Today's warning sign</h2><p>{info.warningSign}</p>
    </section>}
    {info.skills?.length > 0 && <section className="summary-section">
      <h2>Skills you used</h2><ul>{info.skills.map(skill => <li key={skill}>{skill}</li>)}</ul>
    </section>}
    {info.learned?.length > 0 && <section className="summary-section">
      <h2>You learned</h2><ul>{info.learned.map(item => <li key={item}>{item}</li>)}</ul>
    </section>}
    {lesson.badge && <section className="summary-section summary-award">
      <h2>{lesson.phaseBadge ? "Phase achievement" : "Badge earned"}</h2>
      <p className="summary-key-point">{lesson.badge}</p>
    </section>}
    {info.next && <p className="summary-next">Next lesson: <strong>{info.next}</strong></p>}
  </LearningSummary>;
}
