import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Paywall from "../../src/screens/Paywall";
import AppShell from "../../src/components/AppShell";
import "../../src/index.css";

const VERIFIED_WEB_PLANS = [
  {
    key: "annual",
    currency: "usd",
    unitAmount: 6000,
    interval: "year",
    trialDays: 7,
  },
  {
    key: "monthly",
    currency: "usd",
    unitAmount: 799,
    interval: "month",
    trialDays: 3,
  },
];

if (new URLSearchParams(window.location.search).get("mutation") === "wide-card") {
  const mutation = document.createElement("style");
  mutation.textContent = `
    .release-paywall { contain: paint; }
    .paywall-plan-card { min-width: 900px !important; }
  `;
  document.head.append(mutation);
}

const query = new URLSearchParams(location.search);
const native = query.get("platform") === "native";
const scenario = query.get("scenario");
const qa = window.__paywallQA = { calls: [], settle: null };
function operation(name, value) {
  qa.calls.push({name, value});
  if (query.get("interactive") !== "true") return Promise.resolve();
  return new Promise((resolve, reject) => {
    qa.settle = (result) => result === "cancel" ? reject({code: "PURCHASE_CANCELLED"})
      : result === "error" ? reject(new Error(name === "restore" ? "No active subscription was found for this Apple Account." : "Connection interrupted. Please try again.")) : resolve();
  });
}
document.documentElement.dataset.textSize = query.get("textSize") || "size-2";
function MeasuredPaywall() {
  useEffect(() => { void recordGeometry(); }, []);
  return <Paywall
    billingAvailable={scenario !== "unavailable"}
    sponsored={scenario === "sponsored"}
    billingAccess={{canStartTrial:scenario !== "returning"}}
    billingPlans={VERIFIED_WEB_PLANS}
    onMaybeLater={() => { qa.calls.push({name:"exit"}); }}
    onStartLearning={() => { qa.calls.push({name:"introduction"}); }}
    onRetry={() => operation("retry")}
    onRestore={() => operation("restore")}
    onStartTrial={plan => operation("purchase",plan)}
    platform={native ? "native" : "web"}
    storeProducts={scenario === "unavailable" ? [] : [
      {id: "com.everwise.app.monthly", displayPrice: "€12,99", periodUnit: "month", periodValue: 1},
      {id: "com.everwise.app.annual", displayPrice: "€79,99", periodUnit: "year", periodValue: 1, eligibleForTrial: true, trialValue: 1, trialUnit: "week"},
    ].map(product => ({...product, ...(scenario === "returning" ? {eligibleForTrial:false} : {}), ...(scenario === "long-price" ? {displayPrice:"1.234.567,89 kr"} : {})}))}
  />;
}
// Match the production native safe-area and scrolling containers.
createRoot(document.getElementById("root")).render(
  <AppShell screen="paywall">
    <div className="screen-content-frame flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <MeasuredPaywall />
    </div>
  </AppShell>
);

function rectFor(element) {
  if (!element) return null;
  const { left, right, width } = element.getBoundingClientRect();
  return { left, right, width };
}

async function recordGeometry() {
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const root = document.querySelector('[data-testid="browser-paywall"]');
  const cards = Array.from(document.querySelectorAll('[role="radio"]'));
  const action = document.querySelector(".paywall-cta");
  const terms = document.querySelector(".paywall-reassurance");
  const footer = document.querySelector(".paywall-footer");
  footer.scrollIntoView({block: "end"});
  const geometry = {
    footerReachable: footer.getBoundingClientRect().bottom <= innerHeight + 1,
    textOverflow: [terms, ...cards].filter(Boolean).some(el => el.scrollWidth > el.clientWidth + 1),
    termsFontSize: terms ? parseFloat(getComputedStyle(terms).fontSize) : null,
    buttons: Array.from(document.querySelectorAll("button"), button => ({ height: button.getBoundingClientRect().height })),
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    root: rectFor(root),
    cards: cards.map(rectFor),
    action: rectFor(action),
  };

  document.body.dataset.geometry = btoa(JSON.stringify(geometry));
  document.body.dataset.geometryReady = "true";
}
