import { useEffect, useRef, useState } from "react";
import { authErrorMessage } from "../utils/authErrors.js";

// A deadline changes the UI's certainty, not whether Firebase can still send
// the email. Ignore late results and explain that delivery may still happen.
export default function usePasswordResetRequest(send) {
  const [state, setState] = useState({ busy: false, sent: false, error: "" });
  const pending = useRef(null);
  useEffect(() => () => {
    pending.current?.cancel();
    pending.current = null;
  }, []);

  const run = async (...args) => {
    if (pending.current) return;
    let timer, cancel;
    const deadline = new Promise((_, reject) => {
      timer = window.setTimeout(() => reject({ code: "recovery/timeout" }), 20_000);
      cancel = () => { window.clearTimeout(timer); reject({ code: "recovery/cancelled" }); };
    });
    const attempt = { cancel };
    pending.current = attempt;
    setState({ busy: true, sent: false, error: "" });
    try {
      await Promise.race([Promise.resolve().then(() => {
        if (pending.current !== attempt) throw { code: "recovery/cancelled" };
        return send(...args);
      }), deadline]);
      if (pending.current === attempt) setState({ busy: false, sent: true, error: "" });
    } catch (failure) {
      if (pending.current === attempt) setState({ busy: false, sent: false, error:
        failure?.code === "recovery/timeout"
          ? "We haven’t received a response yet. A reset email may still arrive. Check your inbox before trying again."
          : authErrorMessage(failure),
      });
    } finally {
      window.clearTimeout(timer);
      if (pending.current === attempt) pending.current = null;
    }
  };
  return { ...state, run, clear: () => setState(current => ({ ...current, error: "", sent: false })) };
}
