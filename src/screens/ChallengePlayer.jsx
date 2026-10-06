import {useLearningText} from "../i18n/learning.js";
import { useState } from "react";
import BlockRenderer from "../components/blocks/BlockRenderer";
import {Check} from "lucide-react";
import LearningSummary from "../components/LearningSummary";
import {assessmentRevision, restoreAssessmentPosition} from "../utils/assessmentProgress.js";
import { getChallengeCompletionContent } from "../utils/courseProgress.js";

// Ungraded phase review: play each block in order, then a simple complete screen.
export default function ChallengePlayer({ challenge, onBack, onComplete, initialPosition, onPositionChange }) {
  const t = useLearningText();
  const [position, setPosition] = useState(() =>
    restoreAssessmentPosition(challenge, "challenge", initialPosition) || {blockIndex:0, finished:false});
  const {blockIndex, finished} = position;
  const blocks = challenge.blocks || [];
  const total = blocks.length;
  const progress = finished ? total : blockIndex + 1;
  const completion = getChallengeCompletionContent(challenge);

  const advance = () => {
    const nextPosition = blockIndex + 1 < blocks.length
      ? {blockIndex:blockIndex + 1, finished:false} : {blockIndex, finished:true};
    setPosition(nextPosition);
    onPositionChange?.({kind:"challenge", revision:assessmentRevision(challenge), ...nextPosition});
  };

  if (finished) {
    return <LearningSummary eyebrow="Review complete" title={t(completion.title)} subtitle={challenge.nextKind === "course"
        ? t("You completed the Everwise course.")
        : t("Nice work reviewing Phase {phase}. Next: {next}.",{phase:challenge.phase,next:t(challenge.nextLabel)})} icon={Check}
      actions={<button className="btn-primary" onClick={onComplete}>{t("Back to your path")}</button>}/>;
  }

  return (
    <BlockRenderer
      key={`challenge-block-${blockIndex}`}
      block={blocks[blockIndex]}
      progress={progress}
      progressTotal={total}
      onContinue={advance}
      onBack={onBack}
    />
  );
}
