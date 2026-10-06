import { hasOwn } from "../utils/hasOwn.js";
import { useEffect, useState } from "react";
import { tr, useLocale } from "../i18n";
import StatusScreen from "./StatusScreen.jsx";

const titles = {
  lesson: ["Opening your lesson", "Your lesson couldn’t load"],
  challenge: ["Opening your practice", "Your practice couldn’t load"],
  exam: ["Opening your exam", "Your exam couldn’t load"],
  complete: ["Opening your summary", "Your summary couldn’t load"],
};

const loadLearningScreens = () => import("../screens/learningScreens.jsx");

export default function LearningContent({ kind, itemId, onBack, load = loadLearningScreens, ...props }) {
  useLocale();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setResult(null);
    const timer = window.setTimeout(() => {
      if (current) setResult({ error: true, kind, itemId });
      current = false;
    }, 15_000);
    Promise.resolve().then(load).then(module => module.learningItem(kind, itemId)).then(({item, Player}) => {
      if (current) setResult({ item, Player, kind, itemId });
    }).catch(() => {
      if (current) setResult({ error: true, kind, itemId });
    }).finally(() => window.clearTimeout(timer));
    return () => { current = false; window.clearTimeout(timer); };
  }, [kind, itemId, attempt, load]);

  const ready = result?.kind === kind && result?.itemId === itemId ? result : null;
  if (ready && !ready.error) {
    const { Player, item } = ready;
    return <Player {...props} {...{[kind === "complete" ? "lesson" : kind]: item}} onBack={onBack} />;
  }
  return (
    <StatusScreen
      title={tr((hasOwn(titles, kind) ? titles[kind] : titles.lesson)[ready?.error ? 1 : 0])}
      progressLabel={ready?.error ? undefined : tr(kind === "complete" ? "Getting your summary ready…" : "Getting your next activity ready…")}
      focusKey={`${kind}:${itemId}:${attempt}`}
      actions={<>
        {ready?.error && <button type="button" className="btn-primary" onClick={() => setAttempt(value => value + 1)}>{tr("Try again")}</button>}
        <button type="button" className="btn-secondary" onClick={onBack}>{tr("Back to your path")}</button>
        {ready?.error && <button type="button" className="status-reload-link" onClick={() => window.location.reload()}>{tr("Reload app")}</button>}
      </>}
    >
      {ready?.error && <p role="alert" className="status-description">{tr(kind === "complete" ? "Your lesson is complete. Try opening the summary again, or return to your path." : "Check your connection and try again, or return to your path.")}</p>}
    </StatusScreen>
  );
}
