import { tr, useLocale } from '../i18n';
import { useEffect, useState } from "react";
import StatusScreen from "../components/StatusScreen";

const reloadApp = () => window.location.reload();

export default function Loading({ allowReload = true, onReload = reloadApp }) {
  useLocale();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!allowReload) return;
    const timer = window.setTimeout(() => setSlow(true), 15_000);
    return () => window.clearTimeout(timer);
  }, [allowReload]);
  const showRecovery = allowReload && slow;
  return (
    <StatusScreen
      title={tr("Learn with confidence.")}
      progressLabel={tr("Starting Everwise")}
      focusHeading={false}
      description={showRecovery ? tr("This is taking longer than usual. Check your connection, then reload the app.") : undefined}
      actions={showRecovery ? <button type="button" className="btn-primary startup-retry" onClick={onReload}>{tr("Try again")}</button> : undefined}
    />
  );
}
