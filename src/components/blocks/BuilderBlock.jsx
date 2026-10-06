import {useLearningText} from "../../i18n/learning.js";
import AnswerOption from "./AnswerOption";
import { useState } from "react";
import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";
import AnswerFeedback from "./AnswerFeedback";

// Builder: pick one item from each column; selections combine into one string.
export default function BuilderBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const t = useLearningText();
  const columns = block.columns || [];
  // selection per column index
  const [picks, setPicks] = useState(() => columns.map(() => null));
  const [revealed, setRevealed] = useState(false);

  const allPicked = picks.every((p) => p != null);
  const combined = picks.filter(Boolean).map(item => t(item)).join("");

  const pick = (colIndex, item) => {
    if (revealed) return;
    setPicks((prev) => {
      const next = [...prev];
      next[colIndex] = item;
      return next;
    });
  };

  return (
    <BlockShell
      label={t(block.title || "Build")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={onContinue}
      revealKey={revealed ? "revealed" : null}
      footer={
        revealed ? (
          <button className="btn-primary" onClick={onContinue}>
            {t("Continue")}
          </button>
        ) : (
          <button
            className="btn-primary"
            disabled={!allPicked}
            onClick={() => setRevealed(true)}
          >
            {t("Continue")}
          </button>
        )
      }
    >
      <h1 className="page-title">
        {t(block.title || "Build")}
      </h1>
      {block.prompt && (
        <p className="mt-3 text-xl leading-relaxed text-ink-soft">{t(block.prompt)}</p>
      )}
      <div className="mt-4">
        <ReadAloud text={`${t(block.title || "")}. ${t(block.prompt || "")}`} />
      </div>

      {/* Stack on narrow screens so every choice remains readable and reachable. */}
      <div className="builder-columns mt-8 grid shrink-0 gap-3 pb-2">
        {columns.map((col, ci) => (
          <div key={col.label} className="min-w-0">
            <p className="lesson-builder-label">
              {t(col.label)}
            </p>
            <div className="space-y-2">
              {col.items.map((item) => {
                const active = picks[ci] === item;
                return (
                  <AnswerOption
                    key={item}
                    disabled={revealed}
                    onClick={() => pick(ci, item)}
                    selected={active}
                  >
                    {t(item)}
                  </AnswerOption>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Combined result */}
      <div className="lesson-reading-section lesson-builder-result mt-8">
        <p className="lesson-section-label">
          {t("Practice password")}
        </p>
        <p className="mt-2 break-all font-sans text-3xl font-semibold text-ink">
          {combined || "—"}
        </p>
        {block.example && (
          <p className="mt-3 text-lg text-ink-soft">
            {t("Example:")} <span className="font-semibold text-ink">{t(block.example)}</span>
          </p>
        )}
      </div>

      {revealed && block.feedback && (
        <AnswerFeedback positive title="Your example is ready">
          <p>{t(block.feedback)}</p>
        </AnswerFeedback>
      )}
    </BlockShell>
  );
}
