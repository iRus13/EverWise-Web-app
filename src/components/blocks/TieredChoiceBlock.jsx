import AnswerOption from "./AnswerOption";
import { useState } from "react";
import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";
import AnswerFeedback from "./AnswerFeedback";

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
  const answered = selected != null;
  const chosen = answered ? options[selected] : null;
  const bestIndex = options.findIndex((o) => o.tier === "best");

  const speakText = [
    scenario,
    question,
    "Options:",
    options.map((o) => o.text).join(". "),
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <>
      {title && (
        <p className="lesson-kicker">
          {title}
        </p>
      )}

      {scenario && (
        <div className="lesson-reading-section mt-3">
          <p className="text-xl leading-relaxed text-ink">{scenario}</p>
        </div>
      )}

      <h1 className="page-title lesson-question mt-5">
        {question}
      </h1>

      <div className="mt-4">
        <ReadAloud text={speakText} label="Read this aloud" />
      </div>

      <div className="mt-7 space-y-4">
        {options.map((option, i) => {
          return (
            <AnswerOption
              key={i}

              disabled={answered}
              onClick={() => onSelect(i)}
              selected={selected === i}
              state={answered ? option.tier === "best" ? "correct" : option.tier === "safe" ? "safe" : i === selected ? "incorrect" : "other" : undefined}

            >
              {option.text}
            </AnswerOption>
          );
        })}
      </div>

      {answered && <AnswerFeedback positive={chosen.tier !== "unsafe"}
        title={chosen.tier === "best" ? "Best choice!" : chosen.tier === "safe" ? "That's a safe choice" : "Let's look again"}>
        <p>{chosen.feedback}</p>
        {chosen.tier !== "best" && bestIndex >= 0 && <p><strong>The strongest first step:</strong> {options[bestIndex].text}</p>}
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
  const [selected, setSelected] = useState(null);

  return (
    <BlockShell
      label={block.label || "Practice"}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      footer={
        selected != null ? (
          <button className="btn-primary" onClick={onContinue}>
            Continue
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
