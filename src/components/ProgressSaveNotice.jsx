export default function ProgressSaveNotice({status, onRetry}) {
  if (!status?.pending) return null;
  return (
    <div className="max-h-[40%] shrink-0 overflow-y-auto border-b border-clay/20 bg-cream-card px-5 py-3 text-lg text-ink" role="status" data-testid="progress-save-notice">
      <p>{status.saving ? "Saving your progress…" : status.durable
        ? "Your progress is saved on this device and waiting to sync."
        : "Your progress hasn’t synced. Keep this app open and retry."}</p>
      {!status.saving && <button type="button" className="mt-1 min-h-11 font-bold text-clay underline underline-offset-4" onClick={onRetry}>Retry saving progress</button>}
    </div>
  );
}
