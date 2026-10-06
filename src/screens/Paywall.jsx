import { hasOwn } from "../utils/hasOwn.js";
import { tr, useLocale } from '../i18n';
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Circle,
  CircleDot,
  MessageCircleWarning,
  X,
} from "lucide-react";
import { openLegalPage } from "../config/legalLinks";
import "../styles/subscription.css";

// Native prices and trial eligibility must come from this Apple Account's StoreKit catalog.
function nativePlans(products) {
  if (!Array.isArray(products)) return null;
  const plans = {};
  for (const key of ["monthly", "annual"]) {
    const product = products.find((item) => item?.id === `com.everwise.app.${key}`);
    const interval = key === "annual" ? "year" : "month";
    if (!product || typeof product.displayPrice !== "string" || !product.displayPrice.trim()
        || product.periodUnit !== interval || product.periodValue !== 1) return null;
    plans[key] = {
      key, name: key === "annual" ? "Annual" : "Monthly",
      price: product.displayPrice, cadence: `/${tr(interval)}`,
      trial: product.eligibleForTrial === true && Number.isInteger(product.trialValue)
        && product.trialValue > 0 && ["day", "week", "month", "year"].includes(product.trialUnit)
        ? tr("{count} {unit}", { count: product.trialValue, unit: tr(`${product.trialUnit}${product.trialValue === 1 ? "" : "s"}`) }) : null,
    };
  }
  return plans;
}

const VERIFIED_WEB_OFFERS = {
  annual: {
    key: "annual",
    currency: "usd",
    unitAmount: 6000,
    interval: "year",
    trialDays: 7,
  },
  monthly: {
    key: "monthly",
    currency: "usd",
    unitAmount: 799,
    interval: "month",
    trialDays: 3,
  },
};

const WEB_OFFER_KEYS = ["currency", "interval", "key", "trialDays", "unitAmount"];

function snapshotPlainRecord(value, expectedKeys) {
  try {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    if (
      keys.length !== expectedKeys.length ||
      !expectedKeys.every((key) => keys.includes(key))
    ) {
      return null;
    }
    const snapshot = Object.create(null);
    for (const key of expectedKeys) {
      const descriptor = descriptors[key];
      if (!descriptor || !("value" in descriptor)) return null;
      snapshot[key] = descriptor.value;
    }
    return snapshot;
  } catch {
    return null;
  }
}

function snapshotPlanList(plans) {
  try {
    if (!Array.isArray(plans) || Object.getPrototypeOf(plans) !== Array.prototype) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(plans);
    const keys = Reflect.ownKeys(descriptors);
    if (
      keys.length !== 3 ||
      !keys.includes("0") ||
      !keys.includes("1") ||
      !keys.includes("length") ||
      descriptors.length?.value !== 2 ||
      !("value" in descriptors[0]) ||
      !("value" in descriptors[1])
    ) {
      return null;
    }
    return [descriptors[0].value, descriptors[1].value];
  } catch {
    return null;
  }
}

function trustedOffer(key) {
  if (key === "annual") return VERIFIED_WEB_OFFERS.annual;
  if (key === "monthly") return VERIFIED_WEB_OFFERS.monthly;
  return null;
}

function freshOffer(expected) {
  return {
    key: expected.key,
    currency: expected.currency,
    unitAmount: expected.unitAmount,
    interval: expected.interval,
    trialDays: expected.trialDays,
  };
}

function verifiedWebPlans(plans) {
  const planInputs = snapshotPlanList(plans);
  if (!planInputs) return null;
  const normalized = Object.create(null);
  for (const planInput of planInputs) {
    const plan = snapshotPlainRecord(planInput, WEB_OFFER_KEYS);
    if (!plan) return null;
    const expected = trustedOffer(plan.key);
    if (
      !expected ||
      !WEB_OFFER_KEYS.every((key) => plan[key] === expected[key]) ||
      hasOwn(normalized, plan.key)
    ) {
      return null;
    }
    normalized[plan.key] = freshOffer(expected);
  }
  return normalized.annual && normalized.monthly ? normalized : null;
}

function webPrice(plan) {
  const amount = plan.unitAmount / 100;
  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}/${tr(plan.interval)}`;
}

function Benefit({ icon, title, body }) {
  return <li className="paywall-benefit">
    <span className="paywall-benefit-icon" aria-hidden="true">{icon}</span>
    <span><span className="paywall-benefit-title">{title}</span><span className="paywall-benefit-body">{body}</span></span>
  </li>;
}

function PlanCard({ disabled, native, offer, onSelect, selected, tabIndex }) {
  const SelectionIcon = selected ? CircleDot : Circle;
  return <button type="button" role="radio" aria-checked={selected} data-plan-key={offer.key}
    tabIndex={tabIndex} disabled={disabled} onClick={() => onSelect(offer.key)}
    className={`paywall-plan-card paywall-plan-${offer.key}`}>
    <SelectionIcon className="subscription-choice" strokeWidth={1.8} aria-hidden="true" />
    <span className="subscription-plan-content">
      <span className="subscription-plan-name">{tr(offer.name) || (offer.key === "annual" ? tr("Annual") : tr("Monthly"))}</span>
      <span className="subscription-price">{native ? <>{offer.price}<span className="subscription-cadence">{offer.cadence}</span></> : webPrice(offer)}</span>
      {native ? offer.trial ? <span className="subscription-plan-detail">{offer.trial} {tr("free, then")} {offer.price}{offer.cadence}</span> : null
        : <span className="subscription-plan-detail">{offer.trialDays > 0
          ? tr("{days} days free, then {price} unless canceled.", { days: offer.trialDays, price: webPrice(offer) })
          : tr("{price}, billed at checkout. Renews unless canceled.", { price: webPrice(offer) })}</span>}
    </span>
  </button>;
}

function Header({ busy, label, onBack }) {
  return <header className="paywall-header">
    <div className="subscription-brand"><img src={`${import.meta.env.BASE_URL}everwise-logo-192.png`} alt="" /><span>EverWise</span></div>
    <button type="button" onClick={onBack} disabled={busy} className="subscription-close" aria-label={label}>
      <X size={24} strokeWidth={2} aria-hidden="true" />
    </button>
  </header>;
}

function LegalFooter({ busy, native, onRestore }) {
  return <div className="paywall-footer">
    <button type="button" onClick={() => openLegalPage("terms")}>{tr("Terms")}</button>
    <button type="button" onClick={() => openLegalPage("privacy")}>{tr("Privacy")}</button>
    {native ? <button type="button" onClick={onRestore} disabled={busy}>{tr("Restore")}</button> : null}
  </div>;
}

function OperationFeedback({ error, status }) {
  const feedbackRef = useRef(null);
  useEffect(() => {
    // A response can arrive after the initiating control has scrolled offscreen.
    // Reveal it without taking keyboard or assistive-technology focus away.
    feedbackRef.current?.scrollIntoView?.({block: "nearest"});
  }, [error, status]);
  if (!error && !status) return null;
  return <p ref={feedbackRef} role={error ? "alert" : "status"}
    className={error ? "subscription-error" : "subscription-status"}>{error || status}</p>;
}

function Unavailable({ busy, message, onBack, onFree, onRetry, onRestore, native = false, sponsored, error, status }) {
  return <div data-testid="browser-paywall" className="subscription-screen release-paywall">
    <Header busy={busy} label={tr("Back to home")} onBack={onBack} />
    <div className="subscription-unavailable">
      <h1>{sponsored ? tr("Your learning access is ready") : native ? tr("Keep learning for free") : tr("Continue learning on the web")}</h1>
      <p role="status">{message}</p>
      {!sponsored && typeof onRetry === "function" ? <button type="button" className="btn-primary" onClick={onRetry} disabled={busy}>{tr("Retry")}</button> : null}
      <button type="button" className="btn-secondary" onClick={onFree || onBack} disabled={busy}>{onFree ? tr("Open free introduction") : tr("Back to home")}</button>
      <OperationFeedback error={error} status={status} />
    </div>
    <LegalFooter busy={busy} native={native} onRestore={onRestore} />
  </div>;
}

export default function Paywall({
  billingAvailable = false,
  billingAccess = null,
  billingBusy = false,
  billingMessage = "",
  billingPlans = [],
  onMaybeLater,
  onStartLearning,
  onRestore,
  onRetry,
  onStartTrial,
  platform = "native",
  purchasesAvailable = true,
  sponsored = false,
  storeProducts = [],
}) {
  useLocale();
  // Monthly is both listed first and selected on open: the smaller commitment
  // is the easier first step for someone still deciding, and the plan they read
  // first should be the one already chosen.
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [restoreAnnouncement, setRestoreAnnouncement] = useState("");
  const [operation, setOperation] = useState("");
  const operationRef = useRef(false);
  const [error, setError] = useState("");
  const [feedbackSource, setFeedbackSource] = useState("purchase");
  const native = platform === "native";
  const busy = billingBusy || Boolean(operation);
  const operationStatus = operation === "restore" ? "Checking your App Store purchases…"
    : operation === "retry" ? "Loading subscription options…"
    : busy ? (native ? "Waiting for the App Store…" : "Opening secure checkout…") : "";
  const webPlans = native ? null : verifiedWebPlans(billingPlans);
  const offers = native ? nativePlans(storeProducts) : webPlans && Object.fromEntries(
    Object.entries(webPlans).map(([key, offer]) => [key, {
      ...offer, trialDays: billingAccess?.canStartTrial === true ? offer.trialDays : 0,
    }]),
  );

  const handlePlanKeyDown = (event) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key) || busy) return;
    const cards = Array.from(event.currentTarget.querySelectorAll('[role="radio"]'));
    const currentIndex = cards.indexOf(event.target.closest('[role="radio"]'));
    if (currentIndex < 0 || cards.length === 0) return;
    event.preventDefault();
    let nextIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = cards.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % cards.length;
    else nextIndex = (currentIndex - 1 + cards.length) % cards.length;
    setSelectedPlan(cards[nextIndex].dataset.planKey);
    cards[nextIndex].focus();
  };

  const startPurchase = async () => {
    if (billingBusy || operationRef.current) return;
    operationRef.current = true;
    setOperation("purchase");
    setFeedbackSource("purchase");
    setError("");
    setRestoreAnnouncement("");
    try {
      await onStartTrial(selectedPlan);
    } catch (purchaseError) {
      if (purchaseError?.code !== "PURCHASE_CANCELLED") {
        setError(purchaseError?.message || "The subscription could not be started. Please try again.");
      }
    } finally {
      operationRef.current = false;
      setOperation("");
    }
  };

  const restore = async () => {
    if (billingBusy || operationRef.current) return;
    operationRef.current = true;
    setOperation("restore");
    setFeedbackSource("restore");
    setError("");
    setRestoreAnnouncement("");
    try {
      await onRestore();
      setRestoreAnnouncement("Purchase restored.");
    } catch (restoreError) {
      const message = restoreError?.message || "No active subscription was found for this Apple Account.";
      setError(message);
    } finally {
      operationRef.current = false;
      setOperation("");
    }
  };

  const retry = async () => {
    if (billingBusy || operationRef.current || typeof onRetry !== "function") return;
    operationRef.current = true;
    setOperation("retry");
    setFeedbackSource("retry");
    setError("");
    setRestoreAnnouncement("");
    try { await onRetry(); }
    catch { setError("Subscription options could not be loaded. Please try again."); }
    finally { operationRef.current = false; setOperation(""); }
  };

  if (sponsored) {
    return (
      <Unavailable
        busy={busy}
        message="Your access is provided by a community partner."
        onBack={onMaybeLater}
        sponsored
      />
    );
  }

  if (
    (!native && !billingAvailable) ||
    (native && (!purchasesAvailable || !offers))
  ) {
    return (
      <Unavailable
        busy={busy}
        message={native && purchasesAvailable
          ? "Subscription options could not be loaded from the App Store. You can retry or open the free introduction."
          : native ? "Lesson 1 is free. Subscription purchases are not available in this browser." : "Subscription options are temporarily unavailable."}
        onBack={onMaybeLater}
        onFree={onStartLearning}
        onRetry={typeof onRetry === "function" ? retry : undefined}
        native={native && purchasesAvailable}
        error={error}
        status={operationStatus || restoreAnnouncement}
        onRestore={restore}
      />
    );
  }

  // Monthly first: the lower commitment is the easier first step for someone
  // still deciding, so it should be the option they read first.
  const offerList = offers
    ? ["monthly", "annual"].map((key) => offers[key]).filter(Boolean)
    : [];
  if (!native && offers === null) {
    return (
      <Unavailable
        busy={busy}
        message="Subscription options are temporarily unavailable."
        error={error}
        status={operationStatus}
        onBack={onMaybeLater}
        onFree={onStartLearning}
        onRetry={typeof onRetry === "function" ? retry : undefined}
      />
    );
  }

  const selectedOffer = offers[selectedPlan];
  const ctaLabel = native
    ? selectedOffer.trial ? tr("Start {trial} free trial", { trial: selectedOffer.trial }) : tr("Continue with {plan}", { plan: tr(selectedPlan) })
    : selectedOffer.trialDays > 0 ? tr("Start {days}-day free trial", { days: selectedOffer.trialDays }) : tr("Continue with {plan}", { plan: tr(selectedPlan) });

  return (
    <div data-testid="browser-paywall" className={`subscription-screen release-paywall ${native ? "native-paywall" : "web-paywall"}`}>
      <Header busy={busy} label={native ? tr("Close subscription options") : tr("Back to home")} onBack={onMaybeLater} />
      <div className="paywall-main">
        <div className="paywall-layout">
          <section className="paywall-story">
            <p className="subscription-eyebrow">{tr("EVERWISE MEMBERSHIP")}</p>
            <h1 className="paywall-headline">{tr("Feel confident online.")}</h1>
            <ul className="paywall-benefits">
              <Benefit icon={<BookOpen size={24} strokeWidth={1.8} />} title={tr("Keep learning at your pace")} body={tr("Unlock the lessons beyond your free introduction.")} />
              <Benefit icon={<MessageCircleWarning size={24} strokeWidth={1.8} />} title={tr("Recognize scams sooner")} body={tr("Practice spotting warning signs in everyday messages.")} />
            </ul>
          </section>
          <section className="paywall-offer">
            <h2>{tr("Choose your plan")}</h2>
            {billingMessage ? (
              <p className="mt-3 rounded-xl bg-sage/10 px-4 py-3 text-center font-sans text-base font-semibold text-sage-dark" role="status">
                {billingMessage}
              </p>
            ) : null}
            <div className="paywall-plans" role="radiogroup" aria-label={tr("Choose a subscription plan")} aria-busy={busy} onKeyDown={handlePlanKeyDown}>
              {offerList.map((offer) => (
                <PlanCard
                  key={offer.key}
                  disabled={busy}
                  native={native}
                  offer={offer}
                  selected={selectedPlan === offer.key}
                  onSelect={setSelectedPlan}
                  tabIndex={selectedPlan === offer.key ? 0 : -1}
                />
              ))}
            </div>
            {!native ? (
              <div id="paywall-trial-summary" className="paywall-trial-summary" aria-live="polite" aria-atomic="true">
                <p className="font-semibold">{tr("Today:")} {selectedOffer.trialDays > 0 ? tr("{days} days free", { days: selectedOffer.trialDays }) : webPrice(selectedOffer)}</p>
                <p className="mt-1">{tr("Then")} {webPrice(selectedOffer)}{tr(", renewing automatically unless you cancel.")}</p>
                <p className="mt-2">{selectedOffer.trialDays > 0 ? tr("Cancel before your trial ends to avoid a charge. ") : ""}{tr("Go to Settings → Manage subscription to cancel.")}</p>
              </div>
            ) : null}
            {native ? (
              <p id="paywall-native-terms" className="paywall-reassurance">
                {selectedOffer.trial ? tr("{trial} free, then ", { trial: selectedOffer.trial }) : ""}{selectedOffer.price}{selectedOffer.cadence}{tr(". Renews automatically unless canceled. Manage or cancel in your Apple Account subscriptions.")}</p>
            ) : (
              <p id="paywall-payment-note" className="paywall-reassurance">
                {selectedOffer.trialDays > 0 ? tr("Your payment method is collected now. Billing starts automatically after your trial unless you cancel.") : tr("Payment is collected at checkout. Your subscription renews automatically unless you cancel.")}
              </p>
            )}
            <button
              type="button"
              aria-label={ctaLabel}
              aria-describedby={native ? "paywall-native-terms" : "paywall-trial-summary paywall-payment-note"}
              className="paywall-cta"
              onClick={startPurchase}
              disabled={busy}
            >
              {ctaLabel}
              <ArrowRight className="h-7 w-7 shrink-0" aria-hidden="true" />
            </button>
            {feedbackSource !== "restore" ? <OperationFeedback error={error} status={operationStatus} /> : null}
            {(
              <button type="button" onClick={onStartLearning || onMaybeLater} disabled={busy} className="paywall-free">
                {onStartLearning ? tr("Open free introduction") : tr("Back to home")}
              </button>
            )}
          </section>
        </div>
        <LegalFooter busy={busy} native={native} onRestore={restore} />
        {feedbackSource === "restore" ? <div className="subscription-restore-feedback"><OperationFeedback error={error} status={operationStatus || restoreAnnouncement} /></div> : null}
      </div>
    </div>
  );
}
