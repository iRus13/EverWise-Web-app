import {fillBlankParts, useLearningText} from "../../i18n/learning.js";
import AnswerOption from "./AnswerOption";
import { useState } from "react";
import ReadAloud from "../ReadAloud";
import AnswerFeedback from "./AnswerFeedback";
import BlockShell from "./BlockShell";

export default function FillBlankBlock({
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
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const q = questions[qIndex];
  const isCorrect = selected === q.answer;
  // Before answering, keep the blank. After answering, the sentence always
  // settles on the CORRECT word: filling it with the learner's wrong choice
  // left a false sentence on screen as though it were the lesson ("The Book
  // connects millions of devices around the world."), which is the opposite
  // of what the blank is meant to teach.
  const filledWord = revealed ? q.answer : null;
  const {before:beforeBlank, after:afterBlank, word:answerLabel} = fillBlankParts(q.text, q.answer, t);

  const pick = (word) => {
    if (revealed) return;
    setSelected(word);
    setRevealed(true);
  };

  const next = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      onContinue();
    }
  };

  return (
    <BlockShell
      label={t(block.title || "Fill in the blank")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={next}
      scrollKey={qIndex}
      footer={
        revealed ? (
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
        {beforeBlank}
        {filledWord === null ? (
          "______"
        ) : (
          // Underlined so the answer is obvious in the sentence itself, which
          // is what makes the correction land for someone who chose wrongly.
          <span className="underline decoration-2 underline-offset-4">
            {answerLabel}
          </span>
        )}
        {afterBlank}
      </h1>
      <div className="mt-5">
        <ReadAloud text={`${beforeBlank}${revealed ? answerLabel : t("blank")}${afterBlank}`} />
      </div>

      <div className="lesson-answer-grid mt-8">
        {block.wordBank.map((word) => {
          return (
            <AnswerOption
              key={word}

              disabled={revealed}
              onClick={() => pick(word)}
              selected={selected === word}
              state={revealed ? word === q.answer ? "correct" : word === selected ? "incorrect" : "other" : undefined}

            >
              {t(word)}
            </AnswerOption>
          );
        })}
      </div>

      {revealed && <AnswerFeedback positive={isCorrect} title={isCorrect ? "That's right." : t("Not quite — the answer is “{answer}”.", {answer:answerLabel})}>
        {!isCorrect && (q.why || q.wrong?.[selected]) ? <p>{t(q.wrong?.[selected] || q.why)}</p> : null}
      </AnswerFeedback>}

    </BlockShell>
  );
}
