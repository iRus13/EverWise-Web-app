import {useLearningText} from "../../i18n/learning.js";
import { useState } from "react";
import ReadAloud from "../ReadAloud";
import { CheckIcon } from "../Icons";
import BlockShell from "./BlockShell";
import AnswerFeedback from "./AnswerFeedback";

export default function MultiselectBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const t = useLearningText();
  const [picked, setPicked] = useState(() => new Set());
  const [checked, setChecked] = useState(false);

  const fullyCorrect =
    checked &&
    block.options.every((opt, i) =>
      opt.correct ? picked.has(i) : !picked.has(i)
    );

  const hasIncorrectChoice = block.options.some((option, index) => picked.has(index) && !option.correct);
  const resultTitle = fullyCorrect ? "That's right" : "Let's review your choices";
  const resultMessage = fullyCorrect ? block.feedback
    : !hasIncorrectChoice && picked.size > 0
      ? "You found some correct choices. Review the others below."
      : block.incorrectFeedback?.trim() || "Some choices need another look. Review the answers below.";
  const reviewLabel = (option, index) => !checked ? null
    : picked.has(index) ? option.correct ? "Your choice · Correct" : "Your choice · Not correct"
    : option.correct ? "Correct choice · Not selected" : null;
  const narration = [block.prompt || block.title,
    ...(checked ? [resultTitle, resultMessage] : []),
    ...block.options.flatMap((option, index) => [option.text, reviewLabel(option, index)])
  ].filter(Boolean).map(text => t(text)).join("\n\n");

  const toggle = (i) => {
    if (checked) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <BlockShell
      label={t(block.title || "Select")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={onContinue}
      revealKey={checked ? "checked" : null}
      footer={
        checked ? (
          <button className="btn-primary" onClick={onContinue}>
            {t("Continue")}
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={() => setChecked(true)}
            disabled={picked.size === 0}
          >
            {t("Check")}
          </button>
        )
      }
    >
      <h1 className="page-title lesson-question">
        {t(block.prompt || block.title)}
      </h1>
      <div className="mt-5">
        <ReadAloud text={narration} />
      </div>

      {checked && <AnswerFeedback positive={fullyCorrect} title={resultTitle}>
        {resultMessage && <p>{t(resultMessage)}</p>}
      </AnswerFeedback>}

      <div className="mt-8 space-y-3">
        {block.options.map((opt, i) => {
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              disabled={checked}
              aria-pressed={picked.has(i)}
              data-answer-state={checked ? opt.correct ? "correct" : picked.has(i) ? "incorrect" : "other" : picked.has(i) ? "selected" : undefined}
              className="lesson-answer lesson-answer-multiple"
            >
              <span
                className={`lesson-multiple-mark ${
                  checked && picked.has(i) && opt.correct ? "is-correct"
                    : checked && picked.has(i) ? "is-incorrect"
                    : picked.has(i) ? "is-selected" : ""
                }`}
                aria-hidden="true"
              >
                {picked.has(i) && <CheckIcon className="h-5 w-5" />}
              </span>
              <span className="lesson-multiple-copy">
                <span>{t(opt.text)}</span>
                {reviewLabel(opt, i) && <span className="lesson-answer-review">{t(reviewLabel(opt, i))}</span>}
              </span>
            </button>
          );
        })}
      </div>

    </BlockShell>
  );
}
