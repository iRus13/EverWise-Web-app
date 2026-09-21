import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AppShell from "../../src/components/AppShell.jsx";
import LessonPlayer from "../../src/screens/LessonPlayer.jsx";
import { allLessons } from "../../src/data/lessons.js";
import "../../src/index.css";

// Actual authored content and player, with isolated navigation callbacks.
const query=new URLSearchParams(location.search);
const type=query.get("type") || "learn";
const textSize=query.get("textSize") || "size-2";
document.documentElement.dataset.textSize=textSize;
const samples=allLessons.flatMap(lesson => lesson.blocks.map((block, blockIndex) => ({lesson, block, blockIndex})))
  .filter(sample => sample.block.type === type)
  .sort((a,b) => JSON.stringify(b.block).length-JSON.stringify(a.block).length);
const sample=samples[0];
if(!sample) throw new Error(`No authored ${type} activity`);
const noop=() => {};

function LearningFixture() {
  const [outcome,setOutcome]=useState("");
  useEffect(() => { document.body.dataset.learningReady="true"; }, []);
  return <AppShell screen="lesson" isAuthenticated textSize={textSize} onTextSizeChange={noop}>
    <div className="screen-content-frame flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden" data-activity={`${sample.lesson.id}/${sample.blockIndex}/${type}`}>
      {outcome ? <h1 data-testid="activity-outcome">{outcome}</h1> : <LessonPlayer
        lesson={sample.lesson} initialPosition={{phase:"block",blockIndex:sample.blockIndex,quizIndex:0,score:0,reviewQueue:[]}}
        onBack={() => setOutcome("Back to path")} onExit={() => setOutcome("Exited activity")}
        onComplete={() => setOutcome("Completed lesson")} />}
    </div>
  </AppShell>;
}
createRoot(document.getElementById("root")).render(<LearningFixture/>);
