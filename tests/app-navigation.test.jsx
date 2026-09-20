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
  arrayUnion: vi.fn((...values) => ({operation:"arrayUnion", values})),
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
import {sendPasswordResetEmail} from "firebase/auth";
import {getDoc} from "firebase/firestore";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.localStorage.clear(); window.sessionStorage.clear(); });

function prepareProgressTest() {
  state.updateDoc.mockClear();
  const timeout = window.setTimeout.bind(window);
  vi.spyOn(window, "setTimeout").mockImplementation((fn, delay, ...args) => timeout(fn, delay === 3000 ? 0 : delay, ...args));
  Element.prototype.scrollTo = vi.fn(); Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("matchMedia", vi.fn(() => ({matches:false, addEventListener:vi.fn(), removeEventListener:vi.fn()})));
}
const testUser = uid => ({uid, email:`${uid}@example.com`, getIdToken:async()=>"synthetic-token"});
async function renderLearner(uid) {
  const view = render(<App />);
  await screen.findByRole("button", {name:"Get Started"});
  await act(async () => state.authCallback(testUser(uid)));
  await screen.findByRole("button", {name:"Continue learning"});
  return view;
}
async function finishWelcome() {
  fireEvent.click(screen.getByRole("button", {name:"Continue learning"}));
  fireEvent.click(screen.getByRole("button", {name:"Start lesson: Welcome to Everwise"}));
  await screen.findByRole("heading", {name:"How Everwise Works"});
  await act(async () => fireEvent.click(screen.getByRole("button", {name:"Continue", exact:true})));
}

test("pending progress advances immediately and a late save cannot navigate a different account", async () => {
  prepareProgressTest();
  let finishSave;
  state.updateDoc.mockImplementation(() => new Promise(resolve => {finishSave=resolve;}));
  await renderLearner("alice"); await finishWelcome();
  expect(screen.getByRole("heading", {name:"Welcome Aboard!"})).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Saving your progress");
  expect(state.updateDoc).toHaveBeenCalledWith({collection:"users",uid:"alice"}, {
    completedLessons:{operation:"arrayUnion",values:["welcome"]},
    badges:{operation:"arrayUnion",values:["Welcome Aboard"]},
  });
  await act(async () => state.authCallback(testUser("bob")));
  fireEvent.click(await screen.findByRole("button", {name:"Continue learning"}));
  expect(screen.getByRole("button", {name:"Start lesson: Welcome to Everwise"})).toBeVisible();
  await act(async () => finishSave());
  expect(screen.getByRole("button", {name:"Start lesson: Welcome to Everwise"})).toBeVisible();
  expect(screen.queryByRole("heading", {name:"Welcome Aboard!"})).not.toBeInTheDocument();
  expect(state.updateDoc.mock.calls.every(([document])=>document.uid==="alice")).toBe(true);
});

test("pending completion survives App remount and synchronizes after a later retry", async () => {
  prepareProgressTest();
  state.updateDoc.mockImplementation(() => new Promise(()=>{}));
  const first = await renderLearner("reload-user"); await finishWelcome();
  first.unmount();
  state.updateDoc.mockRejectedValue(new Error("offline"));
  await renderLearner("reload-user");
  fireEvent.click(screen.getByRole("button", {name:"Continue learning"}));
  expect(await screen.findByRole("button", {name:"Redo completed lesson: Welcome to Everwise"})).toBeVisible();
  const retry=await screen.findByRole("button", {name:"Retry saving progress"});
  expect(screen.getByRole("status")).toHaveTextContent("saved on this device");
  state.updateDoc.mockResolvedValue();
  await act(async () => fireEvent.click(retry));
  expect(screen.queryByRole("button", {name:"Retry saving progress"})).not.toBeInTheDocument();
  const keys=Array.from({length:localStorage.length},(_,index)=>localStorage.key(index));
  expect(keys.filter(key=>key.startsWith("everwise.progress.pending.v1:"))).toEqual([]);
});

test("blocked local storage does not freeze completion or falsely claim durable progress", async () => {
  prepareProgressTest();
  vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw new Error("quota");});
  state.updateDoc.mockRejectedValue(new Error("offline"));
  await renderLearner("no-storage"); await finishWelcome();
  expect(screen.getByRole("heading", {name:"Welcome Aboard!"})).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Keep this app open");
  expect(screen.getByRole("status")).not.toHaveTextContent("saved on this device");
  await act(async()=>state.authCallback(testUser("no-storage")));
  fireEvent.click(await screen.findByRole("button",{name:"Continue learning"}));
  expect(screen.getByRole("button",{name:"Redo completed lesson: Welcome to Everwise"})).toBeVisible();
  state.updateDoc.mockResolvedValue();
  await act(async()=>fireEvent.click(screen.getByRole("button",{name:"Retry saving progress"})));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("switching to an account without a profile cannot retain the previous learner's profile", async () => {
  prepareProgressTest(); state.updateDoc.mockResolvedValue();
  await renderLearner("alice");
  getDoc.mockResolvedValueOnce({exists:()=>false});
  await act(async()=>state.authCallback(testUser("missing-profile")));
  expect(screen.getByRole("heading",{name:"Your account"})).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("could not load your account");
  expect(screen.queryByRole("button",{name:"Continue learning"})).not.toBeInTheDocument();
});

test("anonymous login recovery reaches Firebase only with a real email address", async () => {
  const timeout = window.setTimeout.bind(window);
  vi.spyOn(window, "setTimeout").mockImplementation((fn, delay, ...args) => timeout(fn, delay === 3000 ? 0 : delay, ...args));
  sendPasswordResetEmail.mockResolvedValue();
  render(<App />);
  fireEvent.click(await screen.findByRole("button", {name:"Log In", exact:true}));
  fireEvent.click(screen.getByRole("button", {name:"Forgot password?"}));
  fireEvent.change(screen.getByLabelText("Email address"), {target:{value:" Learner@Example.com "}});
  fireEvent.click(screen.getByRole("button", {name:"Send reset link"}));
  expect(await screen.findByRole("status")).toHaveTextContent("If an account uses this email address");
  expect(sendPasswordResetEmail).toHaveBeenCalledWith({}, "learner@example.com");
});

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
  expect(await screen.findByRole("heading", {name: "How Everwise Works"})).toBeVisible();
  await act(async () => fireEvent.click(screen.getByRole("button", {name: "Continue", exact:true})));
  expect(screen.getByRole("heading", {name: "Welcome Aboard!"})).toBeVisible();
  expect(state.updateDoc).toHaveBeenCalledWith(expect.objectContaining({uid:"qa-user"}), expect.objectContaining({completedLessons:{operation:"arrayUnion", values:["welcome"]}}));
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
