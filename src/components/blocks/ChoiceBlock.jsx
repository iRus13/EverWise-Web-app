import {useLearningText} from "../../i18n/learning.js";
import { useState } from "react";
import BlockShell from "./BlockShell";
import { MultipleChoiceBody } from "./ScenarioBlock";
import choiceTextRoles from "../../data/choice-text-roles.json";

export default function ChoiceBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const t = useLearningText();
  const [selected, setSelected] = useState(null);
  // Match the authored native distinction: an example is reading material,
  // while the short decision is the heading. Unknown content keeps its prompt.
  const isSupporting = block.title && Object.hasOwn(choiceTextRoles, block.text)
    && choiceTextRoles[block.text] === "supporting";

  return (
    <BlockShell
      label={t(isSupporting ? "Practice" : block.title || "Choose")}
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
        presentation={isSupporting ? {story: block.text, question: block.title} : undefined}
        options={block.options}
        correctIndex={block.correctIndex}
        explanation={block.explanation}
        selected={selected}
        onSelect={setSelected}
      />
    </BlockShell>
  );
}
