import { useEffect, useState } from "react";

const loadLearningScreens = () => import("../screens/learningScreens.jsx");

export default function LearningContent({ kind, itemId, onBack, load = loadLearningScreens, ...props }) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setResult(null);
    const timer = window.setTimeout(() => {
      if (current) setResult({ error: true, kind, itemId });
      current = false;
    }, 15_000);
    Promise.resolve().then(load).then(module => {
      const { item, Player } = module.learningItem(kind, itemId);
      if (current) setResult({ item, Player, kind, itemId });
    }).catch(() => {
      if (current) setResult({ error: true, kind, itemId });
    }).finally(() => window.clearTimeout(timer));
    return () => { current = false; window.clearTimeout(timer); };
  }, [kind, itemId, attempt, load]);

  const ready = result?.kind === kind && result?.itemId === itemId ? result : null;
  if (ready && !ready.error) {
    const { Player, item } = ready;
    return <Player {...props} {...{[kind]: item}} onBack={onBack} />;
  }
  return (
    <section className="learning-focus flex flex-1 flex-col items-center justify-center gap-6 px-7 text-center">
      <h1 className="page-title">{ready?.error ? "Your lesson couldn’t load" : "Opening your lesson"}</h1>
      <p role={ready?.error ? "alert" : "status"} className="text-xl text-ink-soft">
        {ready?.error ? "Check your connection and try again, or return to your path." : "Getting your next activity ready…"}
      </p>
      {ready?.error && <button className="btn-primary" onClick={() => setAttempt(value => value + 1)}>Try again</button>}
      {ready?.error && <button className="btn-secondary" onClick={() => window.location.reload()}>Reload app</button>}
      <button className="btn-secondary" onClick={onBack}>Back to your path</button>
    </section>
  );
}
