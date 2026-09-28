import {useEffect, useRef} from "react";
import "../styles/logout-feedback.css";

export default function LogOutFeedback({id, busy, slow, error}) {
  const message = useRef(null);
  useEffect(() => {
    if (error || slow) message.current?.scrollIntoView?.({block:"nearest"});
  }, [error, slow]);
  if (!busy && !error) return null;
  return <p id={id} ref={message} role={error ? "alert" : "status"}
    className={`logout-feedback${error ? " logout-feedback-error" : ""}`}>
    {error || (slow
      ? "Logout is taking longer than usual. We’re still waiting for a response."
      : "Logging out…")}
  </p>;
}
