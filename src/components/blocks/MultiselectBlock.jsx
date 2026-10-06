import {useLearningText} from "../../i18n/learning.js";
import { useState } from "react";
import { X } from "lucide-react";
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

  const resultMessage = fullyCorrect
    ? block.feedback
    : block.incorrectFeedback;

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
        <ReadAloud text={t(block.prompt || block.title)} />
      </div>

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
                  checked && opt.correct ? "is-correct"
                    : checked && picked.has(i) ? "is-incorrect"
                    : picked.has(i) ? "is-selected" : ""
                }`}
                aria-hidden="true"
              >
                {checked && picked.has(i) && !opt.correct
                  ? <X className="h-5 w-5" />
                  : (picked.has(i) || (checked && opt.correct)) && <CheckIcon className="h-5 w-5" />}
              </span>
              {t(opt.text)}
            </button>
          );
        })}
      </div>

      {checked && <AnswerFeedback positive={fullyCorrect} title={fullyCorrect ? "That's right" : "Let's review your choices"}>
        {resultMessage && <p>{t(resultMessage)}</p>}
        {!fullyCorrect && <p className="lesson-correction">{t("Correct choices: {answers}", {answers:block.options.filter(option => option.correct).map(option => t(option.text)).join("; ")})}</p>}
      </AnswerFeedback>}

    </BlockShell>
  );
}
