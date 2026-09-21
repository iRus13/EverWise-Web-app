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
import BillingAccessError from "../../src/screens/BillingAccessError.jsx";
import BillingConfirmation from "../../src/screens/BillingConfirmation.jsx";
import PartnerAccessError from "../../src/screens/PartnerAccessError.jsx";
import PersonalPlan from "../../src/screens/PersonalPlan.jsx";
import {allLessons} from "../../src/data/lessons";
import "../../src/index.css";
const query = new URLSearchParams(location.search);
if (query.get("mutation") === "unscrollable-sidebar") {
  const style = document.createElement("style");
  style.textContent = ".app-navigation { overflow: visible !important; }";
  document.head.append(style);
}
const view = query.get("view") || "home";
const textSize = query.get("textSize") || "size-2";
document.documentElement.dataset.textSize = textSize;
const noop = () => {};
const lesson = allLessons[1];
const screens = {
  "password-reset": <PasswordReset onBack={noop} onResetPassword={async () => {}} />,
  landing: <Landing onGetStarted={noop} onLogIn={noop} />,
  login: <LogIn onLogIn={noop} onGoToSignUp={noop} onBack={noop} onResetPassword={async () => {}}/>,
  interview: <ProfileInterview onComplete={noop} onBack={noop} onLogIn={noop}/>,
  signup: <ProfileInterview initialInterview={{name:"Jane", age:70}} onComplete={noop} onBack={noop} onLogIn={noop}/>,
  home: <Home name="Jane" textSize={textSize} onTextSizeChange={noop} onStart={noop} onOpenBadges={noop} onOpenSettings={noop} onOpenScamChecker={noop}/>,
  settings: <Settings subscriptionStatus="expired" textSize={textSize} onTextSizeChange={noop} onBack={noop} onLogOut={noop} onOpenPaywall={noop} onDeleteAccount={noop}
    onResetPassword={() => view === "settings-reset-error" ? new Promise((_, reject) => setTimeout(() => reject({code:"auth/network-request-failed"}), Number(query.get("resetDelay")) || 0)) : new Promise(() => {})}/>,
  badges: <Badges badges={query.get("awards") === "earned" ? [allLessons[0].badge, "Communication Champion", "Communication Master"] : query.get("awards") === "honors" ? ["Communication Master"] : []} onBack={noop}/>,
  path: <LessonPath textSize={textSize} onBack={noop} onSelectLesson={noop} onSelectExam={noop} onSelectChallenge={noop}/>,
  lesson: <LessonPlayer lesson={lesson} onBack={noop} onExit={noop} onComplete={noop}/>,
  complete: <Complete lesson={lesson} onDone={noop}/>,
  "scam-checker": <ScamChecker onBack={noop}/>,
  "billing-error": <BillingAccessError onRetry={noop} onBack={noop}/>,
  "billing-inactive": <BillingAccessError kind="inactive" onRetry={noop} onBack={noop}/>,
  "billing-checking": <BillingConfirmation onBack={noop}/>,
  "billing-timeout": <BillingConfirmation phase="timeout" onRetry={noop} onManageBilling={noop} onBack={noop}/>,
  "partner-error": <PartnerAccessError code="PARTNER_ACCESS_UNCONFIRMED" onRetry={noop} onLogOut={noop}/>,
  "partner-cleanup": <PartnerAccessError code="PARTNER_CLEANUP_INCOMPLETE" onLogOut={noop} showSupport/>,
  "personal-plan": <PersonalPlan profile={{profileInterview:{concerns:["Suspicious links"],scamFrequency:"never"}}} onContinue={noop}/>,
};
function MeasuredScreen() {
  useEffect(() => {
    if (view.startsWith("settings-reset-")) document.querySelector('[aria-label="Reset password"]').click();
    void measure();
  }, []);
  const screen = view.startsWith("settings-reset-") ? "settings" : view.replace(/-pending$/, "");
  return <AppShell screen={screen} isAuthenticated={!["landing","login","password-reset","interview","signup"].includes(screen)} textSize={textSize} onTextSizeChange={noop} onHome={noop} onCourse={noop} onScamChecker={noop} onBadges={noop} onSettings={noop}>
    {["home-pending", "complete-pending"].includes(view) && <ProgressSaveNotice status={{pending:true,saving:false,durable:screen==="home"}} onRetry={noop}/>}
    <div className="screen-content-frame flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">{screens[screen]}</div>
  </AppShell>;
}
createRoot(document.getElementById("root")).render(<MeasuredScreen />);
async function measure() {
  if(view === "personal-plan") {
    await new Promise((resolve, reject) => {
      const observer=new MutationObserver(check);
      const timer=setTimeout(() => { observer.disconnect(); reject(new Error("Plan fixture did not finish")); }, 5000);
      function check() {
        if (!document.querySelector(".screen-content-frame button")) return;
        clearTimeout(timer); observer.disconnect(); resolve();
      }
      observer.observe(document.body, {childList:true,subtree:true});
      check();
    });
  }
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
  // The plan mounts a finite entrance animation after its preparation delay.
  // Measure its settled position, rather than scroll against a moving heading.
  if (view === "personal-plan") {
    await Promise.all(document.getAnimations()
      .filter(animation => Number.isFinite(animation.effect.getComputedTiming().endTime))
      .map(animation => animation.finished.catch(() => {})));
  }
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
  let landingBottomGap=null;
  if(view === "landing") {
    const scroller=document.querySelector(".landing-screen");
    scroller.scrollTop=scroller.scrollHeight;
    // Desktop/tablet layouts scroll the document instead of the phone pane.
    window.scrollTo(0,document.documentElement.scrollHeight);
    await new Promise(resolve => requestAnimationFrame(resolve));
    const lastAction=document.querySelector(".landing-actions button:last-child").getBoundingClientRect();
    landingBottomGap=Math.min(innerHeight,scroller.getBoundingClientRect().bottom)-lastAction.bottom;
  }
  const unreachable=[];
  if (/^(billing-|partner-|personal-plan)/.test(view)) {
    for(const control of document.querySelectorAll(".screen-content-frame h1, .screen-content-frame button, .screen-content-frame a")) {
      const heading=control.tagName === "H1";
      // Scroll only user-scrollable containers. scrollIntoView() would also
      // move overflow:hidden ancestors and conceal an inaccessible layout.
      for(let parent=control.parentElement; parent; parent=parent.parentElement) {
        if(!/^(auto|scroll)$/.test(getComputedStyle(parent).overflowY)) continue;
        const rect=control.getBoundingClientRect(), box=parent.getBoundingClientRect();
        const top=Math.max(0,box.top), bottom=Math.min(innerHeight,box.bottom);
        parent.scrollTop += heading || rect.top < top ? rect.top-top : Math.max(0,rect.bottom-bottom);
      }
      // Wide layouts scroll the document. Body.scrollTop does not move the
      // viewport in standards mode, so use the document's scrolling API.
      if (/^(auto|scroll)$/.test(getComputedStyle(document.body).overflowY)) {
        const rect=control.getBoundingClientRect();
        window.scrollBy(0, heading || rect.top < 0 ? rect.top : Math.max(0,rect.bottom-innerHeight));
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
      let top=0, bottom=innerHeight;
      for(let parent=control.parentElement; parent; parent=parent.parentElement) {
        if(!/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(parent).overflowY)) continue;
        const box=parent.getBoundingClientRect();
        top=Math.max(top,box.top); bottom=Math.min(bottom,box.bottom);
      }
      const rect=control.getBoundingClientRect();
      if(rect.top < top-1 || (heading ? rect.top >= bottom : rect.bottom > bottom+1)) {
        unreachable.push({label:control.textContent.trim(),top:rect.top,bottom:rect.bottom,clipTop:top,clipBottom:bottom});
      }
    }
  }
  let navigationReachable = true;
  const navigation = document.querySelector('.app-navigation');
  const navControls = navigation ? [...navigation.querySelectorAll('button')].filter(el => el.getClientRects().length) : [];
  if (navigation && navControls.length) {
    navigation.scrollTop = 0;
    const first = navControls[0].getBoundingClientRect();
    navigationReachable = first.top >= -1;
    navigation.scrollTop = navigation.scrollHeight;
    await new Promise(resolve => requestAnimationFrame(resolve));
    const last = navControls.at(-1).getBoundingClientRect();
    navigationReachable &&= last.bottom <= Math.min(innerHeight, navigation.getBoundingClientRect().bottom) + 1;
    navigation.scrollTop = 0;
  }
  document.body.dataset.geometry = btoa(JSON.stringify({clientWidth:viewport, scrollWidth:document.documentElement.scrollWidth, outside, brokenImages:images, headings:document.querySelectorAll("h1").length,noticeReachable,contentHeight,recoveryReadable,landingBottomGap,unreachable,navigationReachable}));
  document.body.dataset.geometryReady = "true";
}
