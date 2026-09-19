import React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

await vi.hoisted(async () => { globalThis.React = (await import("react")).default; });
const state = vi.hoisted(() => ({ authCallback: null, updateDoc: vi.fn(), signOut: vi.fn() }));
vi.mock("../src/firebase", () => ({ auth: {}, db: {} }));
vi.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: vi.fn() }, createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(), reload: vi.fn(), reauthenticateWithCredential: vi.fn(),
  sendPasswordResetEmail: vi.fn(), signInWithEmailAndPassword: vi.fn(), signOut: state.signOut,
  onAuthStateChanged: vi.fn((_auth, callback) => { state.authCallback = callback; callback(null); return () => {}; }),
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, collection, uid) => ({collection, uid})),
  deleteDoc: vi.fn(), setDoc: vi.fn(), updateDoc: state.updateDoc,
  getDoc: vi.fn(async () => ({ exists: () => true, data: () => ({
    name: "QA Learner", onboardingCompleted: true, profileInterview: {},
    completedLessons: [], badges: [], subscriptionStatus: "expired", plan: null,
  }) })),
}));
vi.mock("../src/services/billingAccess.js", async (original) => ({
  ...(await original()),
  fetchBillingAccess: vi.fn(async () => ({ access: "none", status: "none", plan: null, trialEndsAt: null, currentPeriodEndsAt: null, cancelAtPeriodEnd: false, canStartTrial: true, canManage: false })),
  fetchBillingPlans: vi.fn(async () => ({ plans: [
    { key: "annual", currency: "usd", unitAmount: 6000, interval: "year", trialDays: 7 },
    { key: "monthly", currency: "usd", unitAmount: 799, interval: "month", trialDays: 3 },
  ] })),
}));
vi.mock("../src/services/partnerAccess.js", async (original) => ({
  ...(await original()), fetchPartnerAccess: vi.fn(async () => ({status: "none"})),
}));
import App from "../src/App.jsx";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.localStorage.clear(); window.sessionStorage.clear(); });

test("real screens complete free learning, save progress, open settings/paywall and log out", async () => {
  const timeout = window.setTimeout.bind(window);
  vi.spyOn(window, "setTimeout").mockImplementation((fn, delay, ...args) => timeout(fn, delay === 3000 ? 0 : delay, ...args));
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", vi.fn(() => ({matches:false, addEventListener:vi.fn(), removeEventListener:vi.fn()})));
  state.updateDoc.mockResolvedValue();
  state.signOut.mockImplementation(async () => state.authCallback(null));
  render(<App />);
  await act(async () => new Promise(resolve => timeout(resolve, 0)));
  await act(async () => state.authCallback({uid: "qa-user", email: "qa@example.com", getIdToken: async () => "synthetic-token"}));
  fireEvent.click(await screen.findByRole("button", {name: "Continue learning"}));
  await act(async () => fireEvent.click(screen.getByRole("button", {name: "Start lesson: Welcome to Everwise"})));
  expect(screen.getByRole("heading", {name: "How Everwise Works"})).toBeVisible();
  await act(async () => fireEvent.click(screen.getByRole("button", {name: "Continue", exact:true})));
  expect(screen.getByRole("heading", {name: "Welcome Aboard!"})).toBeVisible();
  expect(state.updateDoc).toHaveBeenCalledWith(expect.objectContaining({uid:"qa-user"}), expect.objectContaining({completedLessons:["welcome"]}));
  fireEvent.click(screen.getByRole("button", {name: "Back to your path"}));
  fireEvent.click(screen.getByRole("button", {name: "Back to home"}));
  const nav = () => within(screen.getByRole("navigation", {name: "Primary navigation"}));
  fireEvent.click(nav().getByRole("button", {name: /settings/i}));
  await act(async () => fireEvent.click(screen.getByRole("button", {name: /View plans/i})));
  expect(screen.getByTestId("browser-paywall")).toBeVisible();
  fireEvent.click(screen.getByRole("button", {name: "Continue with free lessons"}));
  fireEvent.click(nav().getByRole("button", {name: /settings/i}));
  await act(async () => fireEvent.click(screen.getByRole("button", {name: /Log out/i})));
  expect(screen.getByRole("button", {name:"Get Started"})).toBeVisible();
});
