import { tr, useLocale } from '../i18n';
import { useRef, useState } from "react";
import AccountLayout from "../components/AccountLayout.jsx";
import Field from "../components/Field.jsx";
import { canReceivePasswordReset } from "../utils/passwordRecovery.js";
import usePasswordResetRequest from "../hooks/usePasswordResetRequest.js";

export default function PasswordReset({ initialEmail = "", onResetPassword, onBack }) {
  useLocale();
  const [email, setEmail] = useState(canReceivePasswordReset(initialEmail) ? initialEmail.trim() : "");
  const reset = usePasswordResetRequest(onResetPassword);
  const { busy, sent } = reset;
  const [validationError, setValidationError] = useState("");
  const error = validationError || reset.error;
  const [invalid, setInvalid] = useState(false);
  const emailInput = useRef(null);

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    if (!canReceivePasswordReset(email)) {
      setInvalid(true);
      setValidationError("Enter the email address you used to create your account.");
      emailInput.current?.focus();
      return;
    }
    setValidationError(""); setInvalid(false);
    await reset.run(email);
  };

  return (
    <AccountLayout onBack={onBack} title={tr("Reset your password")} description={sent ? undefined : tr("Enter the email you used to sign up.")}>
      {sent ? (
        <div className="account-success">
          <p role="status">{tr("If an account uses this email address, you’ll receive a reset link. Check your inbox and spam folder.")}</p>
          <button className="btn-primary" onClick={onBack}>{tr("Back to login")}</button>
        </div>
      ) : (
        <form className="account-form" onSubmit={submit} noValidate>
          <Field id="reset-email" label={tr("Email address")} type="email" inputMode="email" autoComplete="email"
            value={email} onChange={value => { setEmail(value); setValidationError(""); reset.clear(); setInvalid(false); }} disabled={busy}
            inputRef={emailInput} autoCapitalize="none" spellCheck={false}
            ariaInvalid={invalid} describedBy={error ? "reset-help reset-error" : "reset-help"} />
          <p id="reset-help" className="account-help">{tr("Email reset is available for accounts created with an email address. If your organization gave you a username, ask them for password help. Username-only accounts cannot receive reset emails.")}</p>
          {error && <p id="reset-error" role="alert" className="account-error">{tr(error)}</p>}
          <button className="btn-primary" type="submit" disabled={busy}>{busy ? tr("Requesting reset…") : tr("Send reset link")}</button>
        </form>
      )}
    </AccountLayout>
  );
}
