// Isolated, synthetic screen data. No Firebase session or billing actions.
import React, { useEffect } from "react";
import {createRoot} from "react-dom/client";
import AppShell from "../../src/components/AppShell";
import ProgressSaveNotice from "../../src/components/ProgressSaveNotice.jsx";
import Landing from "../../src/screens/Landing";
import LogIn from "../../src/screens/LogIn";
import PasswordReset from "../../src/screens/PasswordReset.jsx";
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
  "password-reset": <PasswordReset onBack={noop} onResetPassword={async () => {}} />,
  landing: <Landing onSignUp={noop} onLogIn={noop} />,
  login: <LogIn onLogIn={noop} onGoToSignUp={noop} onBack={noop}/>,
  interview: <ProfileInterview onComplete={noop} onBack={noop} onLogIn={noop}/>,
  signup: <ProfileInterview initialInterview={{name:"Jane", age:70}} onComplete={noop} onBack={noop} onLogIn={noop}/>,
  home: <Home name="Jane" textSize={textSize} onTextSizeChange={noop} onStart={noop} onOpenBadges={noop} onOpenSettings={noop} onOpenScamChecker={noop}/>,
  settings: <Settings subscriptionStatus="expired" textSize={textSize} onTextSizeChange={noop} onBack={noop} onLogOut={noop} onOpenPaywall={noop} onDeleteAccount={noop}
    onResetPassword={() => view === "settings-reset-error" ? new Promise((_, reject) => setTimeout(() => reject({code:"auth/network-request-failed"}), Number(query.get("resetDelay")) || 0)) : new Promise(() => {})}/>,
  badges: <Badges onBack={noop}/>,
  path: <LessonPath textSize={textSize} onBack={noop} onSelectLesson={noop} onSelectExam={noop} onSelectChallenge={noop}/>,
  lesson: <LessonPlayer lesson={lesson} onBack={noop} onComplete={noop}/>,
  complete: <Complete lesson={lesson} onDone={noop}/>,
  "scam-checker": <ScamChecker onBack={noop}/>,
};
function MeasuredScreen() {
  useEffect(() => {
    if (view.startsWith("settings-reset-")) document.querySelector('[aria-label="Reset password"]').click();
    void measure();
  }, []);
  const screen = view.startsWith("settings-reset-") ? "settings" : view.replace(/-pending$/, "");
  return <AppShell screen={screen} isAuthenticated={!["landing","login","password-reset","interview","signup"].includes(screen)} textSize={textSize} onTextSizeChange={noop} onHome={noop} onCourse={noop} onScamChecker={noop} onBadges={noop} onSettings={noop}>
    {["home-pending", "complete-pending"].includes(view) && <ProgressSaveNotice status={{pending:true,saving:false,durable:screen==="home"}} onRetry={noop}/>}
    {screens[screen]}
  </AppShell>;
}
createRoot(document.getElementById("root")).render(<MeasuredScreen />);
async function measure() {
  if (view.startsWith("settings-reset-")) {
    const selector=view.endsWith("error") ? '[role="alert"]' : '[role="status"]';
    await new Promise((resolve, reject) => {
      const observer=new MutationObserver(check);
      const timer=setTimeout(() => { observer.disconnect(); reject(new Error(`Reset fixture did not reach ${selector}`)); }, 5000);
      function check() {
        if (!document.querySelector(selector)) return;
        clearTimeout(timer); observer.disconnect(); resolve();
      }
      observer.observe(document.body, {childList:true,subtree:true});
      check();
    });
  }
  await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const viewport = document.documentElement.clientWidth;
  const outside = Array.from(document.querySelectorAll("button,input,textarea")).filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && (r.left < -1 || r.right > viewport + 1);
  }).map(el => ({label: el.textContent.trim().slice(0,90) || el.getAttribute("aria-label"), left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right}));
  const images = Array.from(document.images).filter(img => img.complete && !img.naturalWidth).map(img => img.getAttribute("src"));
  const notice=document.querySelector('[data-testid="progress-save-notice"]');
  let noticeReachable=true, contentHeight=null;
  if(notice){
    notice.scrollTop=notice.scrollHeight;
    const button=notice.querySelector("button").getBoundingClientRect();
    noticeReachable=button.bottom <= notice.getBoundingClientRect().bottom + 1 && button.bottom <= innerHeight + 1;
    contentHeight=document.querySelector(".home-screen, .complete-screen").getBoundingClientRect().height;
  }
  let recoveryReadable=true;
  if(view.startsWith("settings-reset-")) {
    const message=document.querySelector(view.endsWith("error") ? '[role="alert"]' : '[role="status"]');
    if(!message) recoveryReadable=false;
    else {
      message.scrollIntoView({block:"end"});
      await new Promise(resolve => requestAnimationFrame(resolve));
      const rect=message.getBoundingClientRect();
      recoveryReadable=rect.left >= -1 && rect.right <= viewport + 1 && rect.bottom <= innerHeight + 1;
    }
    recoveryReadable &&= !document.querySelector('[aria-label="Log out"]').disabled;
  }
  document.body.dataset.geometry = btoa(JSON.stringify({clientWidth:viewport, scrollWidth:document.documentElement.scrollWidth, outside, brokenImages:images, headings:document.querySelectorAll("h1").length,noticeReachable,contentHeight,recoveryReadable}));
  document.body.dataset.geometryReady = "true";
}
