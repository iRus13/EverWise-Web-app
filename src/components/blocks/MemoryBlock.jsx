import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";
import { useLearningText } from "../../i18n/learning.js";

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
  const t = useLearningText();
  const links = block.links || [];
  const speakText = [
    t("You've practiced these skills before"),
    t("Today's lesson builds on what you already know."),
    ...links.map((l) => `${t(l.lesson)}. ${t(l.note)}`),
  ].join(" ");

  return (
    <BlockShell
      label={t("Remember")}
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
      <div className="animate-fade-up">
        <h1 className="page-title">
          {t("You've practiced these skills before")}
        </h1>
        <p className="mt-3 text-xl leading-relaxed text-ink-soft">
          {t("Today's lesson builds on what you already know.")}
        </p>

        <div className="lesson-memory-list">
          {links.map((link) => (
            <div
              key={link.lesson}
              className="lesson-memory-item"
            >
              <h2 className="lesson-section-label">{t(link.lesson)}</h2>
              <p className="mt-2 text-xl leading-relaxed text-ink">
                {t(link.note)}
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
