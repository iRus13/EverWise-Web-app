import { useState } from "react";
import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";
import AnswerFeedback from "./AnswerFeedback";

// One realistic scenario, one decision, no hints beforehand. The lesson
// still completes if they choose poorly — they just get a recommendation
// to review before moving on.
export default function FinalBossBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const [selected, setSelected] = useState(null);
  const answered = selected != null;
  const chosen = answered ? block.options[selected] : null;

  const messages = block.messages || [];
  const speakText = [
    block.setup,
    ...messages.map((m) => `${m.from}. ${m.body}`),
    block.question,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <BlockShell
      label="Final challenge"
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      footer={
        answered ? (
          <button className="btn-primary" onClick={onContinue}>
            Continue
          </button>
        ) : null
      }
    >
      <div className="animate-fade-up">
        <h1 className="page-title">{block.title || "Final challenge"}</h1>

        {block.setup && (
          <p className="mt-5 text-xl leading-relaxed text-ink-soft">
            {block.setup}
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className="lesson-reading-section"
          >
            <p className="lesson-section-label">
              {m.from}
            </p>
            <p className="mt-2 text-xl leading-relaxed text-ink">{m.body}</p>
            {m.fakeButton && (
              <span
                className="mt-4 inline-block rounded-xl bg-ink/10 px-5 py-3 text-lg font-bold text-ink-faint"
                aria-label={`${m.fakeButton} (not a real button)`}
              >
                {m.fakeButton}
              </span>
            )}
          </div>
        ))}

        <h2 className="mt-7 font-sans text-2xl font-semibold leading-snug text-ink">
          {block.question}
        </h2>

        <div className="mt-4">
          <ReadAloud text={speakText} label="Read this aloud" />
        </div>

        <div className="mt-6 space-y-4">
          {block.options.map((option, i) => {
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => setSelected(i)}
                className="lesson-answer"
                aria-pressed={selected === i}
                data-answer-state={answered ? option.tier === "best" ? "correct" : option.tier === "safe" ? "safe" : i === selected ? "incorrect" : "other" : undefined}
              >
                {option.text}
              </button>
            );
          })}
        </div>

        {answered && (
          <AnswerFeedback positive={chosen.tier !== "unsafe"}
            title={chosen.tier === "best" ? "Excellent!" : chosen.tier === "safe" ? "That's a safe choice" : "Let's review this one"}>
            <p className="mt-3 text-xl leading-relaxed text-ink-soft">
              {chosen.feedback}
            </p>

            {chosen.tier === "unsafe" && (
              <p className="mt-4 text-xl leading-relaxed text-ink-soft">
                It's worth replaying this lesson or reviewing the flashcards
                before moving on. Your answer does not prevent you from continuing.
              </p>
            )}

            {block.spotted?.length > 0 && chosen.tier !== "unsafe" && (
              <div className="mt-5">
                <p className="lesson-section-label">
                  Warning signs you spotted
                </p>
                <ul className="lesson-reading-list">
                  {block.spotted.map((s) => (
                    <li key={s} className="text-lg text-ink">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AnswerFeedback>
        )}
      </div>
    </BlockShell>
  );
}
