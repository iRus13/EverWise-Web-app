import { useMemo, useState } from "react";
import { shuffle } from "../../utils/shuffle";
import BlockShell from "./BlockShell";
import { TieredChoiceBody } from "./TieredChoiceBlock";
import AnswerOption from "./AnswerOption";
import ReadAloud from "../ReadAloud";
import { useLearningText } from "../../i18n/learning.js";

// Asks how confident the learner feels. "I'd like more practice" launches
// extra questions instead of failing them, then asks again. If they still
// want practice, questions reshuffle and repeat — a score is never shown.
export default function ConfidenceBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const t = useLearningText();
  const [mode, setMode] = useState("ask"); // ask | practice
  const [round, setRound] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confidence, setConfidence] = useState(null);

  const pool = block.practice || [];
  // Reshuffle every round so repeats never feel identical.
  const questions = useMemo(
    () => shuffle(pool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round, block]
  );

  const startPractice = () => {
    if (pool.length === 0) {
      onContinue();
      return;
    }
    setMode("practice");
    setConfidence(null);
    setQIndex(0);
    setSelected(null);
  };

  const nextQuestion = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
    } else {
      // Round finished — ask how they feel again.
      setMode("ask");
      setConfidence(null);
      setRound((r) => r + 1);
      setSelected(null);
    }
  };

  if (mode === "practice") {
    const q = questions[qIndex];
    return (
      <BlockShell
        key={`practice-${round}-${qIndex}`}
        label={t("More practice")}
        progress={progress}
        progressTotal={progressTotal}
        onBack={onBack}
        onExit={onExit}
        footer={
          selected != null ? (
            <button className="btn-primary" onClick={nextQuestion}>
              {t(qIndex + 1 < questions.length ? "Next" : "Done practicing")}
            </button>
          ) : null
        }
      >
        <p className="text-lg font-semibold text-ink-faint">
          {t("Practice {current} of {total}", {current: qIndex + 1, total: questions.length})}
        </p>
        <TieredChoiceBody
          scenario={q.scenario}
          question={q.question}
          options={q.options}
          selected={selected}
          onSelect={setSelected}
        />
      </BlockShell>
    );
  }

  return (
    <BlockShell
      label={t("Check in")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      footer={<button className="btn-primary" disabled={confidence == null}
        onClick={() => confidence === "practice" ? startPractice() : onContinue()}>{t("Continue")}</button>}
    >
      <div className="animate-fade-up">
        <h1 className="page-title lesson-question">
          {t(block.question || "How confident do you feel?")}
        </h1>
        <p className="mt-3 text-xl leading-relaxed text-ink-soft">{t("Choose the answer that feels right for you. There is no score.")}</p>

        {round > 0 && (
          <p className="mt-4 text-xl leading-relaxed text-ink-soft">
            {t("Nice work. There's no score here and no wrong answer — practice as much as you'd like.")}
          </p>
        )}

        <div className="lesson-audio"><ReadAloud text={[
          block.question || "How confident do you feel?",
          "Choose the answer that feels right for you. There is no score.",
          ...(round > 0 ? ["Nice work. There's no score here and no wrong answer — practice as much as you'd like."] : []),
          "Very confident", "Mostly confident", "I'd like more practice",
        ].map(part => t(part)).join(". ")} /></div>

        <div className="mt-8 space-y-4">
          {[["very", "Very confident"], ["mostly", "Mostly confident"], ["practice", "I'd like more practice"]].map(([value, label]) => (
            <AnswerOption key={value} selected={confidence === value} onClick={() => setConfidence(value)}>{t(label)}</AnswerOption>
          ))}
        </div>
      </div>
    </BlockShell>
  );
}
