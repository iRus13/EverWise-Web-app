import { tr, useLocale } from '../i18n';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, HelpCircle } from "lucide-react";
import Field from "../components/Field";
import ReadAloud from "../components/ReadAloud";
import { authErrorMessage } from "../utils/authErrors";
import { buildResearchSnapshot } from "../utils/partnerResearch.js";
import "../styles/account-experience.css";
import {
  isValidEmail,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
  USERNAME_MIN_LENGTH,
} from "../utils/validation";

const PUBLIC_STEP_IDS = [1, 2, 3, 4, 5, 7, 11, 12];
const SPONSORED_STEP_IDS = [1, 2, 3, 4, 5, 7, 11, "consent", 12];

const options = {
  internetUse: [
    "Every day",
    "A few times a week",
    "Rarely",
    "Almost never",
  ],
  primaryDevice: [
    "Smartphone",
    "Tablet",
    "Computer",
    "TV",
  ],
  confidence: [
    "Confident",
    "Sometimes I need help",
    "I often have difficulties",
    "I’m just getting started",
  ],
  scamFrequency: [
    { value: "never", label: "Never" },
    { value: "few", label: "A few times (1–4)" },
    { value: "often", label: "Often (5–10)" },
    { value: "many", label: "Many times (10+)" },
  ],
  concerns: [
    "Scam calls and messages",
    "Money or bank-card theft",
    "Suspicious links",
    "Account hacking",
    "Fake news",
    "Knowing what to trust",
  ],
  scamScenario: [
    "Open the link",
    "Reply to the message",
    "Call the bank using its official number",
    "I’m not sure",
  ],
  aiExperience: [
    "Yes, regularly",
    "I’ve tried it a few times",
    "I’ve heard of it",
    "I don’t know what it is yet",
  ],
  accessibility: [
    "Arthritis or joint discomfort",
    "Memory difficulties",
    "Vision loss",
    "Tremors or hand movement",
    "Hearing difficulties",
    "Another need",
    "Prefer not to say",
  ],
  trustedContact: ["Yes", "Maybe later", "No"],
};

const prompts = {
  1: "Let’s make the internet and artificial intelligence easier and safer. Tell us what we should call you and your age.",
  2: "How often do you use the internet, and which device do you use most often?",
  3: "How confident do you feel online? Sometimes needing help is completely normal.",
  4: "What worries you most about online safety? Choose all that apply.",
  5: "Your bank card is locked. Open this link immediately. What would you do?",
  7: "Have you used artificial intelligence, such as ChatGPT or a voice assistant?",
  11: "Tell us what could make the app more comfortable, and whether you may want help from a trusted person.",
  consent: "Would you like to share a minimized copy to help improve EverWise?",
  12: "Create a secure account so your personal plan and lesson progress are saved.",
};
const stepTitles = {
  2: "How you get online",
  3: "How do you feel online?",
  4: "What worries you most?",
  5: "How would you respond?",
  7: "Have you tried AI?",
  11: "Make it easier",
};

function ChoiceButton({ selected, children, onClick, multi = false, tabIndex }) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      tabIndex={tabIndex}
      onClick={onClick}
      className="interview-choice"
    >
      <span
        className="interview-choice-mark"
        aria-hidden="true"
      >
        {selected ? <Check className="h-5 w-5" strokeWidth={3} /> : null}
      </span>
      <span>{children}</span>
    </button>
  );
}

function Choices({ values, selected, onSelect, multi = false, label, id, invalid }) {
  const radioValues = values.map((option) =>
    typeof option === "string" ? option : option.value,
  );
  const selectedIndex = multi
    ? -1
    : radioValues.findIndex((value) => value === selected);

  const handleKeyDown = (event) => {
    if (multi) return;
    const keys = [
      "ArrowRight",
      "ArrowDown",
      "ArrowLeft",
      "ArrowUp",
      "Home",
      "End",
    ];
    if (!keys.includes(event.key)) return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll('[role="radio"]'),
    );
    const currentIndex = buttons.indexOf(event.target.closest('[role="radio"]'));
    if (currentIndex < 0 || buttons.length === 0) return;
    event.preventDefault();
    let nextIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = buttons.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    }
    onSelect(radioValues[nextIndex]);
    buttons[nextIndex].focus();
  };

  return (
    <div
      className="mt-3 space-y-3"
      id={id}
      data-form-choices
      data-form-field
      role={multi ? "group" : "radiogroup"}
      aria-label={tr(label)}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? "profile-validation-error" : undefined}
      onKeyDown={handleKeyDown}
    >
      {values.map((option, index) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <ChoiceButton
            key={value}
            multi={multi}
            tabIndex={
              multi
                ? undefined
                : selectedIndex < 0
                  ? index === 0
                    ? 0
                    : -1
                  : index === selectedIndex
                    ? 0
                    : -1
            }
            selected={
              multi ? selected.includes(value) : selected === value
            }
            onClick={() => onSelect(value)}
          >
            {tr(label)}
          </ChoiceButton>
        );
      })}
    </div>
  );
}

function HelpfulNote({ children }) {
  return (
    <div
      className="mt-5 rounded-2xl border-2 border-sage/30 bg-sage/10 px-5 py-4 text-lg leading-relaxed text-ink"
      role="status"
    >
      <p className="font-bold text-sage-dark">A useful first step</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

export default function ProfileInterview({
  partner = null,
  initialInterview = null,
  existingAccount = false,
  externalBusy = false,
  externalError = "",
  onComplete,
  onBack,
  onLogIn,
}) {
  useLocale();
  const contentRef = useRef(null);
  const stepHeadingRef = useRef(null);
  const activeStepIds =
    partner && !existingAccount ? SPONSORED_STEP_IDS : PUBLIC_STEP_IDS;
  const totalSteps = activeStepIds.length;
  const initial = initialInterview || {};
  const [stepIndex, setStepIndex] = useState(
    initialInterview ? totalSteps - 1 : 0,
  );
  const previousStepIndexRef = useRef(stepIndex);
  const [name, setName] = useState(initial.name || "");
  const [age, setAge] = useState(
    initial.age == null ? "" : String(initial.age),
  );
  const [internetUse, setInternetUse] = useState(initial.internetUse || "");
  const [primaryDevice, setPrimaryDevice] = useState(initial.primaryDevice || "");
  const [confidence, setConfidence] = useState(initial.confidence || "");
  const [scamFrequency, setScamFrequency] = useState(initial.scamFrequency || "");
  const [concerns, setConcerns] = useState(initial.concerns || []);
  const [scamScenario, setScamScenario] = useState(initial.scamScenario || "");
  const [aiExperience, setAiExperience] = useState(initial.aiExperience || "");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(
    initial.accessibilityNeeds || [],
  );
  const [trustedContact, setTrustedContact] = useState(initial.trustedContact || "");
  const [researchConsent, setResearchConsent] = useState(
    initial.researchConsent ?? null,
  );
  const [email, setEmail] = useState(initial.email || "");
  const [emailTouched, setEmailTouched] = useState(false);
  const [username, setUsername] = useState(initial.username || "");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [password, setPassword] = useState(initial.password || "");
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const isBusy = busy || externalBusy;

  const step = activeStepIds[stepIndex];
  const progress = useMemo(
    () => ((stepIndex + 1) / totalSteps) * 100,
    [stepIndex, totalSteps],
  );

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    if (previousStepIndexRef.current !== stepIndex) {
      stepHeadingRef.current?.focus();
      previousStepIndexRef.current = stepIndex;
    }
  }, [stepIndex]);

  useEffect(() => {
    setError("");
    setErrorField("");
  }, [name, age, internetUse, primaryDevice, confidence, scamFrequency, concerns,
    scamScenario, aiExperience, accessibilityNeeds, trustedContact, researchConsent,
    email, username, password]);

  const leaveForLogIn = () => {
    onLogIn?.({ name, age, internetUse, primaryDevice, confidence, scamFrequency,
      concerns, scamScenario, aiExperience, accessibilityNeeds, trustedContact,
      researchConsent, email, username });
  };

  const toggle = (value, current, setCurrent) => {
    if (value === "Prefer not to say") {
      setCurrent(current.includes(value) ? [] : [value]);
      return;
    }
    const withoutPrivate = current.filter(
      (item) => item !== "Prefer not to say",
    );
    setCurrent(
      withoutPrivate.includes(value)
        ? withoutPrivate.filter((item) => item !== value)
        : [...withoutPrivate, value],
    );
  };

  const validateStep = () => {
    const missing = (field, message) => ({ field, message });
    if (step === 1) {
      const ageNumber = Number(age);
      if (!name.trim()) return missing("name", "Please enter your name.");
      if (!age || !Number.isFinite(ageNumber) || ageNumber < 18 || ageNumber > 120) {
        return missing("age", "Please enter an age between 18 and 120.");
      }
    }
    if (step === 2 && (!internetUse || !primaryDevice)) {
      return missing(!internetUse ? "internetUse" : "primaryDevice", "Please choose one answer for both questions.");
    }
    if (step === 3 && !confidence) return missing("confidence", "Please choose one answer.");
    if (step === 4 && concerns.length === 0) {
      return missing("concerns", "Please choose at least one concern, or skip this question.");
    }
    if (step === 5 && !scamScenario) return missing("scamScenario", "Please choose one answer.");
    if (step === 7 && !aiExperience) return missing("aiExperience", "Please choose one answer.");
    if (step === 11 && !trustedContact) {
      return missing("trustedContact", "Please choose whether you may want trusted-person help.");
    }
    if (step === "consent" && researchConsent === null) {
      return missing("researchConsent", "Please choose Yes or No before continuing.");
    }
    if (step === 12) {
      if (existingAccount) return "";
      if (partner) {
        setEmailTouched(true);
        if (!email.trim()) return missing("email", "Please enter your email.");
        if (!isValidEmail(email)) {
          return missing("email", "Please enter a complete email like name@example.com.");
        }
      } else {
        setUsernameTouched(true);
        if (!username.trim()) return missing("username", "Please choose a username.");
        if (!isValidUsername(username)) {
          return missing("username", `Usernames need at least ${USERNAME_MIN_LENGTH} characters and can use letters, numbers, dots, underscores and hyphens.`);
        }
      }
      if (password.length < 6) {
        return missing("password", "Please choose a password with at least 6 characters.");
      }
    }
    return "";
  };

  const submit = async () => {
    if (isBusy) return;
    const nextError = validateStep();
    if (nextError) {
      setError(nextError.message);
      setErrorField(nextError.field);
      const target = contentRef.current?.querySelector(`#profile-${nextError.field}`);
      // Focus during the tap so iOS can open the keyboard. The shared focus
      // handler reveals the target within the form after the keyboard resizes it.
      const control = target?.matches("input")
        ? target
        : target?.querySelector('[role="radio"], [role="checkbox"]');
      control?.focus({ preventScroll: true });
      return;
    }
    setError("");
    setErrorField("");

    if (stepIndex < totalSteps - 1) {
      setStepIndex((current) => current + 1);
      setShowHelp(false);
      return;
    }

    setBusy(true);
    try {
      const interview = {
        name: name.trim(),
        age: Number(age),
        password,
        internetUse,
        primaryDevice,
        confidence,
        scamFrequency,
        concerns,
        scamScenario,
        aiExperience,
        accessibilityNeeds,
        trustedContact,
      };
      if (!existingAccount && partner) interview.email = normalizeEmail(email);
      else if (!existingAccount) interview.username = normalizeUsername(username);
      if (partner && !existingAccount) {
        interview.researchConsent = researchConsent;
        interview.researchSnapshot = buildResearchSnapshot(interview, {
          consent: researchConsent,
          consentedAt: new Date().toISOString(),
        });
      }
      await onComplete(interview);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const skip = () => {
    if (isBusy) return;
    setError("");
    setErrorField("");
    setShowHelp(false);
    if (stepIndex < totalSteps - 1) {
      setStepIndex((current) => current + 1);
    }
  };

  const previous = () => {
    if (isBusy) return;
    setError("");
    setErrorField("");
    setShowHelp(false);
    if (stepIndex === 0) onBack();
    else setStepIndex((current) => current - 1);
  };

  const question = tr(prompts[step]);
  const canSkip =
    stepIndex > 0 &&
    stepIndex < totalSteps - 1 &&
    step !== "consent";

  return (
    <div className="onboarding-focus interview-focus profile-flow flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 px-6 pb-3 pt-5">
        <div className="grid grid-cols-[44px_1fr_60px] items-center gap-2">
          <button
            type="button"
            onClick={previous}
            disabled={isBusy}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink enabled:hover:bg-ink/5 enabled:active:bg-ink/5"
            aria-label={
              stepIndex === 0 ? tr("Back to welcome") : tr("Previous question")
            }
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={2.5} />
          </button>
          <p className="text-center text-base font-bold text-ink-soft">
            {stepIndex + 1} {tr("of")} {totalSteps}
          </p>
          {canSkip ? (
            <button
              type="button"
              onClick={skip}
              disabled={isBusy}
              className="min-h-11 text-base font-bold text-ink-soft underline decoration-transparent underline-offset-4 hover:decoration-current"
            >{tr("Skip")}</button>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-ink/10"
          role="progressbar"
          aria-label={tr("Personal plan progress")}
          aria-valuemin="1"
          aria-valuemax={totalSteps}
          aria-valuenow={stepIndex + 1}
        >
          <div
            className="h-full rounded-full bg-clay transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div
        ref={contentRef}
        className="interview-body"
      >
        <div className="flex items-start justify-between gap-3 pt-2">
          <div>
            <h1 ref={stepHeadingRef} tabIndex={-1} className="interview-title">
              {existingAccount && step === 1
                ? tr("Your personal lessons")
                : step === 1
                  ? tr("Let’s make Everwise fit you")
                : step === "consent"
                  ? "Your choice about research"
                : step === 12
                  ? existingAccount
                    ? tr("Finish your personal profile")
                    : tr("Save your personal plan")
                  : tr(stepTitles[step])}
            </h1>
            {step === 1 ? (
              <p className="interview-description">
                {existingAccount
                  ? tr("Your answers and lesson progress will be saved to this account.")
                  : tr("A few simple questions will help us prepare your starting plan. This takes about two minutes.")}
              </p>
            ) : null}
            {step === 12 ? (
              <p className="interview-description">
                {existingAccount
                  ? "Your secure account and sponsored access are already active. Finish these answers to rebuild your personal plan."
                  : tr("Create a secure account so your answers and lesson progress stay available.")}
              </p>
            ) : null}
            {step === 7 ? <p className="interview-description">{tr("Artificial intelligence includes tools such as ChatGPT and voice assistants.")}</p> : null}
          </div>
        </div>

        {step !== 12 ? (
          <div className="interview-reading">
            <ReadAloud text={question} label={tr("Read this question")} />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-7 space-y-6 animate-fade-up">
            <Field
              id="profile-name"
              ariaInvalid={errorField === "name" || undefined}
              describedBy={errorField === "name" ? "profile-validation-error" : undefined}
              label={tr("What should we call you?")}
              value={name}
              onChange={setName}
              autoComplete="name"
              autoCapitalize="words"
              placeholder="Jane"
            />
            <Field
              id="profile-age"
              ariaInvalid={errorField === "age" || undefined}
              describedBy={errorField === "age" ? "profile-validation-error" : undefined}
              label={tr("Your age")}
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(value) => {
                if (value === "" || /^\d+$/.test(value)) setAge(value);
              }}
              autoComplete="age"
              placeholder="68"
              min="0"
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="animate-fade-up">
            <fieldset className="mt-6">
              <legend className="text-xl font-bold text-ink">{tr("How often do you use the internet?")}</legend>
              <Choices
                id="profile-internetUse"
                invalid={errorField === "internetUse"}
                values={options.internetUse}
                selected={internetUse}
                onSelect={setInternetUse}
                label={tr("How often do you use the internet?")}
              />
            </fieldset>
            <fieldset className="mt-7">
              <legend className="text-xl font-bold text-ink">{tr("Which device do you use most?")}</legend>
              <Choices
                id="profile-primaryDevice"
                invalid={errorField === "primaryDevice"}
                values={options.primaryDevice}
                selected={primaryDevice}
                onSelect={setPrimaryDevice}
                label={tr("Which device do you use most?")}
              />
            </fieldset>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="animate-fade-up">
            <Choices
              id="profile-confidence"
              invalid={errorField === "confidence"}
              values={options.confidence}
              selected={confidence}
              onSelect={setConfidence}
              label={tr("How confident do you feel online?")}
            />
            <fieldset className="mt-7">
              <legend className="text-xl font-bold text-ink">{tr("Have you ever lost money or information to a scam?")}</legend>
              <Choices
                values={options.scamFrequency}
                selected={scamFrequency}
                onSelect={setScamFrequency}
                label={tr("Have you ever lost money or information to a scam?")}
              />
            </fieldset>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="animate-fade-up">
            <p className="mt-2 text-lg text-ink-soft">{tr("Choose all that apply.")}</p>
            <Choices
              id="profile-concerns"
              invalid={errorField === "concerns"}
              values={options.concerns}
              selected={concerns}
              label={tr("What worries you most?")}
              multi
              onSelect={(value) => toggle(value, concerns, setConcerns)}
            />
          </div>
        ) : null}

        {step === 5 ? (
          <div className="animate-fade-up">
            <blockquote className="interview-message">{tr("“Your bank card is locked. Open this link immediately.”")}</blockquote>
            <Choices
              id="profile-scamScenario"
              invalid={errorField === "scamScenario"}
              values={options.scamScenario}
              selected={scamScenario}
              onSelect={setScamScenario}
              label={tr("What would you do about the urgent bank message?")}
            />
            {scamScenario ? (
              <HelpfulNote>{tr("Don’t open the link. Call the bank using the number on your card or its official website. You made a useful safety decision by stopping to check.")}</HelpfulNote>
            ) : null}
          </div>
        ) : null}

        {step === 7 ? (
          <div className="animate-fade-up">
            <Choices
              id="profile-aiExperience"
              invalid={errorField === "aiExperience"}
              values={options.aiExperience}
              selected={aiExperience}
              onSelect={setAiExperience}
              label={tr("Have you used artificial intelligence?")}
            />
          </div>
        ) : null}

        {step === 11 ? (
          <div className="animate-fade-up">
            <fieldset className="mt-2">
              <legend className="text-xl font-bold text-ink">{tr("Could any of these affect how you use the app?")}</legend>
              <p className="mt-2 text-base leading-relaxed text-ink-soft">{tr("Optional. This is not a medical assessment. It only helps us improve text, audio, and controls.")}</p>
              <Choices
                values={options.accessibility}
                selected={accessibilityNeeds}
                label={tr("Could any of these affect how you use the app?")}
                multi
                onSelect={(value) =>
                  toggle(value, accessibilityNeeds, setAccessibilityNeeds)
                }
              />
            </fieldset>
            <fieldset className="mt-7">
              <legend className="text-xl font-bold text-ink">{tr("Would you like trusted-person help later?")}</legend>
              <Choices
                id="profile-trustedContact"
                invalid={errorField === "trustedContact"}
                values={options.trustedContact}
                selected={trustedContact}
                onSelect={setTrustedContact}
                label={tr("Would you like trusted-person help later?")}
              />
            </fieldset>
          </div>
        ) : null}

        {step === "consent" ? (
          <div className="mt-5 animate-fade-up">
            <div className="rounded-2xl bg-cream-card px-5 py-4 text-lg leading-relaxed text-ink shadow-card">
              <p className="font-bold">{tr("Your personal plan")}</p>
              <p className="mt-1">{tr("We save your answers to create your personal plan and remember your accessibility preferences.")}</p>
            </div>
            <fieldset className="mt-6">
              <legend className="text-xl font-bold leading-snug text-ink">
                Optional research choice
              </legend>
              <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                Your answers are not sold. If you say yes, EverWise keeps a
                minimized, pseudonymized copy under an internal account link.
                That link is used only to delete your research data and combine
                it into group totals. {partner.name} receives group totals only,
                never your individual answers. Saying no does not affect your
                free access.
              </p>
              <Choices
                id="profile-researchConsent"
                invalid={errorField === "researchConsent"}
                values={[
                  {
                    value: true,
                    label: "Yes, share a minimized copy to improve EverWise",
                  },
                  {
                    value: false,
                    label: "No, use my answers only for my personal plan",
                  },
                ]}
                selected={researchConsent}
                onSelect={setResearchConsent}
                label="Optional research choice"
              />
            </fieldset>
          </div>
        ) : null}

        {step === 12 ? (
          <div className="mt-7 space-y-6 animate-fade-up">
            {existingAccount ? (
              <div className="rounded-2xl bg-cream-card px-5 py-5 text-lg leading-relaxed text-ink shadow-card">
                <p className="font-bold">Account ready</p>
                <p className="mt-1">
                  We will save this profile to your existing account. You do not
                  need to enter your password or claim another sponsored place.
                </p>
              </div>
            ) : (
              <>
                {partner ? (
                  <>
                    <Field
                      id="profile-email"
                      label={tr("Email")}
                      type="email"
                      value={email}
                      onChange={setEmail}
                      onBlur={() => setEmailTouched(true)}
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="jane@example.com"
                      inputMode="email"
                      ariaInvalid={emailTouched && !isValidEmail(email)}
                      describedBy="profile-email-help"
                    />
                    <p
                      id="profile-email-help"
                      className={`-mt-3 text-base font-semibold ${
                        emailTouched && !isValidEmail(email)
                          ? "text-alert"
                          : "text-ink-soft"
                      }`}
                      role={
                        emailTouched && !isValidEmail(email)
                          ? "alert"
                          : undefined
                      }
                    >
                      {emailTouched && !isValidEmail(email)
                        ? tr("Enter a complete address like name@example.com.")
                        : tr("We’ll use this address for sign-in and password recovery.")}
                    </p>
                  </>
                ) : (
                  <>
                    <Field
                      id="profile-username"
                      label={tr("Username")}
                      value={username}
                      onChange={setUsername}
                      onBlur={() => setUsernameTouched(true)}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="janemiller"
                      ariaInvalid={usernameTouched && !isValidUsername(username)}
                      describedBy="profile-username-help"
                    />
                    <p
                      id="profile-username-help"
                      className={`-mt-3 text-base font-semibold ${
                        usernameTouched && !isValidUsername(username)
                          ? "text-alert"
                          : "text-ink-soft"
                      }`}
                      role={
                        usernameTouched && !isValidUsername(username)
                          ? "alert"
                          : undefined
                      }
                    >
                      {usernameTouched && !isValidUsername(username)
                        ? `Use at least ${USERNAME_MIN_LENGTH} letters or numbers. Dots, underscores and hyphens are okay.`
                        : tr("You’ll use this name to sign in.")}
                    </p>
                  </>
                )}
                <Field
                  id="profile-password"
                  ariaInvalid={errorField === "password" || undefined}
                  describedBy={errorField === "password" ? "profile-validation-error" : undefined}
                  label={tr("Choose a password")}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  placeholder={tr("At least 6 characters")}
                />
                <p className="text-center text-base text-ink-soft">{tr("Already have an account?")}{" "}
                  <button
                    type="button"
                    onClick={leaveForLogIn}
                    disabled={isBusy}
                    className="inline-flex min-h-[44px] items-center px-1 align-middle font-bold text-clay underline underline-offset-4"
                  >{tr("Log in")}</button>
                </p>
              </>
            )}
          </div>
        ) : null}

        {canSkip ? (
          <button
            type="button"
            onClick={() => setShowHelp((current) => !current)}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl px-2 text-lg font-bold text-clay underline decoration-transparent underline-offset-4 hover:decoration-current"
            aria-expanded={showHelp}
          >
            <HelpCircle className="h-6 w-6" aria-hidden="true" />{tr("I don’t understand")}</button>
        ) : null}

        {showHelp ? (
          <p
            className="mt-3 rounded-2xl bg-cream-card px-5 py-4 text-lg leading-relaxed text-ink shadow-card"
            role="status"
          >{tr("There is no test score and no embarrassing answer. Choose the closest option, or tap Skip. You can change your preferences later.")}</p>
        ) : null}

      </div>

      <footer className="shrink-0 border-t border-ink/10 bg-cream px-7 pb-6 pt-4">
        {externalError || error ? (
          <p
            id="profile-validation-error"
            role="alert"
            className="mb-3 text-base font-semibold text-alert"
          >
            {tr(externalError || error)}
          </p>
        ) : null}

        <button
          type="button"
          className="btn-primary"
          onClick={submit}
          disabled={isBusy}
        >
          {isBusy
            ? existingAccount
              ? tr("Saving your profile…")
              : partner
                ? tr("Claiming your free access…")
              : tr("Saving your answers…")
            : stepIndex === totalSteps - 1
              ? existingAccount
                ? tr("Finish my profile")
                : tr("Build my plan")
              : stepIndex === 0
                ? tr("Start")
                : tr("Continue")}
        </button>
      </footer>
    </div>
  );
}
