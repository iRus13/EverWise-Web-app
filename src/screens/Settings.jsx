import { hasOwn } from "../utils/hasOwn.js";
import LanguageSelect from "../components/LanguageSelect";
import { tr, useLocale } from '../i18n';
import Field from "../components/Field";
import { useEffect, useId, useRef, useState } from "react";
import "../styles/settings.css";
import StatusScreen from "../components/StatusScreen";
import UtilityScreen from "../components/UtilityScreen";
import { openLegalPage } from "../config/legalLinks";
import TextSizeControl from "../components/TextSizeControl";
import LogOutFeedback from "../components/LogOutFeedback";
import usePasswordResetRequest from "../hooks/usePasswordResetRequest.js";
import { Capacitor } from "@capacitor/core";

const SUPPORT_EMAIL = "everwisedigitalliteracy@gmail.com";

function SettingsSection({ title, className, children, error }) {
  const headingId = useId();
  return (
    <section className={`settings-section ${className}`} aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <div className="settings-group">
        {children}
        {error ? <p className="settings-feedback text-alert" role="alert">{tr(error)}</p> : null}
      </div>
    </section>
  );
}

function Row({ label, value, onClick, hint, disabled = false, destructive = false, buttonRef, describedBy, busy }) {
  const hintId = useId();
  const interactive = typeof onClick === "function";
  const Comp = interactive ? "button" : "div";
  return (
    <Comp
      ref={buttonRef}
      type={interactive ? "button" : undefined}
      onClick={onClick}
      disabled={interactive ? disabled : undefined}
      aria-label={interactive ? label : undefined}
      aria-describedby={interactive ? [hint && hintId, describedBy].filter(Boolean).join(" ") || undefined : undefined}
      aria-busy={interactive && busy ? true : undefined}
      className={`settings-row ${value != null ? "has-row-value " : ""}${destructive ? "settings-row-destructive" : ""}`}
    >
      <span className="settings-row-copy">
        <span className="settings-row-label">{label}</span>
        {hint ? <span className="settings-row-hint" id={hintId}>{hint}</span> : null}
      </span>
      {value != null ? (
        <span className="settings-row-value">{value}</span>
      ) : interactive ? (
        <svg className="settings-chevron" width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
          <path d="m6 5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </Comp>
  );
}

const WEB_STATUSES = new Set([
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "paused",
  "trialing",
  "unpaid",
]);
const ACCESS_GRANTING_STATUSES = new Set(["active", "trialing"]);
const DEFAULT_PARTNER_NAME = "your community partner";
const BILLING_KEYS = [
  "provider",
  "status",
  "plan",
  "trialEndsAt",
  "currentPeriodEndsAt",
  "cancelAtPeriodEnd",
  "canManage",
  "busy",
  "error",
];
const SPONSOR_BILLING_KEYS = [...BILLING_KEYS, "partnerName"];

const unavailableBilling = (busy = false) => ({
  provider: "unavailable",
  status: "unavailable",
  plan: null,
  trialEndsAt: null,
  currentPeriodEndsAt: null,
  cancelAtPeriodEnd: false,
  canManage: false,
  busy,
});

function snapshotBillingRecord(value) {
  try {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    const expectedKeys = keys.includes("partnerName")
      ? SPONSOR_BILLING_KEYS
      : BILLING_KEYS;
    if (
      keys.length !== expectedKeys.length ||
      !expectedKeys.every((key) => keys.includes(key))
    ) {
      return null;
    }
    const snapshot = Object.create(null);
    for (const key of expectedKeys) {
      const descriptor = descriptors[key];
      if (!descriptor || !("value" in descriptor)) return null;
      snapshot[key] = descriptor.value;
    }
    return snapshot;
  } catch {
    return null;
  }
}

function canonicalTimestamp(value) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return undefined;
  const date = new Date(milliseconds);
  if (date.toISOString() !== value) return undefined;
  return value;
}

function formatBillingDate(value, locale, timeZone) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    ...(timeZone ? { timeZone } : {}),
    year: "numeric",
  }).format(new Date(value));
}

function formatCancellationInstant(value, locale, timeZone) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    ...(timeZone ? { timeZone } : {}),
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(value));
}

function trustedLegacyPartnerName(partner) {
  try {
    if (
      !partner ||
      typeof partner !== "object" ||
      Array.isArray(partner) ||
      Object.getPrototypeOf(partner) !== Object.prototype
    ) {
      return DEFAULT_PARTNER_NAME;
    }
    const descriptor = Object.getOwnPropertyDescriptor(partner, "name");
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "string") {
      return DEFAULT_PARTNER_NAME;
    }
    const name = descriptor.value.trim();
    return name || DEFAULT_PARTNER_NAME;
  } catch {
    return DEFAULT_PARTNER_NAME;
  }
}

function normalizeBillingViewModel(billing, legacy) {
  if (billing === undefined) {
    if (legacy.sponsored) {
      return {
        provider: "sponsor",
        status: "active",
        partnerName: trustedLegacyPartnerName(legacy.partner),
        busy: false,
      };
    }
    if (legacy.subscriptionStatus === "active") {
      return {
        provider: "apple",
        status: "active",
        plan: legacy.plan === "monthly" ? "monthly" : "annual",
        trialEndsAt: null,
        currentPeriodEndsAt: null,
        cancelAtPeriodEnd: false,
        canManage: true,
        busy: false,
      };
    }
    return {
      provider: "none",
      status: "none",
      plan: null,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
      canManage: false,
      busy: false,
    };
  }

  const snapshot = snapshotBillingRecord(billing);
  if (!snapshot || typeof snapshot.busy !== "boolean") {
    return unavailableBilling();
  }
  const busy = snapshot.busy;
  if (snapshot.provider === "unavailable" && snapshot.status === "unavailable") {
    if (
      snapshot.plan !== null ||
      snapshot.trialEndsAt !== null ||
      snapshot.currentPeriodEndsAt !== null ||
      snapshot.cancelAtPeriodEnd !== false ||
      snapshot.canManage !== false ||
      typeof snapshot.error !== "string"
    ) {
      return unavailableBilling(busy);
    }
    return unavailableBilling(busy);
  }
  if (snapshot.provider === "sponsor" && snapshot.status === "active") {
    if (
      !hasOwn(snapshot, "partnerName") ||
      snapshot.plan !== null ||
      snapshot.trialEndsAt !== null ||
      snapshot.currentPeriodEndsAt !== null ||
      snapshot.cancelAtPeriodEnd !== false ||
      snapshot.canManage !== false ||
      snapshot.error !== null
    ) {
      return unavailableBilling(busy);
    }
    return {
      provider: "sponsor",
      status: "active",
      partnerName:
        typeof snapshot.partnerName === "string" && snapshot.partnerName.trim()
          ? snapshot.partnerName.trim()
          : "your community partner",
      busy,
    };
  }
  if (snapshot.provider === "none" && snapshot.status === "none") {
    if (
      hasOwn(snapshot, "partnerName") ||
      snapshot.plan !== null ||
      snapshot.trialEndsAt !== null ||
      snapshot.currentPeriodEndsAt !== null ||
      snapshot.cancelAtPeriodEnd !== false ||
      snapshot.canManage !== false ||
      snapshot.error !== null
    ) {
      return unavailableBilling(busy);
    }
    return {
      provider: "none",
      status: "none",
      plan: null,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
      canManage: false,
      busy,
    };
  }
  if (
    hasOwn(snapshot, "partnerName") ||
    (snapshot.provider !== "stripe" && snapshot.provider !== "apple")
  ) {
    return unavailableBilling(busy);
  }
  if (
    !WEB_STATUSES.has(snapshot.status) ||
    (snapshot.plan !== "monthly" && snapshot.plan !== "annual") ||
    typeof snapshot.cancelAtPeriodEnd !== "boolean" ||
    typeof snapshot.canManage !== "boolean" ||
    snapshot.error !== null
  ) {
    return unavailableBilling(busy);
  }
  const trialEndsAt = canonicalTimestamp(snapshot.trialEndsAt);
  const currentPeriodEndsAt = canonicalTimestamp(snapshot.currentPeriodEndsAt);
  if (
    trialEndsAt === undefined ||
    currentPeriodEndsAt === undefined ||
    (snapshot.provider === "stripe" &&
      snapshot.status === "active" &&
      currentPeriodEndsAt === null) ||
    (snapshot.provider === "stripe" &&
      snapshot.status === "trialing" &&
      trialEndsAt === null) ||
    (snapshot.cancelAtPeriodEnd && currentPeriodEndsAt === null)
  ) {
    return unavailableBilling(busy);
  }
  return {
    provider: snapshot.provider,
    status: snapshot.status,
    plan: snapshot.plan,
    trialEndsAt,
    currentPeriodEndsAt,
    cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
    canManage: snapshot.canManage,
    busy,
  };
}

function billingStatusLabel(status) {
  const labels = {
    active: "Active",
    canceled: "Canceled",
    incomplete: "Incomplete",
    incomplete_expired: "Expired",
    past_due: "Past due",
    paused: "Paused",
    trialing: "Trial",
    unpaid: "Unpaid",
  };
  return labels[status] || "Unavailable";
}

function terminalReleaseMessage(terminal) {
  if (terminal === "cancellation") {
    return "We could not safely cancel the sponsored-place release. Please contact support so it can be reconciled without affecting your current account.";
  }
  if (terminal === "compensation") {
    return "We could not safely restore your saved profile after account deletion stopped. Please contact support before trying again.";
  }
  if (terminal === "storage-cleanup") {
    return "We could not safely clear the private deletion recovery record. Please contact support so it can be reconciled without exposing your information.";
  }
  if (terminal === "deletion-status") {
    return "We could not confirm whether Firebase deleted your account. The sponsored-place release is paused; please contact support before trying again.";
  }
  return "We cannot safely retry the sponsored-place release. Please contact support so we can reconcile it without risking your information.";
}

export function PartnerReleaseRecovery({ busy = false, terminal = null, onRetry }) {
  return (
    <StatusScreen
      title="Finishing account deletion"
      focusKey={terminal}
      description={terminal ? terminalReleaseMessage(terminal) : "Your account has been deleted, but we still need to finish releasing its sponsored place. Please retry so another learner can use it."}
      actions={terminal
        ? <a className="btn-primary" href={`mailto:${SUPPORT_EMAIL}`}>{tr("Contact support")}</a>
        : <button type="button" className="btn-primary" onClick={onRetry} disabled={busy} aria-busy={busy}>{busy ? "Retrying…" : tr("Retry")}</button>}
    />
  );
}

export function PartnerDeletionReconciliation({ reconciliation = "compensation" }) {
  return <StatusScreen title="Account deletion needs help" focusKey={reconciliation}
    description={terminalReleaseMessage(reconciliation)}
    actions={<a className="btn-primary" href={`mailto:${SUPPORT_EMAIL}`}>{tr("Contact support")}</a>} />;
}

export default function Settings({
  name = "",
  billing,
  billingLocale,
  billingTimeZone,
  sponsored = false,
  partner = null,
  subscriptionStatus,
  plan,
  onBack,
  onLogOut,
  logOutBusy = false,
  logOutSlow = false,
  logOutError = "",
  onOpenPaywall,
  onManageSubscription,
  onRetryBilling,
  onResetPassword,
  onDeleteAccount,
  textSize,
  onTextSizeChange,
}) {
  useLocale();
  const [error, setError] = useState("");
  const logOutFeedbackId = useId();
  const reset = usePasswordResetRequest(onResetPassword);
  const [busy, setBusy] = useState(false);
  const [billingActionBusy, setBillingActionBusy] = useState(false);
  const [billingActionError, setBillingActionError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const deleteButton = useRef(null);
  const deleteHeading = useRef(null);
  const deleteError = useRef(null);
  const wasConfirmingDelete = useRef(false);
  useEffect(() => {
    if (confirmingDelete) {
      const heading = deleteHeading.current;
      heading?.focus({preventScroll:true});
      const pane = heading?.closest(".settings-screen");
      // Put the explanation in view, rather than only the focused heading
      // at the bottom edge. Do not scroll the fixed application shell.
      if (pane) pane.scrollTop = Math.max(0, pane.scrollTop + heading.getBoundingClientRect().top - pane.getBoundingClientRect().top - 16);
    }
    else if (wasConfirmingDelete.current) deleteButton.current?.focus();
    wasConfirmingDelete.current = confirmingDelete;
  }, [confirmingDelete]);
  useEffect(() => {
    if (!confirmingDelete || !error || !deleteError.current) return;
    const message = deleteError.current;
    const reveal = () => {
      if (document.activeElement?.id === "delete-current-password") return;
      let owner = message.parentElement;
      while (owner && (!/^(auto|scroll)$/.test(getComputedStyle(owner).overflowY) || owner.scrollHeight <= owner.clientHeight)) owner = owner.parentElement;
      if (!owner || owner === document.body || owner === document.documentElement) owner = document.scrollingElement;
      if (!owner) return;
      const bounds = owner === document.scrollingElement ? {top: 0, bottom: innerHeight} : owner.getBoundingClientRect();
      const top = Math.max(0, bounds.top) + 16;
      const bottom = Math.min(innerHeight, bounds.bottom) - 16;
      const rect = message.getBoundingClientRect();
      if (rect.top >= top && rect.bottom <= bottom) return;
      const delta = rect.height > bottom - top || rect.top < top ? rect.top - top : rect.bottom - bottom;
      owner.scrollTop = Math.max(0, Math.min(owner.scrollHeight - owner.clientHeight, owner.scrollTop + delta));
    };
    reveal();
    // Font loading, rotation and keyboard dismissal can move the explanation
    // after it mounts. Reveal it again only if that layout change hides it.
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(reveal) : null;
    observer?.observe(message.closest(".settings-delete-confirmation"));
    window.addEventListener("resize", reveal);
    return () => { observer?.disconnect(); window.removeEventListener("resize", reveal); };
  }, [confirmingDelete, error]);

  const billingView = normalizeBillingViewModel(billing, {
    partner,
    plan,
    sponsored,
    subscriptionStatus,
  });
  const billingBusy = billingView.busy || billingActionBusy;
  const cancelsWebsiteSubscription = !Capacitor.isNativePlatform() && billingView.provider !== "sponsor";

  const runBillingAction = async (action) => {
    if (typeof action !== "function" || billingBusy) return;
    setBillingActionBusy(true);
    setBillingActionError("");
    try {
      await action();
    } catch {
      setBillingActionError("Billing management is temporarily unavailable.");
    } finally {
      setBillingActionBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    setBusy(true);
    setError("");
    reset.clear();
    const password = currentPassword;
    setCurrentPassword("");
    try {
      await onDeleteAccount?.(password);
    } catch (err) {
      setError(
        err.message ||
          "Your account could not be deleted. Log out, log back in, and try again.",
      );
      setBusy(false);
    }
  };

  return (
    <UtilityScreen onBack={onBack} navigationDisabled={busy}>
    <div className="settings-screen">
      <header className="settings-header">
        <h1>{tr("Settings")}</h1>
      </header>

      <div className="settings-grid">
        <div className="settings-profile">
          <span className="settings-avatar" aria-hidden="true">{name.trim().slice(0, 1).toUpperCase() || "E"}</span>
          <div><h2>{name.trim() || tr("Your account")}</h2><p>{tr("Your learning, at your pace.")}</p></div>
        </div>
        <SettingsSection title={tr("Language")}><LanguageSelect showContentNotice /></SettingsSection>
        <SettingsSection title={tr("Display")} className="settings-display">
          <div className="settings-row settings-text-size">
            <div className="min-w-0">
              <p className="settings-row-label">{tr("Text size")}</p>
              <p className="settings-row-hint">
                {Capacitor.isNativePlatform() ? tr("Follows your device text size. Adjust further here.") : tr("Applies everywhere in the app")}
              </p>
            </div>
            {onTextSizeChange ? (
              <TextSizeControl
                textSize={textSize}
                onTextSizeChange={onTextSizeChange}
                buttonClassName="h-12 w-12"
              />
            ) : null}
          </div>
        </SettingsSection>

        {billingView.provider === "sponsor" ? (
          <SettingsSection title={tr("Access")} className="settings-subscription" error={billingActionError}>
            <div className="settings-summary">
              <p className="text-xl font-semibold text-ink">{tr("Full access provided by")} {billingView.partnerName}
              </p>
              <p className="mt-1 text-lg text-ink-soft">{tr("No subscription or payment is required.")}</p>
            </div>
          </SettingsSection>
        ) : billingView.provider === "unavailable" ? (
          <SettingsSection title={tr("Subscription")} className="settings-subscription" error={billingActionError}>
            <p
              className={`settings-feedback ${billingBusy ? "text-ink-soft" : "text-alert"}`}
              role={billingBusy ? "status" : "alert"}
            >
              {billingBusy ? tr("Checking your subscription…") : tr("Billing is temporarily unavailable.")}
            </p>
            <Row
              label={tr("Retry")}
              hint={tr("Check subscription status again")}
              onClick={() => runBillingAction(onRetryBilling)}
              disabled={billingBusy}
            />
          </SettingsSection>
        ) : billingView.provider === "none" ? (
          <SettingsSection title={tr("Subscription")} className="settings-subscription" error={billingActionError}>
            <Row label={tr("Status")} value={tr("No subscription")} />
            <Row
              label={tr("View plans")}
              onClick={onOpenPaywall}
              hint={tr("Compare plans and pricing")}
              disabled={billingBusy}
            />
          </SettingsSection>
        ) : (
          <SettingsSection title={tr("Subscription")} className="settings-subscription" error={billingActionError}>
            <div className="settings-summary">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-xl font-semibold text-ink">{tr("Status")}</p>
                <p className="text-xl font-semibold text-clay">
                  {tr(billingStatusLabel(billingView.status))}
                </p>
              </div>
              <p className="mt-2 text-lg font-semibold text-ink">
                {billingView.plan === "monthly" ? tr("Monthly plan") : tr("Annual plan")}
              </p>
              {billingView.cancelAtPeriodEnd && ACCESS_GRANTING_STATUSES.has(billingView.status) ? (
                <p className="mt-1 text-lg text-ink-soft">{tr("Cancellation scheduled — access continues until")} {formatCancellationInstant(
                    billingView.currentPeriodEndsAt,
                    billingLocale,
                    billingTimeZone,
                  )}.
                </p>
              ) : billingView.cancelAtPeriodEnd ? (
                <p className="mt-1 text-lg text-ink-soft">{tr("Cancellation scheduled for")} {formatCancellationInstant(
                    billingView.currentPeriodEndsAt,
                    billingLocale,
                    billingTimeZone,
                  )}.
                </p>
              ) : billingView.status === "trialing" ? (
                <p className="mt-1 text-lg text-ink-soft">{tr("Trial ends")} {formatBillingDate(
                    billingView.trialEndsAt,
                    billingLocale,
                    billingTimeZone,
                  )}.
                </p>
              ) : billingView.status === "active" && billingView.currentPeriodEndsAt ? (
                <p className="mt-1 text-lg text-ink-soft">{tr("Renews")} {formatBillingDate(
                    billingView.currentPeriodEndsAt,
                    billingLocale,
                    billingTimeZone,
                  )}.
                </p>
              ) : null}
            </div>
            {billingView.canManage ? (
              <Row
                label={tr("Manage subscription")}
                onClick={() => runBillingAction(onManageSubscription)}
                disabled={billingBusy}
                hint={
                  billingView.provider === "apple"
                    ? tr("Manage your subscription in Apple subscription settings.")
                    : tr("Open the secure billing portal")
                }
              />
            ) : (
              <Row
                label={tr("View plans")}
                onClick={onOpenPaywall}
                hint={tr("Compare plans and pricing")}
                disabled={billingBusy}
              />
            )}
          </SettingsSection>
        )}

        <SettingsSection title={tr("Account")} className="settings-account">
        <div className="settings-logout-row">
          <Row label={tr("Log out")} onClick={onLogOut} disabled={busy || logOutBusy} busy={logOutBusy}
            describedBy={logOutBusy || logOutError ? logOutFeedbackId : undefined} />
          <LogOutFeedback id={logOutFeedbackId} busy={logOutBusy} slow={logOutSlow} error={logOutError} />
        </div>
        {typeof onResetPassword === "function" ? (
          <div className="settings-reset-row">
            <Row
              label={tr("Reset password")}
              hint={reset.busy ? tr("Requesting reset…") : tr("Send a secure reset link to your email")}
              onClick={() => { setError(""); void reset.run(); }}
              disabled={busy || reset.busy || logOutBusy}
            />
            {reset.busy && <p className="mt-3 text-lg text-ink-soft" role="status">{tr("Requesting a reset email… You can leave this screen while it sends.")}</p>}
            {reset.sent && <p className="mt-3 text-lg text-sage-dark" role="status">{tr("If an account uses your email address, you’ll receive a reset link. Check your inbox and spam folder.")}</p>}
            {reset.error && <p className="mt-3 text-lg font-semibold text-alert" role="alert">{reset.error}</p>}
          </div>
        ) : null}
        <Row
          label={tr("Contact support")}
          hint={SUPPORT_EMAIL}
          onClick={() => {
            window.location.href = `mailto:${SUPPORT_EMAIL}`;
          }}
        />

        {!confirmingDelete ? (
          <Row
            label={tr("Delete account")}
            destructive
            buttonRef={deleteButton}
            hint={tr("Permanently remove your account and saved progress")}
            onClick={() => {
              setError("");
              setConfirmingDelete(true);
            }}
            disabled={busy || reset.busy || logOutBusy}
          />
        ) : (
          <div className="settings-delete-confirmation">
            <h3 ref={deleteHeading} tabIndex={-1} className="text-xl font-bold text-ink">{tr("Delete your account?")}</h3>
            <p className="mt-2 text-lg leading-snug text-ink-soft">{tr("This permanently deletes your account, progress, and badges.")}{" "}{tr("This cannot be undone.")}</p>
            <div className="settings-delete-billing">
              <h4>{tr("Before you delete")}</h4>
              <p>{tr("If you subscribed through Apple, cancel that subscription first.")}{" "}{tr("Deleting your account does not stop Apple billing.")}</p>
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => window.open("https://apps.apple.com/account/subscriptions", "_blank", "noopener,noreferrer")}
              >{tr("Open Apple billing")}</button>
              <p>
                {cancelsWebsiteSubscription
                  ? tr("Any subscription bought on our website is cancelled before deletion. If cancellation fails, your account is kept.")
                  : tr("If you subscribed on our website, cancel in EverWise web Settings before deleting your account here.")}
              </p>
            </div>
            <div className="mt-4">
              <Field
                id="delete-current-password"
                label={tr("Current password")}
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                describedBy="delete-password-hint"
                disabled={busy}
              />
              <p id="delete-password-hint" className="mt-2 text-base text-ink-soft">{tr("Enter your current password to confirm it is you.")}</p>
            </div>
            <div className="settings-delete-actions">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => {
                  setCurrentPassword("");
                  setConfirmingDelete(false);
                }}
                disabled={busy}
              >{tr("Cancel")}</button>
              <button
                type="button"
                className="btn-primary settings-delete-button"
                onClick={handleDeleteAccount}
                disabled={busy || reset.busy || logOutBusy || !currentPassword}
              >
                {busy ? tr("Deleting…") : tr("Yes, delete")}
              </button>
            </div>
            {error ? <p ref={deleteError} className="mt-4 text-alert" role="alert">{tr(error)}</p> : null}
          </div>
        )}
        </SettingsSection>

        <SettingsSection title={tr("Legal")} className="settings-legal">
        <Row
          label={tr("Privacy Policy")}
          onClick={() => openLegalPage("privacy")}
        />
        <Row
          label={tr("Terms of Service")}
          onClick={() => openLegalPage("terms")}
        />
        </SettingsSection>
      </div>

    </div>
    </UtilityScreen>
  );
}
