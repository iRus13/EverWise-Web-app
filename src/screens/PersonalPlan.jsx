import { useEffect, useMemo, useRef } from "react";
import "../styles/status-screen.css";

function getPlan(profile) {
  const interview = profile?.profileInterview ?? {};
  const concerns = interview.concerns ?? [];
  const safeBankChoice =
    interview.scamScenario === "Call the bank using its official number";

  let strength =
    "You took time to build a safer and more comfortable online routine.";
  if (safeBankChoice) {
    strength =
      "You already know to verify urgent bank messages using an official phone number.";
  } else if (
    interview.confidence === "Confident" ||
    interview.confidence === "Sometimes I need help"
  ) {
    strength = "You already have online experience to build on.";
  }

  const firstConcern = concerns[0] ?? "Scam calls and messages";
  const concernLesson = {
    "Scam calls and messages": "Recognize scam calls and urgent messages",
    "Money or bank-card theft": "Protect cards, banking apps, and payments",
    "Suspicious links": "Check links before opening them",
    "Account hacking": "Strengthen passwords and account security",
    "Fake news": "Check whether online information is trustworthy",
    "Knowing what to trust": "Verify online claims using trusted sources",
  }[firstConcern];

  const safetyLesson =
    interview.scamFrequency === "never"
      ? "Keep your personal information protected"
      : "Know what to do after a suspected scam";
  const aiLesson =
    interview.aiExperience === "I don’t know what it is yet"
      ? "Understand what AI can and cannot do"
      : "Ask AI useful questions and check its answers";

  return {
    firstConcern,
    strength,
    recommendations: [
      concernLesson ?? "Recognize suspicious messages",
      safetyLesson,
      aiLesson,
    ],
  };
}

export default function PersonalPlan({ profile, sponsored = false, onContinue }) {
  const plan = useMemo(() => getPlan(profile), [profile]);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);

  return (
    <section className="personal-plan">
      <div className="personal-plan-content">
        <div className="status-brand"><img src={`${import.meta.env.BASE_URL}everwise-logo-192.png`} alt="" /><span>Everwise</span></div>
        <header>
          <p className="status-context">Your plan is ready</p>
          <h1 ref={heading} tabIndex={-1}>Your personal learning plan</h1>
          <p className="personal-plan-intro">We recommend starting with these three topics:</p>
        </header>
        <ol className="personal-plan-topics">
          {plan.recommendations.map((recommendation, index) => (
            <li key={recommendation}>
              <span className="personal-plan-number" aria-hidden="true">{index + 1}.</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ol>
        <section className="personal-plan-strength" aria-labelledby="plan-strength">
          <h2 id="plan-strength">A strength to build on</h2>
          <p>{plan.strength}</p>
        </section>
        <p className="personal-plan-note">Your answers are saved. You can change accessibility preferences later.</p>
        <div className="personal-plan-actions">
          <button type="button" className="btn-primary" onClick={onContinue}>
            {sponsored ? "Start learning" : "See my plan options"}
          </button>
        </div>
      </div>
    </section>
  );
}
