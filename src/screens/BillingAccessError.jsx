import StatusScreen from "../components/StatusScreen";

export default function BillingAccessError({ kind = "temporary", onRetry, onBack }) {
  const temporary = kind === "temporary";
  return (
    <StatusScreen
      label="Subscription"
      title={temporary ? "We could not verify your subscription" : "Your subscription is not active"}
      description={temporary
        ? "Access could not be checked right now. Please retry when you are ready."
        : "Choose a plan to continue unfinished lessons, or return home."}
      actions={<>
        {onRetry && <button type="button" className="btn-primary" onClick={onRetry}>Retry</button>}
        {onBack && <button type="button" className="btn-secondary" onClick={onBack}>Back to home</button>}
      </>}
    />
  );
}
