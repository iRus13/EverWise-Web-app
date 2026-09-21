import {allLessons,challengesByOrder,examsByOrder} from "../src/data/lessons.js";
const views=["landing","login","password-reset","interview","signup","home","home-pending","settings","settings-reset-pending","settings-reset-error","badges","path","lesson","complete","complete-pending","scam-checker","billing-error","billing-inactive","billing-checking","billing-timeout","partner-error","partner-cleanup","personal-plan"];
export const scenes=[...views.map(view=>({name:view,url:`/tests/fixtures/app-layout.html?view=${view}`})),
  ...["earned","honors"].map(awards=>({name:`badges-${awards}`,url:`/tests/fixtures/app-layout.html?view=badges&awards=${awards}`})),
  ...["native","web"].map(platform=>({name:`paywall-${platform}`,url:`/tests/fixtures/paywall-layout.html?platform=${platform}`})),
  ...[...new Set(allLessons.flatMap(l=>l.blocks.map(b=>b.type)))].map(type=>({name:`activity-${type}`,url:`/tests/fixtures/learning-layout.html?type=${type}`})),
  {name:"challenge",url:`/tests/fixtures/assessments.html?kind=challenge&id=${challengesByOrder[0].id}`},
  {name:"exam",url:`/tests/fixtures/assessments.html?kind=exam&id=${examsByOrder[0].id}`},
  ...["loading","partner-dashboard","partner-invalid"].map(view=>({name:view,url:`/tests/fixtures/extra-screens.html?view=${view}`}))];
