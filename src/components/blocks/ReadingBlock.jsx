import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";
import { useLearningText } from "../../i18n/learning.js";
import { useState } from "react";

// Opening screen of a scam-protection lesson: the objective, the question the
// lesson answers, the reading, and an optional reminder of earlier lessons.
export default function ReadingBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const t = useLearningText();
  const [expandedBlock, setExpandedBlock] = useState(null);
  const warningSignsVisible = expandedBlock === block;
  const reminderTitle = block.reminderTitle ?? "Review warning signs";
  const paragraphs = t(block.text || "").split(/\n\s*\n/).filter(part => part.trim());
  const speakText = [
    block.heading,
    block.question,
    block.text,
    ...(block.objective ? ["Learning goal", block.objective] : []),
    ...(block.warningSigns?.length ? [reminderTitle, ...(warningSignsVisible ? block.warningSigns : [])] : []),
  ]
    .filter(Boolean)
    .map(part => t(part))
    .join(". ");

  return (
    <BlockShell
      label={t(block.label || "Learn")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      footer={
        <button className="btn-primary" onClick={onContinue}>
          {t("Continue")}
        </button>
      }
    >
      <div className="lesson-reading">
        {block.heading && (
          <h1 className="page-title">
            {t(block.heading)}
          </h1>
        )}

        {block.question && (
          <p className="lesson-reading-question">
            {t(block.question)}
          </p>
        )}

        <div className="lesson-audio"><ReadAloud text={speakText} /></div>

        <div className="lesson-prose">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>

        {block.objective && <section className="lesson-learning-goal">
          <h2 className="lesson-section-label">{t("Learning goal")}</h2>
          <p>{t(block.objective)}</p>
        </section>}

        {block.warningSigns?.length > 0 && (
          <details className="lesson-warning-reminder" open={warningSignsVisible}
            onToggle={event => setExpandedBlock(event.currentTarget.open ? block : null)}>
            <summary>{t(reminderTitle)}</summary>
            <ul className="lesson-reading-list">
              {block.warningSigns.map((sign) => (
                <li
                  key={sign}
                  className="text-lg"
                >
                  {t(sign)}
                </li>
              ))}
            </ul>
          </details>
        )}

      </div>
    </BlockShell>
  );
}
