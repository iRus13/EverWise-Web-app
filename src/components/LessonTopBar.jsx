import { ArrowLeftIcon } from "./Icons";

export default function LessonTopBar({ label = "Lesson", progress = 0, progressTotal = 1, onBack, onSkip, onExit }) {
  const fraction = progressTotal > 0 ? Math.min(1, Math.max(0, progress / progressTotal)) : 0;
  return <header className="lesson-top-bar">
    <div className="lesson-navigation">
      <button type="button" onClick={onBack} aria-label="Go back" className="lesson-back"><ArrowLeftIcon className="h-6 w-6" /></button>
      <div className="lesson-top-actions">
        {onSkip && <button type="button" onClick={onSkip} aria-label="Skip this step">Skip</button>}
        {onExit && <button type="button" onClick={onExit} aria-label="Save and exit this lesson">Exit</button>}
      </div>
    </div>
    <div className="lesson-step-caption"><span>{label}</span><span>Step {progress} of {progressTotal}</span></div>
    <div className="lesson-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={progressTotal} aria-valuenow={progress} aria-label="Lesson progress">
      <span style={{width: `${fraction * 100}%`}} />
    </div>
  </header>;
}
