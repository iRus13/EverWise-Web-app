import { tr, useLocale } from '../i18n';
import { ArrowLeftIcon } from "./Icons";

export default function LessonTopBar({ label = "Lesson", progress = 0, progressTotal = 1, onBack, onSkip, onExit }) {
  useLocale();
  const fraction = progressTotal > 0 ? Math.min(1, Math.max(0, progress / progressTotal)) : 0;
  return <header className="lesson-top-bar">
    <div className="lesson-navigation">
      <button type="button" onClick={onBack} aria-label={tr("Go back")} className="lesson-back"><ArrowLeftIcon className="h-6 w-6" /></button>
      <div className="lesson-top-actions">
        {onSkip && <button type="button" onClick={onSkip} aria-label={tr("Skip this step")}>{tr("Skip")}</button>}
        {onExit && <button type="button" onClick={onExit} aria-label={tr("Save and exit this lesson")}>{tr("Exit")}</button>}
      </div>
    </div>
    <div className="lesson-step-caption"><span>{tr(label)}</span><span>{tr("Step {current} of {total}",{current:progress,total:progressTotal})}</span></div>
    <div className="lesson-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={progressTotal} aria-valuenow={progress} aria-label={tr("Lesson progress")}>
      <span style={{width: `${fraction * 100}%`}} />
    </div>
  </header>;
}
