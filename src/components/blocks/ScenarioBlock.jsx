import AnswerOption from "./AnswerOption";
import { useState } from "react";
import ReadAloud from "../ReadAloud";
import AnswerFeedback from "./AnswerFeedback";
import BlockShell from "./BlockShell";

// Shared multiple-choice UI used by scenario, choice, and quiz questions.
export function MultipleChoiceBody({
  title,
  text,
  options,
  correctIndex,
  explanation,
  selected,
  onSelect,
}) {
  const answered = selected != null;
  const isCorrect = answered && selected === correctIndex;

  return (
    <>
      {title && (
        <p className="lesson-kicker">
          {title}
        </p>
      )}
      <h1 className="page-title lesson-question mt-2">
        {text}
      </h1>
      <div className="mt-5">
        <ReadAloud text={text} label="Read this aloud" />
      </div>

      <div className="mt-8 space-y-4">
        {options.map((option, i) => {
          return (
            <AnswerOption
              key={i}

              disabled={answered}
              onClick={() => onSelect(i)}
              selected={selected === i}
              state={answered ? i === correctIndex ? "correct" : i === selected ? "incorrect" : "other" : undefined}

            >
              {option}
            </AnswerOption>
          );
        })}
      </div>

      {answered && <AnswerFeedback positive={isCorrect} title={isCorrect ? "That's right" : "Not quite"}>
        {!isCorrect && <p className="lesson-correction">The correct answer is: {options[correctIndex]}</p>}
        {explanation && <p>{explanation}</p>}
      </AnswerFeedback>}

    </>
  );
}

export default function ScenarioBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const [selected, setSelected] = useState(null);

  return (
    <BlockShell
      label={block.title || "Scenario"}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={onContinue}
      footer={
        selected != null ? (
          <button className="btn-primary" onClick={onContinue}>
            Continue
          </button>
        ) : null
      }
    >
      <MultipleChoiceBody
        text={block.text}
        options={block.options}
        correctIndex={block.correctIndex}
        explanation={block.explanation}
        selected={selected}
        onSelect={setSelected}
      />
    </BlockShell>
  );
}
