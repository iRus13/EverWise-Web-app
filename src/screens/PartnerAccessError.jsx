import StatusScreen from "../components/StatusScreen";
import {useId} from "react";
import LogOutFeedback from "../components/LogOutFeedback";

const SUPPORT_EMAIL = "everwisedigitalliteracy@gmail.com";

function messageFor(code, partnerName) {
  const name = partnerName?.trim() || "the organization that shared this link";
  if (code === "INVALID_INVITE") {
    return "This access link is not available. Ask the volunteer or organization that shared it for a new link.";
  }
  if (code === "PARTNER_FULL") {
    return `All sponsored places are currently in use. Please contact ${name} for help.`;
  }
  if (code === "PARTNER_SUSPENDED") {
    return `Sponsored access from ${name} is temporarily unavailable. Please contact ${name} for help.`;
  }
  if (code === "PARTNER_ACCESS_UNCONFIRMED") {
    return "We cannot confirm your sponsored access right now. Your account and progress are safe. Please try again or log out.";
  }
  if (code === "PARTNER_PROFILE_INCOMPLETE") {
    return "Your free place is confirmed, but we could not finish saving your profile. Retry to continue without claiming another place.";
  }
  if (code === "PARTNER_PROFILE_MISSING") {
    return "Your sponsored access is active, but your personal profile still needs to be completed. You can retake the short assessment without creating another account.";
  }
  if (code === "ACCOUNT_PROFILE_UNAVAILABLE") {
    return "We could not load your account right now. Please try again or log out.";
  }
  if (code === "PARTNER_CLEANUP_INCOMPLETE") {
    return "We could not safely finish cleaning up your new account. Do not create another account. Try to log out, then contact support for help.";
  }
  return "Sponsored access is temporarily unavailable. Your answers are still here. Please try again.";
}

export default function PartnerAccessError({
  code,
  partnerName,
  onRetry,
  retryLabel = "Retry",
  onLogOut,
  logOutLabel = "Log out",
  showSupport = false,
  retryBusy = false,
  logOutBusy = false,
  logOutSlow = false,
  logOutError = "",
}) {
  const logOutFeedbackId = useId();
  const canRetry =
    (code === "PARTNER_UNAVAILABLE" ||
      code === "PARTNER_ACCESS_UNCONFIRMED" ||
      code === "PARTNER_PROFILE_INCOMPLETE" ||
      code === "PARTNER_PROFILE_MISSING" ||
      code === "ACCOUNT_PROFILE_UNAVAILABLE") &&
    typeof onRetry === "function";
  const heading =
    code === "ACCOUNT_PROFILE_UNAVAILABLE" ? "Your account" :
      code === "PARTNER_CLEANUP_INCOMPLETE" ? "Account setup" : "Sponsored access";

  return (
    <StatusScreen
      title={heading}
      description={messageFor(code, partnerName)}
      focusKey={code}
      actions={<>
        {canRetry && <button type="button" className="btn-primary" onClick={onRetry} disabled={retryBusy || logOutBusy} aria-busy={retryBusy}>{retryLabel}</button>}
        {typeof onLogOut === "function" && <button type="button" className={canRetry ? "btn-secondary" : "btn-primary"} onClick={onLogOut} disabled={logOutBusy} aria-busy={logOutBusy} aria-describedby={logOutBusy || logOutError ? logOutFeedbackId : undefined}>{logOutLabel}</button>}
        {showSupport && <a className="btn-secondary" href={`mailto:${SUPPORT_EMAIL}`}>Contact support</a>}
      </>}
    >
      <LogOutFeedback id={logOutFeedbackId} busy={logOutBusy} slow={logOutSlow} error={logOutError} />
    </StatusScreen>
  );
}
