import { useEffect, useState } from "react";
import StatusScreen from "../components/StatusScreen";

const reloadApp = () => window.location.reload();

export default function Loading({ allowReload = true, onReload = reloadApp }) {
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
      title="Learn with confidence."
      progressLabel="Starting Everwise"
      focusHeading={false}
      description={showRecovery ? "This is taking longer than usual. Check your connection, then reload the app." : undefined}
      actions={showRecovery ? <button type="button" className="btn-primary startup-retry" onClick={onReload}>Try again</button> : undefined}
    />
  );
}
