import {useLearningText} from "../../i18n/learning.js";
import AnswerOption from "./AnswerOption";
import { useState } from "react";
import ReadAloud from "../ReadAloud";
import AnswerFeedback from "./AnswerFeedback";
import BlockShell from "./BlockShell";

export default function TrueFalseBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const t = useLearningText();
  const questions = block.questions || [];
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null); // true | false | null
  const safeUnsafe = block.variant === "safeunsafe";
  const yesLabel = safeUnsafe ? "Safe" : "True";
  const noLabel = safeUnsafe ? "Unsafe" : "False";

  const q = questions[qIndex];
  const answered = selected != null;
  const isCorrect = answered && selected === q.answer;

  const choose = (value) => {
    if (answered) return;
    setSelected(value);
  };

  const next = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
    } else {
      onContinue();
    }
  };

  return (
    <BlockShell
      label={t(block.title || (safeUnsafe ? "Safe or Unsafe" : "True or False"))}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={next}
      scrollKey={qIndex}
      footer={
        answered ? (
          <button className="btn-primary" onClick={next}>
            {t(qIndex + 1 < questions.length ? "Next" : "Continue")}
          </button>
        ) : null
      }
    >
      <p className="text-lg font-semibold text-ink-faint">
        {t("Question {current} of {total}", {current:qIndex+1,total:questions.length})}
      </p>
      <h1 className="page-title lesson-question mt-3">
        {t(q.text)}
      </h1>
      <div className="mt-5">
        <ReadAloud text={t(q.text)} />
      </div>

      <div className="lesson-answer-grid mt-8">
        {[
          { value: true, label: yesLabel },
          { value: false, label: noLabel },
        ].map(({ value, label }) => {
          return (
            <AnswerOption
              key={label}

              disabled={answered}
              onClick={() => choose(value)}
              selected={selected === value}
              state={answered ? value === q.answer ? "correct" : value === selected ? "incorrect" : "other" : undefined}

            >
              {t(label)}
            </AnswerOption>
          );
        })}
      </div>

      {answered && <AnswerFeedback positive={isCorrect} title={isCorrect ? "That's right" : "Not quite"}>
        {!isCorrect && <p className="lesson-correction">{t("The correct answer is: {answer}", {answer:t(q.answer ? yesLabel : noLabel)})}</p>}
        {q.explanation && <p>{t(q.explanation)}</p>}
      </AnswerFeedback>}

    </BlockShell>
  );
}
