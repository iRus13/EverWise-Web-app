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
document.documentElement.dataset.textSize = query.get("textSize") || "size-2";
function MeasuredPaywall() {
  useEffect(() => { void recordGeometry(); }, []);
  return <Paywall
    billingAvailable
    billingAccess={{canStartTrial:true}}
    billingPlans={VERIFIED_WEB_PLANS}
    onMaybeLater={() => {}}
    onRetry={() => {}}
    onStartTrial={() => Promise.resolve()}
    platform={native ? "native" : "web"}
    storeProducts={[
      {id: "com.everwise.app.monthly", displayPrice: "€12,99", periodUnit: "month", periodValue: 1},
      {id: "com.everwise.app.annual", displayPrice: "€79,99", periodUnit: "year", periodValue: 1, eligibleForTrial: true, trialValue: 1, trialUnit: "week"},
    ]}
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
    textOverflow: [terms, ...cards].some(el => el.scrollWidth > el.clientWidth + 1),
    termsFontSize: parseFloat(getComputedStyle(document.querySelector(".paywall-reassurance")).fontSize),
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
