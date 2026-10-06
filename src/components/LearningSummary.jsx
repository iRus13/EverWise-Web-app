import {tr, useLocale} from "../i18n";
import {useEffect, useRef} from "react";
import "../styles/achievements.css";

// A readable summary used for lesson completion and assessment entry/results.
export default function LearningSummary({title, eyebrow, subtitle, icon: Icon, tone = "success", onBack, notice, children, actions, className = ""}) {
  useLocale();
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({preventScroll:true}); }, []);
  return <div className={`learning-summary learning-focus ${className}`} data-tone={tone}>
    {onBack && <button type="button" className="summary-back" onClick={onBack}>← {tr("Back")}</button>}
    <header className="summary-header">
      {Icon && <div className="summary-symbol" aria-hidden="true"><Icon size={28}/></div>}
      {eyebrow && tr(eyebrow) !== tr(title) && <p className="summary-eyebrow">{tr(eyebrow)}</p>}
      <h1 ref={heading} tabIndex={-1} className="page-title">{tr(title)}</h1>
      {subtitle && <p className="summary-subtitle">{tr(subtitle)}</p>}
    </header>
    {notice}
    {children && <div className="summary-sections">{children}</div>}
    <div className="summary-actions">{actions}</div>
  </div>;
}
