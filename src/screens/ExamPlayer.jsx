import { hasOwn } from "../utils/hasOwn.js";
import {useLearningText} from "../i18n/learning.js";
import { useState } from "react";
import BlockShell from "../components/blocks/BlockShell";
import ReadAloud from "../components/ReadAloud";
import {BookOpen, Check, RotateCcw} from "lucide-react";
import LearningSummary from "../components/LearningSummary";
import {assessmentRevision, restoreAssessmentPosition} from "../utils/assessmentProgress.js";
import examPresentations from "../data/exam-presentations.json";

function pickTier(results, score) {
  const sorted = [...(results || [])].sort((a, b) => b.minScore - a.minScore);
  return sorted.find((t) => score >= t.minScore) || null;
}

export default function ExamPlayer({ exam, onBack, onPass, initialPosition, onPositionChange }) {
  const t = useLearningText();
  const [position, setPosition] = useState(() =>
    restoreAssessmentPosition(exam, "exam", initialPosition) || {phase:"intro", answers:[], selected:null});
  const {phase, answers, selected} = position;
  const qIndex = answers.length;
  const score = answers.reduce((sum, choice, i) => sum + (choice === exam.questions[i].correctIndex ? 1 : 0), 0);
  const remember = (nextPosition) => {
    setPosition(nextPosition);
    onPositionChange?.({kind:"exam", revision:assessmentRevision(exam), ...nextPosition});
  };
  const total = exam.questions.length;
  const tier = pickTier(exam.results, score);
  const passingScore = exam.passingScore ?? 0;
  const metPass = score >= passingScore;
  const canComplete = metPass && tier != null;
  const earnedPhaseBadge = canComplete && Boolean(exam.phaseBadge);

  const restart = () => {
    setPosition({phase:"intro", answers:[], selected:null});
    onPositionChange?.(null);
  };

  if (phase === "intro") {
    return <LearningSummary key="intro" className="exam-intro" eyebrow="Knowledge check" title={t(exam.title)} icon={BookOpen} tone="neutral" onBack={onBack}
      subtitle={t("Pass with {score} of {total} correct.", {score:passingScore, total})}
      actions={<button className="btn-primary" onClick={() => remember({phase:"quiz", answers:[], selected:null})}>{t("Start exam")}</button>}>
      <section className="summary-section"><h2>{t("Topics covered")}</h2><ul>{exam.topics.map(topic => <li key={topic}>{t(topic)}</li>)}</ul></section>
      <p className="summary-next">{t("Choose an answer, then select Next. You can change your choice before moving on.")}</p>
    </LearningSummary>;
  }

  if (phase === "results") {
    return <LearningSummary key="results" className="exam-results" eyebrow="Your result" icon={canComplete ? Check : RotateCcw} tone={canComplete ? "success" : "neutral"}
      title={t(canComplete ? "Passing score" : "Keep practicing")} subtitle={t("You scored {score} of {total}.", {score, total})}
      actions={canComplete ? <button className="btn-primary" onClick={() => onPass({score,tier,earnedPhaseBadge,phaseBadge:earnedPhaseBadge ? exam.phaseBadge : null})}>{t("Back to your path")}</button>
        : <><button className="btn-primary" onClick={restart}>{t("Retake exam")}</button><button className="btn-secondary" onClick={onBack}>{t("Back to your path")}</button></>}>
      {tier ? <section className="summary-section">
        <h2>{t("Result")}</h2>
        <p className="summary-key-point">{t(tier.title)}</p>
        {tier.message && <p>{t(tier.message)}</p>}
      </section> : <section className="summary-section"><h2>{t("Not quite there yet")}</h2><p>{t("You need {score} correct to pass. Review the topics and try again.", {score:passingScore})}</p></section>}
    </LearningSummary>;
  }

  // Quiz phase — one question at a time, no explanations until the end.
  const q = exam.questions[qIndex];
  const reading = hasOwn(examPresentations, q.question) ? examPresentations[q.question] : {question:q.question};
  const statement = reading.question === "True or false?";
  const narration = (statement ? [reading.question, reading.story] : [reading.story, reading.question]).filter(Boolean).map(text => t(text)).join("\n\n");
  const progress = qIndex + 1;

  const choose = (i) => {
    remember({phase, answers, selected:i});
  };

  const next = () => {
    const submitted = [...answers, selected];
    remember({phase:submitted.length === total ? "results" : "quiz", answers:submitted, selected:null});
  };

  return (
    <BlockShell
      key={`exam-q-${qIndex}`}
      label="Exam"
      progress={progress}
      progressTotal={total}
      progressKind="question"
      onBack={onBack}
      onSkip={next}
      footer={
          <button className="btn-primary" disabled={selected == null}
            aria-label={selected == null ? t("Choose an answer before continuing") : undefined} onClick={next}>
            {t(qIndex + 1 < exam.questions.length ? "Next" : "See results")}
          </button>
      }
    >
      {reading.story && !statement && <p className="lesson-scenario-story">{t(reading.story)}</p>}
      <h1 className="page-title lesson-question mt-2">
        {t(reading.question)}
      </h1>
      {reading.story && statement && <p className="lesson-scenario-story mt-5">{t(reading.story)}</p>}

      <div className="mt-5">
        <ReadAloud text={narration} label="Read this aloud" />
      </div>

      <div className="mt-8 space-y-4">
        {q.options.map((option, i) => {
          const active = selected === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              aria-pressed={active}
              className="lesson-answer exam-answer"
            >
              <span>{t(option)}</span>
              <span className="exam-selection" aria-hidden="true">{active && <Check size={20}/>}</span>
            </button>
          );
        })}
      </div>
    </BlockShell>
  );
}
