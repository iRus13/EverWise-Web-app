import { useState } from "react";
import BlockShell from "../components/blocks/BlockShell";
import ReadAloud from "../components/ReadAloud";
import {BookOpen, Check, RotateCcw} from "lucide-react";
import LearningSummary from "../components/LearningSummary";
import {assessmentRevision, restoreAssessmentPosition} from "../utils/assessmentProgress.js";

function pickTier(results, score) {
  const sorted = [...(results || [])].sort((a, b) => b.minScore - a.minScore);
  return sorted.find((t) => score >= t.minScore) || null;
}

export default function ExamPlayer({ exam, onBack, onPass, initialPosition, onPositionChange }) {
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
    return <LearningSummary key="intro" className="exam-intro" eyebrow="Knowledge check" title={exam.title} icon={BookOpen} onBack={onBack}
      subtitle={`Pass with ${passingScore} of ${total} correct.`}
      actions={<button className="btn-primary" onClick={() => remember({phase:"quiz", answers:[], selected:null})}>Start exam</button>}>
      <section className="summary-section"><h2>Topics covered</h2><ul>{exam.topics.map(topic => <li key={topic}>{topic}</li>)}</ul></section>
      <p className="summary-next">Choose an answer, then select Next. You can change your choice before moving on.</p>
    </LearningSummary>;
  }

  if (phase === "results") {
    return <LearningSummary key="results" className="exam-results" eyebrow="Your result" icon={canComplete ? Check : RotateCcw}
      title={canComplete ? "Exam complete!" : "Keep practicing"} subtitle={`You scored ${score} of ${total}.`}
      actions={canComplete ? <button className="btn-primary" onClick={() => onPass({score,tier,earnedPhaseBadge,phaseBadge:earnedPhaseBadge ? exam.phaseBadge : null})}>Back to your path</button>
        : <><button className="btn-primary" onClick={restart}>{exam.phaseBadge ? "Retake exam" : "Try again"}</button><button className="btn-secondary" onClick={onBack}>Back to path</button></>}>
      {tier ? <section className="summary-section">
        <h2>{canComplete && tier.trophy ? "Trophy earned" : "Result"}</h2>
        <p className="summary-key-point">{tier.title}</p>
        {tier.message && <p>{tier.message}</p>}
        {exam.nextPhase && canComplete && <p>Unlocks next: <strong>{exam.nextPhase}</strong></p>}
      </section> : <section className="summary-section"><h2>Not quite there yet</h2><p>You need {passingScore} correct to pass. Review the topics and try again.</p></section>}
      {earnedPhaseBadge && <section className="summary-section summary-award"><h2>Phase achievement</h2><p className="summary-key-point">{exam.phaseBadge}</p></section>}
    </LearningSummary>;
  }

  // Quiz phase — one question at a time, no explanations until the end.
  const q = exam.questions[qIndex];
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
      onBack={onBack}
      onSkip={next}
      footer={
          <button className="btn-primary" disabled={selected == null}
            aria-label={selected == null ? "Choose an answer before continuing" : undefined} onClick={next}>
            {qIndex + 1 < exam.questions.length ? "Next" : "See results"}
          </button>
      }
    >
      <p className="text-lg font-semibold text-ink-faint">
        Question {progress} of {total}
      </p>
      <h1 className="page-title mt-3">
        {q.question}
      </h1>

      <div className="mt-5">
        <ReadAloud text={q.question} label="Read this aloud" />
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
              <span>{option}</span>
              <span className="exam-selection" aria-hidden="true">{active && <Check size={20}/>}</span>
            </button>
          );
        })}
      </div>
    </BlockShell>
  );
}
