import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";

// Ties today's lesson back to earlier ones, so lessons feel connected
// instead of like separate pieces of information.
export default function MemoryBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const links = block.links || [];
  const speakText = [
    "Memory connection.",
    ...links.map((l) => `${l.lesson}. ${l.note}`),
  ].join(" ");

  return (
    <BlockShell
      label="Remember"
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
      <div className="animate-fade-up">
        <h1 className="page-title">
          You've practiced these skills before
        </h1>
        <p className="mt-3 text-xl leading-relaxed text-ink-soft">
          Today's lesson builds on what you already know.
        </p>

        <div className="lesson-memory-list">
          {links.map((link) => (
            <div
              key={link.lesson}
              className="lesson-memory-item"
            >
              <p className="lesson-section-label">
                {link.lesson}
              </p>
              <p className="mt-2 text-xl leading-relaxed text-ink">
                {link.note}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-7">
          <ReadAloud text={speakText} />
        </div>
      </div>
    </BlockShell>
  );
}
