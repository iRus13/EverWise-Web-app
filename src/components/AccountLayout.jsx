import { useEffect, useRef } from "react";
import BackButton from "./BackButton";
import "../styles/account-experience.css";

export default function AccountLayout({ title, description, onBack, className = "", children }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({preventScroll:true}); }, []);
  return (
    <section className={`account-screen ${className}`}>
      <div className="account-content">
        <header className="account-header">
          <BackButton onClick={onBack} />
          <span className="account-brand">
            <img src={`${import.meta.env.BASE_URL}everwise-logo-192.png`} alt="" />
            Everwise
          </span>
        </header>
        <div className="account-intro">
          <h1 ref={heading} tabIndex={-1}>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
