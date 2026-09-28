import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";

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
  const speakText = [
    block.heading,
    block.objective && `Learning goal. ${block.objective}`,
    block.question,
    ...(block.warningSigns?.length ? ["Warning signs", ...block.warningSigns] : []),
    block.text,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <BlockShell
      label={block.label || "Learn"}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      footer={
        <button className="btn-primary" onClick={onContinue}>
          Continue
        </button>
      }
    >
      <div className="lesson-reading">
        {block.heading && (
          <h1 className="page-title">
            {block.heading}
          </h1>
        )}

        <div className="lesson-audio"><ReadAloud text={speakText} /></div>

        {block.question && (
          <p className="lesson-reading-question">
            {block.question}
          </p>
        )}

        {block.objective && (
          <div className="lesson-reading-section">
            <p className="lesson-section-label">
              What you'll learn
            </p>
            <p className="mt-2 text-xl leading-relaxed text-ink">
              {block.objective}
            </p>
          </div>
        )}

        {block.warningSigns?.length > 0 && (
          <div className="lesson-reading-section lesson-warning-signs">
            <p className="lesson-section-label">
              Warning signs
            </p>
            <ul className="lesson-reading-list">
              {block.warningSigns.map((sign) => (
                <li
                  key={sign}
                  className="text-lg"
                >
                  {sign}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 text-2xl leading-relaxed text-ink-soft">
          {block.text}
        </p>

      </div>
    </BlockShell>
  );
}
