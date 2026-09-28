import { useEffect, useId, useRef } from "react";
import "../styles/status-screen.css";

export default function StatusScreen({
  title, description, label, children, actions, progressLabel, focusKey,
  regionLabel, focusHeading = true,
}) {
  const heading = useRef(null);
  const pane = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!focusHeading) return;
    if (pane.current) pane.current.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, [title, focusKey, focusHeading]);

  return (
    <section ref={pane} className="status-screen" aria-label={regionLabel} aria-labelledby={regionLabel ? undefined : titleId}>
      <div className="status-content">
        <div className="status-brand">
          <img src={`${import.meta.env.BASE_URL}everwise-logo-192.png`} alt="" />
          <span>Everwise</span>
        </div>
        <div className="status-message">
          {label && <p className="status-context">{label}</p>}
          <h1 ref={heading} id={titleId} tabIndex={-1}>{title}</h1>
          {description && <p className="status-description" role="status">{description}</p>}
          {progressLabel && (
            <div className="status-progress" role="progressbar" aria-label={progressLabel}>
              <span className="status-spinner" aria-hidden="true" />
              <span>{progressLabel}</span>
            </div>
          )}
          {children}
          {actions && <div className="status-actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
