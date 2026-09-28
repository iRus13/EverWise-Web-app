import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";

export default function LearnBlock({ block, progress, progressTotal, onContinue, onBack, onExit }) {
  const speakParts = [
    block.heading,
    block.text,
    ...(block.bullets || []),
    block.footer,
  ].filter(Boolean);

  return (
    <BlockShell
      label="Learn"
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={onContinue}
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
        <div className="lesson-audio"><ReadAloud text={speakParts.join(". ")} /></div>
        {block.text && (
          block.text.split(/\n\s*\n/).filter(part => part.trim()).map((paragraph, index) => (
            <p key={index} className="mt-5 whitespace-pre-line text-2xl leading-relaxed text-ink-soft">{paragraph}</p>
          ))
        )}
        {block.bullets?.length > 0 && (
          <ul className="lesson-reading-list">
            {block.bullets.map((item) => (
              <li
                key={item}
                className="text-xl leading-relaxed text-ink"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
        {block.footer && (
          <p className="mt-6 text-xl font-semibold leading-relaxed text-ink">
            {block.footer}
          </p>
        )}
      </div>
    </BlockShell>
  );
}
