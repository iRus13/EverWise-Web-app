import { tr, useLocale } from '../i18n';
import { useEffect, useMemo, useRef, useState } from "react";
import UtilityScreen from "../components/UtilityScreen";
import ReadAloud from "../components/ReadAloud";
import "../styles/scam-checker.css";
import { apiEndpoint } from "../utils/apiEndpoint";

const CHECK_MESSAGE_ENDPOINT = apiEndpoint("/api/check-message");
const MAX_MESSAGE_LENGTH = 6000;
const RESULT_SAFETY_REMINDER = "Never use a link, phone number, or contact detail from a suspicious message. Find the organization’s official website, app, card, or statement yourself.";

const verdictDetails = {
  likely_scam: {
    eyebrow: "High risk",
    title: "This is likely a scam",
    className: "scam-risk-high",
  },
  uncertain: {
    eyebrow: "Be careful",
    title: "Uncertain — verify before acting",
    className: "scam-risk-uncertain",
  },
  likely_legitimate: {
    eyebrow: "Lower risk",
    title: "Likely legitimate — still verify sensitive requests",
    className: "scam-risk-lower",
  },
};

function validAssessment(value) {
  return value && Object.hasOwn(verdictDetails, value.verdict)
    && typeof value.summary === "string" && value.summary.trim().length > 0
    && value.summary.length <= 6000
    && [value.warning_signs, value.next_steps].every((items) => Array.isArray(items)
      && items.length <= 20 && items.every((item) => typeof item === "string" && item.length <= 6000))
    && (value.urgent_action === null || (typeof value.urgent_action === "string" && value.urgent_action.length <= 6000));
}

function ResultSection({ title, items, ordered = false }) {
  if (!items?.length) return null;
  const List = ordered ? "ol" : "ul";
  return (
    <section className="scam-result-section">
      <h3>{title}</h3>
      <List>{items.map((item, index) => <li key={index}>{item}</li>)}</List>
    </section>
  );
}

export default function ScamChecker({ onBack }) {
  useLocale();
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const requestRef = useRef(null);
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);
  const resultRef = useRef(null);
  const errorRef = useRef(null);
  const returnToInputRef = useRef(false);
  const [notice, setNotice] = useState("");
  useEffect(() => () => {
    const controller = requestRef.current;
    requestRef.current = null;
    clearTimeout(timeoutRef.current);
    controller?.abort();
  }, []);
  useEffect(() => {
    const target = status === "success" ? resultRef.current
      : status === "error" ? errorRef.current
      : returnToInputRef.current ? inputRef.current : null;
    if (!target) return;
    returnToInputRef.current = false;
    target.focus({ preventScroll: true });
    const reveal = status === "success" ? target.closest(".scam-verdict") : target;
    reveal.scrollIntoView?.({ block: "start", behavior: "auto" });
  }, [status, result]);
  const cleanMessage = message.trim();
  const details = result ? verdictDetails[result.verdict] : null;

  const readAloudText = useMemo(() => {
    if (!result || !details) return "";
    const urgentAction = result.urgent_action ? `Act now: ${result.urgent_action}` : "";
    const warningSigns = result.warning_signs?.length
      ? `Warning signs: ${result.warning_signs.join(". ")}.`
      : "";
    const nextSteps = result.next_steps?.length
      ? `What to do next: ${result.next_steps.join(". ")}.`
      : "";
    return [`${tr(details.title)}.`, result.summary, urgentAction, warningSigns, nextSteps, RESULT_SAFETY_REMINDER]
      .filter(Boolean).join(" ");
  }, [details, result]);

  const checkMessage = async (event) => {
    event.preventDefault();
    if (!cleanMessage || cleanMessage.length > MAX_MESSAGE_LENGTH || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    timeoutRef.current = setTimeout(() => {
      if (requestRef.current !== controller) return;
      // Release ownership before aborting: a late response cannot replace a
      // newer check, even if the transport ignores the cancellation signal.
      requestRef.current = null;
      controller.abort();
      setError("This check took too long. Try again, or verify the message another way. Do not click links, send money, or share a code until you verify it.");
      setStatus("error");
    }, 30_000);

    setNotice("");
    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const response = await fetch(CHECK_MESSAGE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanMessage }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error(
          "[Everwise][scam-checker] Request failed:",
          response.status,
        );
        throw new Error(
          response.status === 503 ? "not_configured" : "unavailable",
        );
      }

      const nextResult = await response.json();
      if (!validAssessment(nextResult)) {
        throw new Error("unavailable");
      }

      if (requestRef.current !== controller || controller.signal.aborted) return;
      setResult(nextResult);
      setStatus("success");
    } catch (err) {
      if (requestRef.current !== controller || controller.signal.aborted) return;
      console.error("[Everwise][scam-checker]", err);
      setError(
        err.message === "not_configured"
          ? "Scam Checker is currently unavailable. Do not click links, send money, or share a code until you verify this message another way."
          : "We could not check this message right now. Do not click links, send money, or share a code until you verify it another way.",
      );
      setStatus("error");
    } finally {
      if (requestRef.current === controller) {
        clearTimeout(timeoutRef.current);
        requestRef.current = null;
      }
    }
  };

  const returnToMessage = (clear = false) => {
    if (clear) setMessage("");
    returnToInputRef.current = true;
    setResult(null);
    setError("");
    setNotice("");
    setStatus("idle");
  };

  const cancelCheck = () => {
    const controller = requestRef.current;
    requestRef.current = null;
    clearTimeout(timeoutRef.current);
    controller?.abort();
    returnToInputRef.current = true;
    setStatus("idle");
    setNotice("Check stopped. Your message is still here.");
  };

  return (
    <UtilityScreen onBack={onBack}>
    <div className="scam-checker-screen">
      <div className="scam-checker-content">
        <header className="scam-header">
          <p className="scam-eyebrow">{tr("PAUSE. CHECK. DECIDE.")}</p>
          <h1>{tr("Scam checker")}</h1>
          <p>{tr("Get a second opinion on a text, email, or social media message.")}</p>
        </header>

        {status !== "success" ? (
          <form className="scam-form" onSubmit={checkMessage}>
            <div data-form-field>
              <label htmlFor="message-to-check">{tr("Message to check")}</label>
              <p id="message-help" className="scam-help">{tr("Remove passwords, verification codes, and account numbers before pasting.")}</p>
              <textarea
                ref={inputRef}
                id="message-to-check"
                aria-describedby="message-help message-count message-privacy"
                disabled={status === "loading"}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={6}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={tr("Paste the message here…")}
              />
              <p id="message-count" className="scam-count">{message.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()} {tr("characters")}</p>
            </div>
            <p id="message-privacy" className="scam-help">{tr("When you choose Check this message, the text is sent to our AI provider to generate a result. This is a second opinion, not a guarantee.")}</p>

            {error && <div ref={errorRef} tabIndex={-1} className="scam-error" role="alert">{tr(error)}</div>}
            <div className="scam-actions">
              <button type="submit" disabled={!cleanMessage || status === "loading"} className="btn-primary">
                {status === "loading" ? tr("Checking message…") : tr("Check this message")}
              </button>
              {status === "loading" && <button type="button" className="btn-secondary" onClick={cancelCheck}>{tr("Cancel check")}</button>}
            </div>
            <p role="status" className="scam-status">{status === "loading" ? tr("Checking your message. This can take up to 30 seconds.") : tr(notice)}</p>
          </form>
        ) : (
          <div className="scam-result">
            <section className={`scam-verdict ${details.className}`}>
              <p className="scam-risk-label">{tr(details.eyebrow)}</p>
              <h2 ref={resultRef} tabIndex={-1}>{tr(details.title)}</h2>
              <p>{result.summary}</p>
            </section>
            <ReadAloud text={readAloudText} label={tr("Read this result aloud")} />
            {result.urgent_action && <section className="scam-urgent"><h3>{tr("Act now")}</h3><p>{result.urgent_action}</p></section>}
            <ResultSection title={tr("Warning signs")} items={result.warning_signs} />
            <ResultSection title={tr("What to do next")} items={result.next_steps} ordered />
            <p className="scam-safety">{tr(RESULT_SAFETY_REMINDER)}</p>
            <div className="scam-actions">
              <button type="button" className="btn-primary" onClick={() => returnToMessage(true)}>{tr("Check another message")}</button>
              <button type="button" className="btn-secondary" onClick={() => returnToMessage()}>{tr("Edit this message")}</button>
            </div>
          </div>
        )}

        {status !== "success" && <aside className="scam-safety">
          <h2>{tr("Verify before acting")}</h2>
          <p>{tr("Do not use links or phone numbers from a suspicious message. Contact the organization through its official website, app, card, or statement.")}</p>
        </aside>}
      </div>
    </div>
    </UtilityScreen>
  );
}
