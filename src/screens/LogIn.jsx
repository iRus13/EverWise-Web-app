import { useRef, useState } from "react";
import Field from "../components/Field";
import AccountLayout from "../components/AccountLayout";
import { authErrorMessage } from "../utils/authErrors";
import PasswordReset from "./PasswordReset.jsx";

export default function LogIn({ onLogIn, onGoToSignUp, onBack, onResetPassword }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [missing, setMissing] = useState({});
  const identifierInput = useRef(null);
  const passwordInput = useRef(null);
  const submitting = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    if (!identifier.trim() || !password) {
      setMissing({identifier: !identifier.trim(), password: !password});
      setError("Please enter your username or email and password.");
      (!identifier.trim() ? identifierInput : passwordInput).current?.focus();
      return;
    }
    setError("");
    setBusy(true);
    submitting.current = true;
    try {
      await onLogIn(identifier.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
      submitting.current = false;
    }
  };

  if (resetting) return <PasswordReset initialEmail={identifier} onResetPassword={onResetPassword} onBack={() => setResetting(false)} />;

  return (
    <AccountLayout className="login-screen" onBack={onBack} title="Welcome back." description="Log in to continue your lessons and saved progress.">
      <form className="account-form" onSubmit={submit} noValidate>
        <div className="account-fields">
          <Field
            id="login-identifier"
            label="Username or email"
            value={identifier}
            onChange={(value) => { setIdentifier(value); setError(""); setMissing({}); }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            inputRef={identifierInput}
            ariaInvalid={missing.identifier || undefined}
            describedBy={error ? "login-error" : undefined}
            placeholder="Your username or email"
          />
          <Field
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(value) => { setPassword(value); setError(""); setMissing({}); }}
            autoComplete="current-password"
            inputRef={passwordInput}
            ariaInvalid={missing.password || undefined}
            describedBy={error ? "login-error" : undefined}
            placeholder="Your password"
          />
        </div>

        {onResetPassword && <button type="button" disabled={busy}
          className="account-link account-recovery"
          onClick={() => { setPassword(""); setError(""); setResetting(true); }}>
          Forgot password?
        </button>}

        {error && (
          <p
            role="alert"
            id="login-error"
            className="account-error"
          >
            {error}
          </p>
        )}

        <div className="account-actions">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Logging in…" : "Log In"}
          </button>
          <p className="account-alternative">
            New here?{" "}
            <button
              type="button"
              onClick={onGoToSignUp}
              className="account-link"
            >
              Sign up
            </button>
          </p>
        </div>
      </form>
    </AccountLayout>
  );
}
