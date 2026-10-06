import {useLearningText} from "../../i18n/learning.js";
import { useState } from "react";
import BlockShell from "./BlockShell";
import { MultipleChoiceBody } from "./ScenarioBlock";

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

  return (
    <BlockShell
      label={t(block.title || "Choose")}
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
