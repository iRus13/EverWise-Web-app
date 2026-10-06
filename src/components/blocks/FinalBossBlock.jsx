import { useState } from "react";
import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";
import AnswerFeedback from "./AnswerFeedback";
import AnswerOption from "./AnswerOption";
import { useLearningText } from "../../i18n/learning.js";

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
  const t = useLearningText();
  const [selected, setSelected] = useState(null);
  const answered = selected != null;
  const chosen = answered ? block.options[selected] : null;
  const best = block.options.find(option => option.tier === "best");
  const feedbackTitle = chosen?.tier === "best" ? "Excellent!" : chosen?.tier === "safe" ? "That's a safe choice" : "Let's review this one";
  const reviewCopy = "It's worth replaying this lesson or reviewing the flashcards before moving on. Your answer does not prevent you from continuing.";

  const messages = block.messages || [];
  const exampleNotice = "Example only — this cannot be tapped.";
  const speakText = [
    t(block.title || "Final challenge"),
    t(block.setup || ""),
    ...messages.map((m) => [t(m.from), t(m.body), m.fakeButton && t("Link shown: {label}", {label: t(m.fakeButton)}), m.fakeButton && t(exampleNotice)].filter(Boolean).join(". ")),
    t(block.question),
    t("Options:"),
    ...block.options.map(option => t(option.text)),
    ...(answered ? [t(feedbackTitle), t(chosen.feedback)] : []),
    ...(answered && chosen.tier !== "best" && best ? [t("Best answer"), t(best.text)] : []),
    ...(chosen?.tier === "unsafe" ? [t(reviewCopy)] : []),
    ...(answered && chosen.tier !== "unsafe" && block.spotted?.length ? [t("Warning signs you spotted"), ...block.spotted.map(sign => t(sign))] : []),
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <BlockShell
      label={t("Final challenge")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      footer={
        answered ? (
          <button className="btn-primary" onClick={onContinue}>
            {t("Continue")}
          </button>
        ) : null
      }
    >
      <div className="animate-fade-up">
        {block.title && <p className="lesson-kicker">{t(block.title)}</p>}

        {block.setup && (
          <p className="lesson-scenario-story">
            {t(block.setup)}
          </p>
        )}

        {messages.length > 0 && <h2 className="lesson-section-label mt-6">{t("Examples to review")}</h2>}
        {messages.map((m, i) => (
          <div
            key={i}
            className="lesson-message-example"
          >
            <p className="lesson-section-label">
              {t(m.from)}
            </p>
            <p className="mt-2 text-xl leading-relaxed text-ink">{t(m.body)}</p>
            {m.fakeButton && (
              <div className="lesson-example-link">
                <p>
                  {t("Link shown: {label}", {label: t(m.fakeButton)})}
                </p>
                <p className="lesson-example-notice">{t(exampleNotice)}</p>
              </div>
            )}
          </div>
        ))}

        <h1 className="page-title lesson-question mt-5">{t(block.question)}</h1>

        <div className="mt-4">
          <ReadAloud text={speakText} label={t("Read this aloud")} />
        </div>

        <div className="mt-6 space-y-4">
          {block.options.map((option, i) => {
            return (
              <AnswerOption
                key={i}
                disabled={answered}
                onClick={() => setSelected(i)}
                selected={selected === i}
                state={answered ? i !== selected ? "other" : option.tier === "best" ? "correct" : option.tier === "safe" ? "safe" : "incorrect" : undefined}
              >
                {t(option.text)}
              </AnswerOption>
            );
          })}
        </div>

        {answered && (
          <AnswerFeedback positive={chosen.tier !== "unsafe"}
            title={t(feedbackTitle)}>
            <p className="mt-3 text-xl leading-relaxed text-ink-soft">
              {t(chosen.feedback)}
            </p>
            {chosen.tier !== "best" && best && <p><strong>{t("Best answer")}: </strong>{t(best.text)}</p>}

            {chosen.tier === "unsafe" && (
              <p className="mt-4 text-xl leading-relaxed text-ink-soft">
                {t(reviewCopy)}
              </p>
            )}

            {block.spotted?.length > 0 && chosen.tier !== "unsafe" && (
              <div className="mt-5">
                <p className="lesson-section-label">
                  {t("Warning signs you spotted")}
                </p>
                <ul className="lesson-reading-list">
                  {block.spotted.map((s) => (
                    <li key={s} className="text-lg text-ink">
                      {t(s)}
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
