import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { partnerLearnerBaseUrl } from "../utils/partnerLearnerUrl";
import AppShell from "../components/AppShell";
import StatusScreen from "../components/StatusScreen";
import "../styles/partner-dashboard.css";
import {
  fetchPartnerReport,
  rotatePartnerInvite,
} from "../services/partnerAccess.js";
import { PartnerLogo } from "../components/PartnerBrand.jsx";

const MINIMUM_GROUP_RESPONSES = 5;

const DISTRIBUTION_LABELS = {
  ageBand: "Age range",
  internetUse: "Internet use",
  primaryDevice: "Primary device",
  confidence: "Online confidence",
  scamFrequency: "Scam experience",
  concerns: "Main concerns",
  bankSafetyCategory: "Bank-message response",
  aiExperience: "AI experience",
  accessibilityNeeds: "Accessibility needs",
};

function count(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function percentage(value, total) {
  if (!total) return 0;
  return Math.round((count(value) / total) * 1000) / 10;
}

function csvField(value) {
  const text = String(value ?? "");
  const safeText = /^[=+@-]/.test(text) ? `'${text}` : text;
  return /[",\r\n ]/.test(safeText)
    ? `"${safeText.replaceAll('"', '""')}"`
    : safeText;
}

function groupBreakdownsAvailable(research) {
  return Boolean(
    count(research?.consentedCount) >= MINIMUM_GROUP_RESPONSES &&
      research?.suppressed === false &&
      research.distributions &&
      typeof research.distributions === "object",
  );
}

function aggregateRows(report) {
  const seats = report?.seats || {};
  const research = report?.research || {};
  const seatLimit = count(seats.limit);
  const consentedCount = count(research.consentedCount);
  const rows = [
    ["seats", "claimed", count(seats.claimed), percentage(seats.claimed, seatLimit)],
    ["seats", "available", count(seats.available), percentage(seats.available, seatLimit)],
    [
      "research",
      "consented",
      consentedCount,
      count(research.consentedPercentage),
    ],
  ];

  if (groupBreakdownsAvailable(research)) {
    for (const metric of Object.keys(DISTRIBUTION_LABELS)) {
      const distribution = research.distributions[metric];
      if (!distribution || typeof distribution !== "object") continue;
      for (const [category, categoryCount] of Object.entries(distribution)) {
        if (typeof category !== "string" || !Number.isFinite(categoryCount)) continue;
        rows.push([
          metric,
          category,
          count(categoryCount),
          percentage(categoryCount, consentedCount),
        ]);
      }
    }
  }
  return rows;
}

// oxlint-disable-next-line react/only-export-components -- exercised directly by the CSV privacy regression
export function buildPartnerReportCsv(report) {
  const lines = ["metric,category,count,percentage"];
  for (const row of aggregateRows(report)) {
    lines.push(row.map(csvField).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function downloadReport(report) {
  const blob = new Blob([buildPartnerReportCsv(report)], {
    type: "text/csv;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "everwise-partner-report.csv";
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formattedUpdatedAt(updatedAt) {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function invitationStatusLabel(status) {
  if (status === "active") return "Active";
  if (status === "suspended") return "Paused";
  return "Unavailable";
}

export default function PartnerDashboard({ adminToken }) {
  // A different admin link owns a different report and one-session invitation.
  return <AppShell screen="partner-dashboard"><PartnerDashboardSession key={adminToken || ""} adminToken={adminToken} /></AppShell>;
}

function PartnerDashboardSession({ adminToken }) {
  const [status, setStatus] = useState(adminToken ? "loading" : "invalid");
  const [report, setReport] = useState(null);
  const [rotationStep, setRotationStep] = useState("idle");
  const [replacementLink, setReplacementLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [reportAttempt, setReportAttempt] = useState(0);
  const rotating = useRef(false);
  const heading = useRef(null), invitationHeading = useRef(null), confirmationHeading = useRef(null);
  const replaceButton = useRef(null), linkInput = useRef(null), rotationError = useRef(null), exportError = useRef(null);
  const previousStep = useRef("idle");

  useEffect(() => {
    if (!adminToken) return undefined;
    let cancelled = false;
    setStatus("loading");
    fetchPartnerReport({ adminToken })
      .then((nextReport) => {
        if (cancelled) return;
        setReport(nextReport);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setReport(null);
        setStatus(error?.code === "INVALID_ADMIN" ? "invalid" : "error");
      });
    return () => { cancelled = true; };
  }, [adminToken, reportAttempt]);

  useEffect(() => {
    if (status === "ready") heading.current?.focus({preventScroll:true});
  }, [status]);

  const reveal = (element, block = "nearest") => {
    if (!element) return;
    element.focus({preventScroll:true});
    // Scroll the report pane itself. WebKit's scrollIntoView can also move
    // hidden shell ancestors and place the heading behind the status bar.
    const pane = element.closest(".partner-dashboard");
    const nested = pane && /^(auto|scroll)$/.test(getComputedStyle(pane).overflowY);
    const bounds = nested ? pane.getBoundingClientRect() : null;
    const viewport = element.closest(".app-viewport");
    const inset = viewport ? parseFloat(getComputedStyle(viewport).paddingTop) || 0 : 0;
    const top = (bounds ? Math.max(0, bounds.top) : inset) + 16;
    const bottom = (bounds ? Math.min(innerHeight, bounds.bottom) : innerHeight) - 16;
    const rect = element.getBoundingClientRect();
    const delta = block === "start" || rect.top < top ? rect.top - top
      : rect.bottom > bottom ? rect.bottom - bottom : 0;
    if (nested) pane.scrollTop += delta;
    else window.scrollTo({top: window.scrollY + delta});
  };
  useEffect(() => {
    if (rotationStep === "confirm") reveal(confirmationHeading.current, "start");
    if (rotationStep === "revealed") reveal(linkInput.current);
    if (rotationStep === "error") reveal(rotationError.current, "start");
    if (rotationStep === "idle" && previousStep.current === "confirm") reveal(replaceButton.current);
    previousStep.current = rotationStep;
  }, [rotationStep]);
  useEffect(() => { if (downloadError) reveal(exportError.current); }, [downloadError]);

  const learnerBase = partnerLearnerBaseUrl({
    native: Capacitor.isNativePlatform(),
    currentUrl: window.location.href,
    publicOrigin: import.meta.env.VITE_EVERWISE_PUBLIC_APP_ORIGIN || "https://everwise.tips",
  });

  const confirmRotation = async () => {
    if (rotating.current || rotationStep !== "confirm" || !learnerBase) return;
    rotating.current = true;
    setRotationStep("rotating");
    setCopyStatus("");
    try {
      const result = await rotatePartnerInvite({ adminToken });
      if (typeof result?.inviteToken !== "string") throw new Error("invalid response");
      const link = new URL(learnerBase.href);
      link.hash = `partner=${result.inviteToken}`;
      setReplacementLink(link.href);
      setRotationStep("revealed");
    } catch {
      setReplacementLink("");
      setRotationStep("error");
    } finally { rotating.current = false; }
  };

  const copyReplacement = async () => {
    try {
      await navigator.clipboard.writeText(replacementLink);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Select the link and copy it manually.");
      reveal(linkInput.current);
    }
  };

  if (status === "loading") {
    return <StatusScreen title="Partner report" description="Loading the aggregate report…" progressLabel="Loading report" />;
  }
  if (status !== "ready" || !report) {
    return <StatusScreen title={status === "error" ? "Partner report" : "Everwise partner reporting"}
      description={status === "error" ? "The report could not be loaded. Please try again." : "This admin link is not available."}
      actions={status === "error" ? <button type="button" className="btn-primary" onClick={() => {setStatus("loading");setReportAttempt(a => a + 1);}}>Try loading report again</button> : undefined} />;
  }

  const partnerName = typeof report.branding?.name === "string" && report.branding.name.trim()
    ? report.branding.name.trim() : typeof report.name === "string" ? report.name.trim() : "Partner organization";
  const claimed = count(report.seats?.claimed), available = count(report.seats?.available), limit = count(report.seats?.limit);
  const consentedCount = count(report.research?.consentedCount);
  const updatedAt = formattedUpdatedAt(report.updatedAt);
  const showGroupBreakdowns = groupBreakdownsAvailable(report.research);
  const invitationStatus = invitationStatusLabel(report.invitation?.status);

  return (
    <section className="partner-dashboard">
      <div className="partner-dashboard-content">
        <header className="partner-dashboard-header">
          <div className="status-brand"><img src={`${import.meta.env.BASE_URL}everwise-logo-192.png`} alt="" /><span>Everwise</span></div>
          <div className="partner-dashboard-partner-lockup">
            <PartnerLogo partner={report.branding} className="partner-dashboard-partner-logo" />
            <p>Reporting for {partnerName}</p>
          </div>
          <h1 ref={heading} tabIndex={-1}>Partner overview</h1>
          <p>This page shows combined group totals only.</p>
          {updatedAt && <p className="partner-dashboard-updated">Report updated <time dateTime={report.updatedAt}>{updatedAt}</time></p>}
          <div className="partner-dashboard-toolbar">
            <button type="button" className="btn-primary" onClick={() => {
              setDownloadError("");
              try { downloadReport(report); } catch { setDownloadError("The report download could not start. Please try again."); }
            }}>Download aggregate CSV</button>
            <button type="button" className="btn-secondary" onClick={() => reveal(invitationHeading.current, "start")}>Learner invitation</button>
          </div>
          {downloadError && <p ref={exportError} tabIndex={-1} role="alert" className="partner-dashboard-feedback">{downloadError}</p>}
        </header>

        <div className="partner-dashboard-summaries">
          <section className="partner-dashboard-summary" aria-labelledby="seat-summary">
            <h2 id="seat-summary">Sponsored access</h2>
            <p className="partner-dashboard-lead">{claimed} of {limit} seats in use</p>
            <p>{available} seats available</p>
          </section>
          <section className="partner-dashboard-summary" aria-labelledby="research-summary">
            <h2 id="research-summary">Optional research</h2>
            <p className="partner-dashboard-lead">{consentedCount} research responses</p>
            <p><strong>{count(report.research?.consentedPercentage)}%</strong> of learners chose to participate</p>
          </section>
        </div>

        <section className="partner-dashboard-section" aria-labelledby="breakdowns-title">
          <h2 id="breakdowns-title">Group breakdowns</h2>
          {!showGroupBreakdowns ? <p className="partner-dashboard-threshold">More responses are needed before group breakdowns can be shown.</p> :
            <div className="partner-dashboard-distributions">
              {Object.entries(DISTRIBUTION_LABELS).map(([metric, label]) => {
                const distribution = report.research.distributions[metric];
                if (!distribution || typeof distribution !== "object") return null;
                const entries = Object.entries(distribution).filter(([category, value]) => typeof category === "string" && Number.isFinite(value));
                if (!entries.length) return null;
                return <section key={metric} className="partner-dashboard-breakdown">
                  <h3 id={`breakdown-${metric}`}>{label}</h3>
                  <table role="table" aria-labelledby={`breakdown-${metric}`}>
                    <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Group</th><th role="columnheader" scope="col">Count</th><th role="columnheader" scope="col">Share</th></tr></thead>
                    <tbody role="rowgroup">{entries.map(([category, value]) => <tr role="row" key={category}><th role="rowheader" scope="row">{category}</th><td role="cell"><span className="partner-dashboard-cell-label" aria-hidden="true">Count</span>{count(value)}</td><td role="cell"><span className="partner-dashboard-cell-label" aria-hidden="true">Share</span>{percentage(value, consentedCount)}%</td></tr>)}</tbody>
                  </table>
                </section>;
              })}
            </div>}
        </section>

        <section className="partner-dashboard-section partner-dashboard-invitation" aria-labelledby="learner-link-title">
          <h2 ref={invitationHeading} tabIndex={-1} id="learner-link-title">Learner invitation</h2>
          <p className="partner-dashboard-invitation-status">Learner invitation status: {invitationStatus}</p>
          <p>Replace the learner link only if the current link should no longer work.</p>
          {!learnerBase && <p>Open this report in a web browser to replace the learner link.</p>}
          {learnerBase && rotationStep === "idle" && <button ref={replaceButton} type="button" className="btn-secondary" onClick={() => setRotationStep("confirm")}>Replace learner link</button>}
          {(rotationStep === "confirm" || rotationStep === "rotating") &&
            <div className="partner-dashboard-confirmation">
              <h3 ref={confirmationHeading} tabIndex={-1}>Replace learner link?</h3>
              <p>The previous learner link will stop working as soon as you replace it.</p>
              <div className="partner-dashboard-button-row">
                <button type="button" className="btn-secondary" onClick={() => setRotationStep("idle")} disabled={rotationStep === "rotating"}>Cancel</button>
                <button type="button" className="btn-secondary partner-dashboard-destructive" onClick={confirmRotation} disabled={rotationStep === "rotating"} aria-busy={rotationStep === "rotating"}>{rotationStep === "rotating" ? "Replacing…" : "Replace link now"}</button>
              </div>
            </div>}
          {rotationStep === "revealed" && <div className="partner-dashboard-replacement">
            <p>Save this replacement link now. It is kept only in this open dashboard.</p>
            <label htmlFor="replacement-learner-link">Replacement learner link</label>
            <input ref={linkInput} id="replacement-learner-link" type="text" readOnly value={replacementLink} onFocus={event => event.currentTarget.select()} />
            <button type="button" className="btn-primary" onClick={copyReplacement}>Copy replacement link</button>
            {copyStatus && <p role="status">{copyStatus}</p>}
          </div>}
          {rotationStep === "error" && <div className="partner-dashboard-confirmation">
            <p ref={rotationError} tabIndex={-1} role="alert">We couldn't confirm whether the learner link was replaced. Replacing it again will stop any current learner link from working.</p>
            <button type="button" className="btn-secondary" onClick={() => setRotationStep("confirm")}>Review replacement</button>
          </div>}
        </section>
      </div>
    </section>
  );
}
