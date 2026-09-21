import { useState } from "react";
import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";

// Builder: pick one item from each column; selections combine into one string.
export default function BuilderBlock({
  block,
  progress,
  progressTotal,
  onContinue,
  onBack,
  onExit,
}) {
  const columns = block.columns || [];
  // selection per column index
  const [picks, setPicks] = useState(() => columns.map(() => null));
  const [revealed, setRevealed] = useState(false);

  const allPicked = picks.every((p) => p != null);
  const combined = picks.filter(Boolean).join("");

  const pick = (colIndex, item) => {
    if (revealed) return;
    setPicks((prev) => {
      const next = [...prev];
      next[colIndex] = item;
      return next;
    });
  };

  return (
    <BlockShell
      label={block.title || "Build"}
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={onContinue}
      revealKey={revealed ? "revealed" : null}
      footer={
        revealed ? (
          <button className="btn-primary" onClick={onContinue}>
            Continue
          </button>
        ) : (
          <button
            className="btn-primary"
            disabled={!allPicked}
            onClick={() => setRevealed(true)}
          >
            Continue
          </button>
        )
      }
    >
      <h1 className="page-title">
        {block.title || "Build"}
      </h1>
      {block.prompt && (
        <p className="mt-3 text-xl leading-relaxed text-ink-soft">{block.prompt}</p>
      )}
      <div className="mt-4">
        <ReadAloud text={`${block.title || ""}. ${block.prompt || ""}`} />
      </div>

      {/* Stack on narrow screens so every choice remains readable and reachable. */}
      <div className="builder-columns mt-8 grid shrink-0 gap-3 pb-2">
        {columns.map((col, ci) => (
          <div key={col.label} className="min-w-0">
            <p className="mb-3 text-center text-base font-bold uppercase tracking-wide text-ink-faint">
              {col.label}
            </p>
            <div className="space-y-2">
              {col.items.map((item) => {
                const active = picks[ci] === item;
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={revealed}
                    onClick={() => pick(ci, item)}
                    className={`w-full rounded-2xl border-2 px-3 py-4 text-center text-lg font-semibold ${
                      active
                        ? "border-clay bg-clay/10 text-ink"
                        : "border-ink/15 bg-cream-card text-ink hover:border-clay/50"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Combined result */}
      <div className="mt-8 rounded-3xl bg-cream-card px-5 py-5 shadow-card">
        <p className="text-base font-bold uppercase tracking-wide text-ink-faint">
          Your password
        </p>
        <p className="mt-2 break-all font-sans text-3xl font-semibold text-ink">
          {combined || "—"}
        </p>
        {block.example && (
          <p className="mt-3 text-lg text-ink-soft">
            Example: <span className="font-semibold text-ink">{block.example}</span>
          </p>
        )}
      </div>

      {revealed && block.feedback && (
        <p className="mt-6 rounded-3xl bg-sage/15 px-5 py-5 text-xl leading-relaxed text-ink">
          {block.feedback}
        </p>
      )}
    </BlockShell>
  );
}
