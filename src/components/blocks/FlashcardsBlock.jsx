import {useLearningText} from "../../i18n/learning.js";
import { useId, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";

export default function FlashcardsBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const t = useLearningText();
  const cardId = useId();
  const cards = block.cards || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  const go = (next) => {
    setIndex(next);
    setFlipped(false);
  };

  const continueFromCard = () => {
    if (index < cards.length - 1) {
      go(index + 1);
    } else {
      onContinue();
    }
  };

  return (
    <BlockShell
      label={t(block.title || "Flashcards")}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={onContinue}
      scrollKey={index}
      footer={
        <button className="btn-primary" onClick={continueFromCard}>
          {t("Continue")}
        </button>
      }
    >
      <h1 className="page-title">{t(block.title || "Flashcards")}</h1>
      <p className="lesson-card-count">
        {t("Card {current} of {total}", {current:index+1,total:cards.length})}
      </p>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={t(flipped ? "Show front of card" : "Show back of card")}
        aria-pressed={flipped}
        aria-describedby={`${cardId}-${flipped ? "back" : "front"}`}
        className="flashcard-button mt-6 w-full shrink-0 overflow-hidden text-center"
      >
        <span
          key={index}
          className={`flashcard-stage grid w-full ${
            flipped ? "is-flipped" : ""
          }`}
        >
          <span
            aria-hidden={flipped}
            className="flashcard-face col-start-1 row-start-1 flex min-h-[220px] w-full flex-col items-center justify-center px-6 py-8"
          >
            <span className="lesson-card-side">
              {t("Front")}
            </span>
            <span id={`${cardId}-front`} className="flashcard-copy mt-4 w-full break-words font-sans text-2xl font-semibold leading-snug text-ink">
              {t(card.front)}
            </span>
          </span>

          <span
            aria-hidden={!flipped}
            className="flashcard-face flashcard-back col-start-1 row-start-1 flex min-h-[220px] w-full flex-col items-center justify-center px-6 py-8"
          >
            <span className="lesson-card-side">
              {t("Card back")}
            </span>
            <span id={`${cardId}-back`} className="flashcard-copy mt-4 w-full break-words font-sans text-2xl font-semibold leading-snug text-ink">
              {t(card.back)}
            </span>
          </span>
        </span>
        <span className="lesson-card-hint" aria-hidden="true"><RotateCw size={16} /> {t("Tap to turn over")}</span>
      </button>

      <div className="lesson-card-audio">
        <ReadAloud text={t(flipped ? card.back : card.front)} />
      </div>

      <div className="lesson-card-navigation">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label={t("Previous card")}
          className="lesson-card-step"
        >
          <ChevronLeft size={20} aria-hidden="true" /><span>{t("Previous")}</span>
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index >= cards.length - 1}
          aria-label={t("Next card")}
          className="lesson-card-step"
        >
          <span>{t("Next")}</span><ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </BlockShell>
  );
}
