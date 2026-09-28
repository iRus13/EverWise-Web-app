import { BookOpen, MessageCircle, Check } from "lucide-react";
import PartnerBrand from "../components/PartnerBrand";
import "../styles/start-experience.css";

const steps = [
  ["Learn", "Short lessons, in plain language.", BookOpen],
  ["Practice", "Try real examples in a safe space.", MessageCircle],
  ["Remember", "Build skills you can use every day.", Check],
];

export default function Landing({ partner = null, onGetStarted, onLogIn }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <header className="welcome-brand">
          {partner ? <PartnerBrand partner={partner} /> : (
            <div className="start-brand">
              <img src={`${import.meta.env.BASE_URL}everwise-logo-192.png`} alt="" aria-hidden="true" />
              <span>Everwise</span>
            </div>
          )}
        </header>
        <section className="welcome-intro">
          <p className="welcome-eyebrow">EVERYDAY DIGITAL CONFIDENCE</p>
          <h1>A wiser way<br />to be online.</h1>
          <p>Feel more confident with the messages, links, and everyday decisions you make online.</p>
          {partner ? <p className="welcome-sponsorship">Your access is provided free by {partner.name}.</p> : null}
        </section>
        <section className="welcome-guide" aria-labelledby="welcome-guide-title">
          <h2 id="welcome-guide-title">Small steps. Useful skills.</h2>
          <ol>
            {steps.map(([title, description, Icon]) => (
              <li key={title}>
                <span className="welcome-step-number" aria-hidden="true"><Icon size={22} strokeWidth={1.7} /></span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ol>
        </section>
        <div className="welcome-actions">
          <button type="button" className="btn-primary" onClick={onGetStarted}>Get Started</button>
          <button type="button" className="btn-secondary" onClick={onLogIn}>Log In</button>
        </div>
      </div>
    </div>
  );
}
