import { BookIcon, MessageSearchIcon } from "../components/Icons";
import AddToHomeScreenBanner from "../components/AddToHomeScreenBanner";
import { PartnerLogo } from "../components/PartnerBrand.jsx";
import { Award, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../styles/start-experience.css";

function Chevron() {
  return <svg className="start-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>;
}

function learningDescription(activity, allDone) {
  if (allDone) return "Revisit a lesson whenever you need a refresher.";
  if (!activity) return "Open your course to choose an available step.";
  if (activity.resumable) return "Your saved place is ready on this device.";
  if (activity.id === "welcome") return "A quick introduction to how your lessons work.";
  if (activity.kind === "challenge") return "Practice what you learned in this phase.";
  if (activity.kind === "exam") return "Check your understanding before moving on.";
  return "Take it one step at a time. You can pause whenever you need.";
}

export default function Home({
  partner = null, name, lessonsCompleted = 0, badgesEarned = 0, allDone,
  nextActivity = null, onStartNext,
  onStart, onOpenBadges, onOpenSettings, onOpenScamChecker,
}) {
  const partnerName = partner?.name?.trim();
  const firstName = name ? name.trim().split(" ")[0] : "";
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState("");
  const openingRef = useRef(false);
  const errorMessage = useRef(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (openError) errorMessage.current?.scrollIntoView?.({block: "nearest"});
  }, [openError]);
  const activity = !allDone && nextActivity;
  const actionLabel = activity ? `${activity.resumable ? "Resume" : "Start"} ${activity.kind}` : "";
  const openNext = async () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    setOpenError("");
    try { await onStartNext?.(() => mounted.current); }
    catch { if (mounted.current) setOpenError("This activity could not be opened. Please try again."); }
    finally { openingRef.current = false; if (mounted.current) setOpening(false); }
  };
  return (
    <div className="home-screen today-screen">
      <div className="today-content">
        <header className="today-header">
          <div className="start-brand">
            <img src={`${import.meta.env.BASE_URL}everwise-logo-192.png`} alt="" aria-hidden="true" />
            <span>Everwise</span>
          </div>
          <button type="button" className="today-settings" onClick={onOpenSettings}>Settings</button>
        </header>
        {partnerName ? (
          <div className="today-partner">
            <PartnerLogo partner={partner} className="home-partner-logo" />
            <p>Access provided by {partnerName}</p>
          </div>
        ) : null}
        <section className="today-intro">
          <p className="today-greeting">Hello{firstName ? `, ${firstName}` : ""}.</p>
          <h1>Today</h1>
        </section>
        <div className="today-dashboard">
          <section className="today-learning" aria-labelledby="today-learning-title">
            <div className="today-section-label"><BookIcon className="start-icon" /><span>{activity ? activity.resumable ? "Ready to continue" : "Up next" : "Your learning"}</span></div>
            <h2 id="today-learning-title">{allDone ? "Course complete." : activity?.title || "Your course"}</h2>
            {activity ? <p className="today-activity-phase">Phase {activity.phaseNumber}{activity.phaseTitle ? ` · ${activity.phaseTitle}` : ""}</p> : null}
            <p>{learningDescription(activity, allDone)}</p>
            {activity ? <>
              <button type="button" className="btn-primary" onClick={openNext} disabled={opening}
                aria-busy={opening} aria-label={`${opening ? `Opening ${activity.kind}` : actionLabel}: ${activity.title}`}>
                {opening ? `Opening ${activity.kind}…` : actionLabel}
              </button>
              {openError ? <p ref={errorMessage} className="today-open-error" role="alert">{openError}</p> : null}
              <button type="button" className="today-course-link" onClick={onStart}>View course<Chevron /></button>
            </> : <button type="button" className="btn-primary" onClick={onStart}>{allDone ? "Review course" : "View course"}</button>}
          </section>
          <div className="today-secondary">
          <section className="today-tools" aria-labelledby="today-tools-title">
            <h2 id="today-tools-title" className="sr-only">Tools</h2>
            <button type="button" className="today-checker" onClick={onOpenScamChecker}>
              <span className="today-tool-symbol"><MessageSearchIcon className="start-icon" /></span>
              <span><strong>Scam checker</strong><span>Look for warning signs and get clear next steps.</span></span>
              <ArrowUpRight className="start-chevron" aria-hidden="true" />
            </button>
          </section>
          <section className="today-progress" aria-labelledby="today-progress-title">
            <h2 id="today-progress-title">Your progress</h2>
            <div className="today-progress-rows">
              <div className="today-lesson-count"><strong>{lessonsCompleted}</strong><span>lessons completed</span></div>
              <button type="button" className="today-badges" onClick={onOpenBadges}>
                <Award className="start-icon" aria-hidden="true" />
                <span><strong>{badgesEarned} {badgesEarned === 1 ? "badge" : "badges"}</strong><span>View your badges</span></span>
                <Chevron />
              </button>
            </div>
          </section>
          </div>
        </div>
        <p className="today-footnote">Small steps. Lasting confidence.</p>
        <div className="today-install"><AddToHomeScreenBanner /></div>
      </div>
    </div>
  );
}
