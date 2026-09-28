import StatusScreen from "../components/StatusScreen";

export default function BillingConfirmation({ phase = "checking", onRetry, onManageBilling, onBack }) {
  const timedOut = phase === "timeout";
  return (
    <StatusScreen
      regionLabel="Subscription confirmation status"
      label="Subscription"
      title={timedOut ? "Access is still being confirmed" : "Confirming your access"}
      description={timedOut
        ? "We still could not confirm your access. You can retry, manage billing, or return home."
        : "Checking your access now. This can take a few moments."}
      progressLabel={timedOut ? undefined : "Verification in progress…"}
      actions={<>
        {timedOut && onRetry && <button type="button" className="btn-primary" onClick={onRetry}>Retry</button>}
        {timedOut && onManageBilling && <button type="button" className="btn-secondary" onClick={onManageBilling}>Manage billing</button>}
        {onBack && <button type="button" className="btn-secondary" onClick={onBack}>Back to home</button>}
      </>}
    />
  );
}
