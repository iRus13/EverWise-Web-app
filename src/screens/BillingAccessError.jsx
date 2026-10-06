import { tr, useLocale } from '../i18n';
import StatusScreen from "../components/StatusScreen";

export default function BillingAccessError({ kind = "temporary", onRetry, onBack }) {
  useLocale();
  const temporary = kind === "temporary";
  return (
    <StatusScreen
      label={tr("Subscription")}
      title={temporary ? tr("We could not verify your subscription") : tr("Your subscription is not active")}
      description={temporary
        ? tr("Access could not be checked right now. Please retry when you are ready.")
        : tr("Choose a plan to continue unfinished lessons, or return home.")}
      actions={<>
        {onRetry && <button type="button" className="btn-primary" onClick={onRetry}>{tr("Retry")}</button>}
        {onBack && <button type="button" className="btn-secondary" onClick={onBack}>{tr("Back to home")}</button>}
      </>}
    />
  );
}
