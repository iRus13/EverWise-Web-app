import {useEffect, useRef} from "react";
import "../styles/achievements.css";

// A readable summary used for lesson completion and assessment entry/results.
export default function LearningSummary({title, eyebrow, subtitle, icon: Icon, onBack, children, actions, className = ""}) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({preventScroll:true}); }, []);
  return <div className={`learning-summary learning-focus ${className}`}>
    {onBack && <button type="button" className="summary-back" onClick={onBack}>← Back</button>}
    <header className="summary-header">
      {Icon && <div className="summary-symbol" aria-hidden="true"><Icon size={28}/></div>}
      {eyebrow && <p className="summary-eyebrow">{eyebrow}</p>}
      <h1 ref={heading} tabIndex={-1} className="page-title">{title}</h1>
      {subtitle && <p className="summary-subtitle">{subtitle}</p>}
    </header>
    {children && <div className="summary-sections">{children}</div>}
    <div className="summary-actions">{actions}</div>
  </div>;
}
