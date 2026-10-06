import { hasOwn } from "./hasOwn.js";
// Device-local unfinished work, scoped to the learner. Never grants access or
// awards completion; those still go through the normal application checks.
const STORAGE_KEY = "everwise.assessmentPosition.v1";
const index = value => Number.isSafeInteger(value) && value >= 0 && value < 500;
const answer = value => value === null || index(value);
const identity = (uid, itemId) => typeof uid === "string" && uid.length > 0 &&
  typeof itemId === "string" && itemId.length > 0 && !uid.includes("\u0000") && !itemId.includes("\u0000");
const keyFor = (uid, itemId) => `${uid}\u0000${itemId}`;

// A content fingerprint invalidates saved answers after an authored revision.
// This is cache invalidation, not an integrity or authorization mechanism.
export function assessmentRevision(item) {
  const text = JSON.stringify(item);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `${text.length}:${hash >>> 0}`;
}

function normalize(value) {
  if (!value || typeof value.revision !== "string" || !/^\d+:\d+$/.test(value.revision)) return null;
  const {kind, revision} = value;
  if (kind === "challenge" && index(value.blockIndex) && typeof value.finished === "boolean") {
    return {kind, revision, blockIndex:value.blockIndex, finished:value.finished};
  }
  if (kind === "exam" && ["quiz", "results"].includes(value.phase) &&
      Array.isArray(value.answers) && value.answers.length <= 500 &&
      value.answers.every(answer) && answer(value.selected)) {
    return {kind, revision, phase:value.phase, answers:[...value.answers], selected:value.selected};
  }
  return null;
}

export function restoreAssessmentPosition(item, kind, value) {
  const position = normalize(value);
  if (!position || position.kind !== kind || position.revision !== assessmentRevision(item)) return null;
  if (kind === "challenge") {
    const length = item.blocks?.length || 0;
    return position.blockIndex < length && (!position.finished || position.blockIndex === length - 1) ? position : null;
  }
  const questions = item.questions || [];
  const {answers, selected, phase} = position;
  if (!questions.length || answers.length > questions.length ||
      answers.some((choice, i) => choice !== null && choice >= questions[i].options.length)) return null;
  if (phase === "results") return answers.length === questions.length && selected === null ? position : null;
  return answers.length < questions.length && (selected === null || selected < questions[answers.length].options.length) ? position : null;
}

function readStore(storage) {
  try {
    const value = JSON.parse(storage?.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function readAssessmentPosition({uid, itemId, storage} = {}) {
  if (!identity(uid, itemId)) return null;
  const values = readStore(storage), key = keyFor(uid, itemId);
  return hasOwn(values, key) ? normalize(values[key]) : null;
}

export function saveAssessmentPosition({uid, itemId, position, storage} = {}) {
  if (!identity(uid, itemId) || typeof storage?.setItem !== "function") return false;
  const normalized = normalize(position);
  if (!normalized) return false;
  try {
    const values = readStore(storage);
    values[keyFor(uid, itemId)] = normalized;
    storage.setItem(STORAGE_KEY, JSON.stringify(values));
    return true;
  } catch { return false; }
}

export function clearAssessmentPosition({uid, itemId, storage} = {}) {
  if (!identity(uid, itemId) || typeof storage?.setItem !== "function") return false;
  try {
    const values = readStore(storage);
    delete values[keyFor(uid, itemId)];
    storage.setItem(STORAGE_KEY, JSON.stringify(values));
    return true;
  } catch { return false; }
}

export function clearAllAssessmentPositions({storage} = {}) {
  if (typeof storage?.removeItem !== "function") return false;
  try { storage.removeItem(STORAGE_KEY); return true; } catch { return false; }
}
