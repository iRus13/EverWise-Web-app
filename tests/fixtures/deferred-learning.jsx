// Isolated real player/loader. No account, progress writes or billing callbacks.
import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import "../../src/index.css";
import AppShell from "../../src/components/AppShell.jsx";
import LearningContent from "../../src/components/LearningContent.jsx";
import {setLocale} from "../../src/i18n";
const query = new URLSearchParams(location.search);
const kind = query.get("kind") || "lesson";
const itemId = query.get("item") || "welcome";
const textSize = query.get("textSize") || "size-2";
document.documentElement.dataset.textSize = textSize;
setLocale(query.get("language") === "es" ? "es" : "en");
let attempts = 0;
const load = () => {
  attempts += 1;
  if(query.get("scenario") === "loading") return new Promise(() => {});
  if(query.get("scenario") === "error" && attempts === 1) return Promise.reject(new Error("Synthetic offline failure"));
  return import("../../src/screens/learningScreens.jsx");
};
export function Review() {
  const [outcome, setOutcome] = useState("");
  return <AppShell screen={kind} isAuthenticated textSize={textSize}>
    <div className="screen-content-frame flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {outcome ? <h1 role="status">{outcome}</h1> : <LearningContent kind={kind} itemId={itemId} load={load}
        onBack={() => setOutcome("Returned to your path")}
        onComplete={() => setOutcome("Activity completed")}
        onDone={() => setOutcome("Returned to your path")}
        onPass={() => setOutcome("Exam completed")} />}
    </div>
  </AppShell>;
}
createRoot(document.getElementById("root")).render(<Review />);
