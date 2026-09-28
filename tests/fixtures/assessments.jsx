import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AppShell from "../../src/components/AppShell.jsx";
import ChallengePlayer from "../../src/screens/ChallengePlayer.jsx";
import ExamPlayer from "../../src/screens/ExamPlayer.jsx";
import { challengesByOrder, examsByOrder } from "../../src/data/lessons.js";
import "../../src/index.css";
import {readAssessmentPosition,saveAssessmentPosition,clearAssessmentPosition} from "../../src/utils/assessmentProgress.js";

const query = new URLSearchParams(location.search);
const kind = query.get("kind");
const textSize = query.get("textSize") || "size-2";
const data = (kind === "exam" ? examsByOrder : challengesByOrder).find(item => item.id === query.get("id"));
if (!data) throw new Error("Unknown authored assessment");
document.documentElement.dataset.textSize = textSize;
function AssessmentFixture() {
  const identity={uid:"fixture-learner",itemId:data.id,storage:window.localStorage};
  const persist=query.get("persist")==="1";
  const initialPosition=persist?readAssessmentPosition(identity):null;
  const onPositionChange=position=>{
    if (!persist) return;
    if (position) saveAssessmentPosition({...identity,position}); else clearAssessmentPosition(identity);
  };
  const [outcome, setOutcome] = useState(null);
  const finish = (type, detail = {}) => {
    if (persist && type!=="back") clearAssessmentPosition(identity);
    setOutcome(previous => ({type, calls:(previous?.calls || 0)+1, ...detail}));
  };
  useEffect(() => { document.body.dataset.assessmentReady = "true"; }, []);
  return <AppShell screen={kind} isAuthenticated textSize={textSize} onTextSizeChange={() => {}}>
    <div className="screen-content-frame flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {outcome ? <output data-testid="assessment-outcome">{JSON.stringify(outcome)}</output> : kind === "exam"
        ? <ExamPlayer exam={data} initialPosition={initialPosition} onPositionChange={onPositionChange} onBack={() => finish("back")} onPass={result => finish("passed", result)} />
        : <ChallengePlayer challenge={data} initialPosition={initialPosition} onPositionChange={onPositionChange} onBack={() => finish("back")} onComplete={() => finish("completed")} />}
    </div>
  </AppShell>;
}
createRoot(document.getElementById("root")).render(<AssessmentFixture />);
