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
      label={block.title || (safeUnsafe ? "Safe or Unsafe" : "True or False")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={next}
      scrollKey={qIndex}
      footer={
        answered ? (
          <button className="btn-primary" onClick={next}>
            {qIndex + 1 < questions.length ? "Next" : "Continue"}
          </button>
        ) : null
      }
    >
      <p className="text-lg font-semibold text-ink-faint">
        Question {qIndex + 1} of {questions.length}
      </p>
      <h1 className="page-title lesson-question mt-3">
        {q.text}
      </h1>
      <div className="mt-5">
        <ReadAloud text={q.text} />
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
              {label}
            </AnswerOption>
          );
        })}
      </div>

      {answered && <AnswerFeedback positive={isCorrect} title={isCorrect ? "That's right" : "Not quite"}>
        {!isCorrect && <p className="lesson-correction">The correct answer is: {q.answer ? yesLabel : noLabel}</p>}
        {q.explanation && <p>{q.explanation}</p>}
      </AnswerFeedback>}

    </BlockShell>
  );
}
