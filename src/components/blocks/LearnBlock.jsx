import {useLearningText} from "../../i18n/learning.js";
import ReadAloud from "../ReadAloud";
import BlockShell from "./BlockShell";

export default function LearnBlock({ block, progress, progressTotal, onContinue, onBack, onExit }) {
  const t = useLearningText();
  const paragraphs = t(block.text || "").split(/\n\s*\n/).filter(part => part.trim());
  // This authored example has four named turns. Keep an ordinary paragraph
  // fallback if an edited or translated passage no longer matches that format.
  const turns = block.heading === "Example Conversation"
    ? paragraphs.map(paragraph => paragraph.match(/^(You|Tú|ChatGPT):\s*(.+)$/s)) : [];
  const isConversation = turns.length > 1 && turns.every(Boolean);
  const speakParts = [
    block.heading,
    block.text,
    ...(block.bullets || []),
    block.footer,
  ].filter(Boolean).map(part => t(part));

  return (
    <BlockShell
      label="Learn"
      progress={progress}
      progressTotal={progressTotal}
      onBack={onBack}
      onExit={onExit}
      onSkip={onContinue}
      footer={
        <button className="btn-primary" onClick={onContinue}>
          {t("Continue")}
        </button>
      }
    >
      <div className="lesson-reading">
        {block.heading && (
          <h1 className="page-title">
            {t(block.heading)}
          </h1>
        )}
        <div className="lesson-audio"><ReadAloud text={speakParts.join(". ")} /></div>
        {isConversation ? (
          <ol className="lesson-conversation" role="list" aria-label={t(block.heading)}>
            {turns.map(([,speaker,message],index) => <li key={index} className={speaker === "ChatGPT" ? "conversation-reply" : "conversation-prompt"}>
              <p className="conversation-speaker">{speaker}</p>
              <p className="conversation-message">{message}</p>
            </li>)}
          </ol>
        ) : block.text && (
          paragraphs.map((paragraph, index) => (
            <p key={index} className="mt-5 whitespace-pre-line text-2xl leading-relaxed text-ink-soft">{paragraph}</p>
          ))
        )}
        {block.bullets?.length > 0 && (
          <ul className="lesson-reading-list">
            {block.bullets.map((item) => (
              <li
                key={item}
                className="text-xl leading-relaxed text-ink"
              >
                {t(item)}
              </li>
            ))}
          </ul>
        )}
        {block.footer && (
          <p className="mt-6 text-xl font-semibold leading-relaxed text-ink">
            {t(block.footer)}
          </p>
        )}
      </div>
    </BlockShell>
  );
}
