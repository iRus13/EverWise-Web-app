import AnswerOption from "./AnswerOption";
import { useState } from "react";
import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";
import AnswerFeedback from "./AnswerFeedback";
import { useLearningText } from "../../i18n/learning.js";

// Quiz where answers are graded rather than simply right/wrong:
//   tier: "best"   ⭐ strongest protection
//   tier: "safe"   ✅ reasonable and cautious
//   tier: "unsafe" ❌ misses the warning signs
// Choosing "safe" is praised, not punished — it just explains why another
// option protects a little better.
export function TieredChoiceBody({
  title,
  scenario,
  question,
  options,
  selected,
  onSelect,
}) {
  const t = useLearningText();
  const answered = selected != null;
  const chosen = answered ? options[selected] : null;
  const bestIndex = options.findIndex((o) => o.tier === "best");
  const feedbackTitle = chosen?.tier === "best" ? "Best choice!" : chosen?.tier === "safe" ? "That's a safe choice" : "Let's look again";

  const speakText = [
    t(scenario || ""),
    t(question),
    t("Options:"),
    options.map((o) => t(o.text)).join(". "),
    ...(answered ? [t(feedbackTitle), t(chosen.feedback)] : []),
    ...(answered && chosen.tier !== "best" && bestIndex >= 0 ? [t("Best answer"), t(options[bestIndex].text)] : []),
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <>
      {title && (
        <p className="lesson-kicker">
            {t(title)}
        </p>
      )}

      {scenario && (
        <p className="lesson-scenario-story mt-3">{t(scenario)}</p>
      )}

      <h1 className="page-title lesson-question mt-5">
        {t(question)}
      </h1>

      <div className="mt-4">
        <ReadAloud text={speakText} label={t("Read this aloud")} />
      </div>

      <div className="mt-7 space-y-4">
        {options.map((option, i) => {
          return (
            <AnswerOption
              key={i}

              disabled={answered}
              onClick={() => onSelect(i)}
              selected={selected === i}
              state={answered ? i !== selected ? "other" : option.tier === "best" ? "correct" : option.tier === "safe" ? "safe" : "incorrect" : undefined}

            >
              {t(option.text)}
            </AnswerOption>
          );
        })}
      </div>

      {answered && <AnswerFeedback positive={chosen.tier !== "unsafe"}
        title={t(feedbackTitle)}>
        <p>{t(chosen.feedback)}</p>
        {chosen.tier !== "best" && bestIndex >= 0 && <p><strong>{t("Best answer")}: </strong>{t(options[bestIndex].text)}</p>}
      </AnswerFeedback>}

    </>
  );
}

export default function TieredChoiceBlock({
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
      label={t(block.label || "Practice")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      footer={
        selected != null ? (
          <button className="btn-primary" onClick={onContinue}>
            {t("Continue")}
          </button>
        ) : null
      }
    >
      <TieredChoiceBody
        title={block.title}
        scenario={block.scenario}
        question={block.question}
        options={block.options}
        selected={selected}
        onSelect={setSelected}
      />
    </BlockShell>
  );
}
