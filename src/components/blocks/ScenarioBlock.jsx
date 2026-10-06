import {useLearningText} from "../../i18n/learning.js";
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
  const t = useLearningText();
  const answered = selected != null;
  const isCorrect = answered && selected === correctIndex;

  return (
    <>
      {title && (
        <p className="lesson-kicker">
          {t(title)}
        </p>
      )}
      <h1 className="page-title lesson-question mt-2">
        {t(text)}
      </h1>
      <div className="mt-5">
        <ReadAloud text={t(text)} label="Read this aloud" />
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
              {t(option)}
            </AnswerOption>
          );
        })}
      </div>

      {answered && <AnswerFeedback positive={isCorrect} title={isCorrect ? "That's right" : "Not quite"}>
        {!isCorrect && <p className="lesson-correction">{t("The correct answer is: {answer}", {answer:t(options[correctIndex])})}</p>}
        {explanation && <p>{t(explanation)}</p>}
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
  const t = useLearningText();
  const [selected, setSelected] = useState(null);

  return (
    <BlockShell
      label={t(block.title || "Scenario")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={onContinue}
      footer={
        selected != null ? (
          <button className="btn-primary" onClick={onContinue}>
            {t("Continue")}
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
