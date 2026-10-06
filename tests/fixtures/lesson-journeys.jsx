import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import AppShell from "../../src/components/AppShell.jsx";
import LessonPlayer from "../../src/screens/LessonPlayer.jsx";
import {allLessons} from "../../src/data/lessons.js";
import {readLessonPosition, saveLessonPosition, clearLessonPosition} from "../../src/utils/lessonProgress.js";
import "../../src/index.css";

const query = new URLSearchParams(location.search);
const lesson = allLessons.find(item => item.id === query.get("id"));
if (!lesson) throw new Error("Unknown authored lesson");
const textSize = query.get("textSize") || "size-2";
const key = {uid:`synthetic-lesson-${query.get("run") || "full"}`,lessonId:lesson.id,storage:localStorage};
document.documentElement.dataset.textSize=textSize;
function LessonJourney() {
  const [outcome,setOutcome]=useState(null);
  const finish=(type,score) => {
    if(type === "completed") clearLessonPosition(key);
    setOutcome(previous => ({type,score,calls:(previous?.calls || 0)+1}));
  };
  useEffect(() => {document.body.dataset.lessonReady="true";},[]);
  return <AppShell screen="lesson" isAuthenticated textSize={textSize} onTextSizeChange={() => {}}>
    <div className="screen-content-frame flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {outcome ? <output data-testid="lesson-outcome">{JSON.stringify(outcome)}</output> :
        <LessonPlayer lesson={lesson} onBack={() => finish("back")} onExit={() => finish("exit")} onComplete={score => finish("completed",score)}
          initialPosition={readLessonPosition(key) || (query.get("quiz") === "1" ? {phase:"quiz",blockIndex:lesson.blocks.length-1,quizIndex:0,score:0,reviewQueue:[],answeredThrough:0} : null)}
          onPositionChange={position => saveLessonPosition({...key,position})}/>}
    </div>
  </AppShell>;
}
createRoot(document.getElementById("root")).render(<LessonJourney/>);
