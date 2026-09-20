import { useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton.jsx";
import Field from "../components/Field.jsx";
import { canReceivePasswordReset } from "../utils/passwordRecovery.js";
import usePasswordResetRequest from "../hooks/usePasswordResetRequest.js";

export default function PasswordReset({ initialEmail = "", onResetPassword, onBack }) {
  const [email, setEmail] = useState(canReceivePasswordReset(initialEmail) ? initialEmail.trim() : "");
  const reset = usePasswordResetRequest(onResetPassword);
  const { busy, sent } = reset;
  const [validationError, setValidationError] = useState("");
  const error = validationError || reset.error;
  const [invalid, setInvalid] = useState(false);
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    if (!canReceivePasswordReset(email)) {
      setInvalid(true);
      setValidationError("Enter the email address you used to create your account.");
      return;
    }
    setValidationError(""); setInvalid(false);
    await reset.run(email);
  };

  return (
    <section className="onboarding-focus auth-focus flex flex-1 flex-col overflow-y-auto px-7 pb-10 pt-6">
      <BackButton onClick={onBack} />
      <h1 ref={heading} tabIndex={-1} className="page-title mt-6">Reset your password</h1>
      {sent ? (
        <div className="mt-8 space-y-6">
          <p role="status" className="text-xl text-ink-soft">If an account uses this email address, you’ll receive a reset link. Check your inbox and spam folder.</p>
          <button className="btn-primary" onClick={onBack}>Back to login</button>
        </div>
      ) : (
        <form className="mt-8 flex flex-1 flex-col gap-6" onSubmit={submit} noValidate>
          <p className="text-xl text-ink-soft">Enter the email you used to sign up.</p>
          <Field id="reset-email" label="Email address" type="email" inputMode="email" autoComplete="email"
            value={email} onChange={value => { setEmail(value); setValidationError(""); reset.clear(); setInvalid(false); }} disabled={busy}
            ariaInvalid={invalid} describedBy={error ? "reset-help reset-error" : "reset-help"} />
          <p id="reset-help" className="text-lg text-ink-soft">Email reset is available for accounts created with an email address. If your organization gave you a username, ask them for password help. Username-only accounts cannot receive reset emails.</p>
          {error && <p id="reset-error" role="alert" className="rounded-2xl bg-alert/12 px-5 py-4 text-lg font-semibold text-alert">{error}</p>}
          <button className="btn-primary" type="submit" disabled={busy}>{busy ? "Requesting reset…" : "Send reset link"}</button>
        </form>
      )}
    </section>
  );
}
