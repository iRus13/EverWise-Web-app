import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";
import { useLearningText } from "../../i18n/learning.js";

// Opening screen of a scam-protection lesson: the objective, the question the
// lesson answers, the five universal warning signs reminder, and the reading.
export default function ReadingBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const t = useLearningText();
  const paragraphs = t(block.text || "").split(/\n\s*\n/).filter(part => part.trim());
  const speakText = [
    block.heading,
    block.question,
    block.text,
    ...(block.warningSigns?.length ? ["Warning signs", ...block.warningSigns] : []),
    ...(block.objective ? ["Learning goal", block.objective] : []),
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

        {block.warningSigns?.length > 0 && (
          <div className="lesson-reading-section lesson-warning-signs">
            <h2 className="lesson-section-label">{t("Warning signs")}</h2>
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
          </div>
        )}

        {block.objective && <section className="lesson-learning-goal">
          <h2 className="lesson-section-label">{t("Learning goal")}</h2>
          <p>{t(block.objective)}</p>
        </section>}

      </div>
    </BlockShell>
  );
}
