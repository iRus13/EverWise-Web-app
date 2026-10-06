import { tr, useLocale } from '../i18n';
import StatusScreen from "../components/StatusScreen";

export default function BillingConfirmation({ phase = "checking", onRetry, onManageBilling, onBack }) {
  useLocale();
  const timedOut = phase === "timeout";
  return (
    <StatusScreen
      regionLabel="Subscription confirmation status"
      label={tr("Subscription")}
      title={timedOut ? tr("Access is still being confirmed") : tr("Confirming your access")}
      description={timedOut
        ? tr("We still could not confirm your access. You can retry, manage billing, or return home.")
        : tr("Checking your access now. This can take a few moments.")}
      progressLabel={timedOut ? undefined : "Verification in progress…"}
      actions={<>
        {timedOut && onRetry && <button type="button" className="btn-primary" onClick={onRetry}>{tr("Retry")}</button>}
        {timedOut && onManageBilling && <button type="button" className="btn-secondary" onClick={onManageBilling}>Manage billing</button>}
        {onBack && <button type="button" className="btn-secondary" onClick={onBack}>{tr("Back to home")}</button>}
      </>}
    />
  );
}
