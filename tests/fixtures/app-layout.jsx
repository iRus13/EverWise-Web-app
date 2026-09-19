// Isolated, synthetic screen data. No Firebase session or billing actions.
import React from "react";
import {createRoot} from "react-dom/client";
import AppShell from "../../src/components/AppShell";
import Landing from "../../src/screens/Landing";
import LogIn from "../../src/screens/LogIn";
import ProfileInterview from "../../src/screens/ProfileInterview";
import Home from "../../src/screens/Home";
import Settings from "../../src/screens/Settings";
import Badges from "../../src/screens/Badges";
import LessonPath from "../../src/screens/LessonPath";
import LessonPlayer from "../../src/screens/LessonPlayer";
import Complete from "../../src/screens/Complete";
import ScamChecker from "../../src/screens/ScamChecker";
import {allLessons} from "../../src/data/lessons";
import "../../src/index.css";
const query = new URLSearchParams(location.search);
const view = query.get("view") || "home";
const textSize = query.get("textSize") || "size-2";
document.documentElement.dataset.textSize = textSize;
const noop = () => {};
const lesson = allLessons[1];
const screens = {
  landing: <Landing onSignUp={noop} onLogIn={noop} />,
  login: <LogIn onLogIn={noop} onGoToSignUp={noop} onBack={noop}/>,
  interview: <ProfileInterview onComplete={noop} onBack={noop} onLogIn={noop}/>,
  signup: <ProfileInterview initialInterview={{name:"Jane", age:70}} onComplete={noop} onBack={noop} onLogIn={noop}/>,
  home: <Home name="Jane" textSize={textSize} onTextSizeChange={noop} onStart={noop} onOpenBadges={noop} onOpenSettings={noop} onOpenScamChecker={noop}/>,
  settings: <Settings subscriptionStatus="expired" textSize={textSize} onTextSizeChange={noop} onBack={noop} onLogOut={noop} onOpenPaywall={noop} onDeleteAccount={noop}/>,
  badges: <Badges onBack={noop}/>,
  path: <LessonPath textSize={textSize} onBack={noop} onSelectLesson={noop} onSelectExam={noop} onSelectChallenge={noop}/>,
  lesson: <LessonPlayer lesson={lesson} onBack={noop} onComplete={noop}/>,
  complete: <Complete lesson={lesson} onDone={noop}/>,
  "scam-checker": <ScamChecker onBack={noop}/>,
};
createRoot(document.getElementById("root")).render(<AppShell screen={view} isAuthenticated={!["landing","login","interview","signup"].includes(view)} textSize={textSize} onTextSizeChange={noop} onHome={noop} onCourse={noop} onScamChecker={noop} onBadges={noop} onSettings={noop}>{screens[view]}</AppShell>);
async function measure() {
  await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const viewport = document.documentElement.clientWidth;
  const outside = Array.from(document.querySelectorAll("button,input,textarea")).filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && (r.left < -1 || r.right > viewport + 1);
  }).map(el => ({label: el.textContent.trim().slice(0,90) || el.getAttribute("aria-label"), left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right}));
  const images = Array.from(document.images).filter(img => img.complete && !img.naturalWidth).map(img => img.getAttribute("src"));
  document.body.dataset.geometry = btoa(JSON.stringify({clientWidth:viewport, scrollWidth:document.documentElement.scrollWidth, outside, brokenImages:images, headings:document.querySelectorAll("h1").length}));
  document.body.dataset.geometryReady = "true";
}
measure();
