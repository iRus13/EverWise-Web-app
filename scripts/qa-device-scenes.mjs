import {allLessons,challengesByOrder,examsByOrder} from "../src/data/lessons.js";
const views=["landing","login","password-reset","interview","signup","home","home-pending","settings","settings-reset-pending","settings-reset-error","badges","path","lesson","complete","complete-pending","scam-checker","billing-error","billing-inactive","billing-checking","billing-timeout","partner-error","partner-cleanup","personal-plan","partner-invalid-link","partner-full","partner-suspended","partner-profile","partner-missing","partner-account","partner-unavailable","partner-busy","partner-release","partner-release-busy","partner-terminal","partner-reconciliation"];
export const scenes=[
  {name:"home-resume",url:"/tests/fixtures/app-layout.html?view=home&pathAt=online-banking&resume=online-banking"},
  {name:"home-complete",url:"/tests/fixtures/app-layout.html?view=home&pathAt=all"},
  {name:"path-resume-challenge",url:"/tests/fixtures/app-layout.html?view=path&pathAt=phase3-challenge&resumeAssessment=phase3-challenge"},
  {name:"path-resume-exam",url:"/tests/fixtures/app-layout.html?view=path&pathAt=phase3-exam&resumeAssessment=phase3-exam"},{name:"path-resume",url:"/tests/fixtures/app-layout.html?view=path&pathAt=ai&resume=ai"},...["ready","suppressed","report-error","invalid","loading","confirm","rotating","revealed","rotation-error","copy-failed","download-error"].map(state=>({name:`partner-report-${state}`,url:`/tests/fixtures/partner-dashboard.html?state=${state}`})),...views.map(view=>({name:view,url:`/tests/fixtures/app-layout.html?view=${view}`})),
  ...["settings-trial","settings-sponsored","settings-billing-error","settings-delete"].map(view=>({name:view,url:`/tests/fixtures/app-layout.html?view=${view}`})),
  ...["earned","honors"].map(awards=>({name:`badges-${awards}`,url:`/tests/fixtures/app-layout.html?view=badges&awards=${awards}`})),
  ...["native","web"].map(platform=>({name:`paywall-${platform}`,url:`/tests/fixtures/paywall-layout.html?platform=${platform}`})),
  ...[...new Set(allLessons.flatMap(l=>l.blocks.map(b=>b.type)))].map(type=>({name:`activity-${type}`,url:`/tests/fixtures/learning-layout.html?type=${type}`})),
  {name:"challenge",url:`/tests/fixtures/assessments.html?kind=challenge&id=${challengesByOrder[0].id}`},
  {name:"exam",url:`/tests/fixtures/assessments.html?kind=exam&id=${examsByOrder[0].id}`},
  ...["loading","partner-dashboard","partner-invalid"].map(view=>({name:view,url:`/tests/fixtures/extra-screens.html?view=${view}`}))];
