import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AppShell from "../../src/components/AppShell.jsx";
import ChallengePlayer from "../../src/screens/ChallengePlayer.jsx";
import ExamPlayer from "../../src/screens/ExamPlayer.jsx";
import { challengesByOrder, examsByOrder } from "../../src/data/lessons.js";
import "../../src/index.css";

const query = new URLSearchParams(location.search);
const kind = query.get("kind");
const textSize = query.get("textSize") || "size-2";
const data = (kind === "exam" ? examsByOrder : challengesByOrder).find(item => item.id === query.get("id"));
if (!data) throw new Error("Unknown authored assessment");
document.documentElement.dataset.textSize = textSize;
function AssessmentFixture() {
  const [outcome, setOutcome] = useState(null);
  const finish = (type, detail = {}) => setOutcome(previous => ({type, calls:(previous?.calls || 0)+1, ...detail}));
  useEffect(() => { document.body.dataset.assessmentReady = "true"; }, []);
  return <AppShell screen={kind} isAuthenticated textSize={textSize} onTextSizeChange={() => {}}>
    <div className="screen-content-frame flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {outcome ? <output data-testid="assessment-outcome">{JSON.stringify(outcome)}</output> : kind === "exam"
        ? <ExamPlayer exam={data} onBack={() => finish("back")} onPass={result => finish("passed", result)} />
        : <ChallengePlayer challenge={data} onBack={() => finish("back")} onComplete={() => finish("completed")} />}
    </div>
  </AppShell>;
}
createRoot(document.getElementById("root")).render(<AssessmentFixture />);
