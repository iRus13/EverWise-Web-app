import { tr, useLocale } from '../i18n';
// The −/+ text size stepper. It lives in one place so every screen can show
// the same control: the persistent nav (tablet and desktop), the Home intro
// row, and the Settings screen (the reliable route on a phone, where the nav
// is hidden).

import { TEXT_SIZES, textSizeStep } from "../utils/textSize";

export default function TextSizeControl({
  textSize,
  onTextSizeChange,
  className = "",
  buttonClassName = "h-11 w-11",
  label = "Text size",
}) {
  useLocale();
  const index = Math.max(0, TEXT_SIZES.indexOf(textSize));
  const atSmallest = index === 0;
  const atLargest = index === TEXT_SIZES.length - 1;

  return (
    <div
      className={`flex shrink-0 items-center overflow-hidden rounded-xl border border-ink/15 bg-cream-card ${className}`}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onTextSizeChange(textSizeStep(textSize, -1))}
        disabled={atSmallest}
        aria-label={tr("Make text smaller")}
        className={`text-size-control flex items-center justify-center font-bold text-ink transition-colors enabled:hover:bg-cream-deep enabled:active:bg-cream-deep disabled:cursor-not-allowed disabled:text-ink-faint ${buttonClassName}`}
      >
        −
      </button>
      <span className="h-7 w-px bg-ink/15" aria-hidden="true" />
      <button
        type="button"
        onClick={() => onTextSizeChange(textSizeStep(textSize, 1))}
        disabled={atLargest}
        aria-label={tr("Make text larger")}
        className={`text-size-control flex items-center justify-center font-bold text-ink transition-colors enabled:hover:bg-cream-deep enabled:active:bg-cream-deep disabled:cursor-not-allowed disabled:text-ink-faint ${buttonClassName}`}
      >
        +
      </button>
    </div>
  );
}
