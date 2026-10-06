import { hasOwn } from "./hasOwn.js";
// Remembers where a learner had reached inside a lesson so leaving part-way
// through and coming back does not restart the lesson. Position is kept per
// learner and per lesson, and is cleared once the lesson is finished.
//
// This is deliberately position-only: it records which step someone reached,
// never whether they are entitled to be there. Entry still goes through the
// normal access check, so a saved position can never reopen paid content.

const STORAGE_KEY = "everwise.lessonPosition.v1";
const MAX_STEP_INDEX = 500;

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const validIndex = (value) =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_STEP_INDEX;

const readStore = (storage) => {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (typeof raw !== "string" || raw.length === 0) return {};
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    // Unreadable, disabled, or corrupt storage must never break the lesson.
    return {};
  }
};

const writeStore = (storage, value) => {
  // Optional chaining would quietly succeed with no storage at all, reporting
  // a save that never happened.
  if (typeof storage?.setItem !== "function") return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    // A full or blocked store just means resume is unavailable, which is not
    // worth interrupting the lesson for.
    return false;
  }
};

const entryKey = (uid, lessonId) => `${uid}\u0000${lessonId}`;

const validQueue = (value) => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_STEP_INDEX) return null;
  return value.every(validIndex) && new Set(value).size === value.length ? [...value] : null;
};

const validPosition = (value) => {
  if (!isPlainObject(value)) return null;
  const { phase, blockIndex, quizIndex, score } = value;
  if (phase !== "block" && phase !== "quiz" && phase !== "review") return null;
  if (!validIndex(blockIndex) || !validIndex(quizIndex)) return null;
  if (!validIndex(score)) return null;
  // The review phase also carries which questions are still owed a correct
  // answer, so leaving mid-review and returning does not restart the quiz.
  const reviewQueue = validQueue(value.reviewQueue);
  if (reviewQueue === null) return null;
  // Optional for old saved places. Keep first-attempt history across reloads
  // and backwards navigation without saving answer text or personal data.
  const answeredThrough = value.answeredThrough;
  if (answeredThrough !== undefined &&
      (!validIndex(answeredThrough) || score + reviewQueue.length > answeredThrough ||
       (phase !== "block" && quizIndex > answeredThrough) ||
       reviewQueue.some(index => index >= answeredThrough))) return null;
  return { phase, blockIndex, quizIndex, score, reviewQueue,
    ...(answeredThrough === undefined ? {} : { answeredThrough }) };
};

export function readLessonPosition({ uid, lessonId, storage } = {}) {
  if (typeof uid !== "string" || !uid) return null;
  if (typeof lessonId !== "string" || !lessonId) return null;
  const store = readStore(storage);
  const key = entryKey(uid, lessonId);
  return hasOwn(store, key) ? validPosition(store[key]) : null;
}

export function saveLessonPosition({ uid, lessonId, position, storage } = {}) {
  if (typeof uid !== "string" || !uid) return false;
  if (typeof lessonId !== "string" || !lessonId) return false;
  const normalized = validPosition(position);
  if (!normalized) return false;
  const store = readStore(storage);
  store[entryKey(uid, lessonId)] = normalized;
  return writeStore(storage, store);
}

export function clearLessonPosition({ uid, lessonId, storage } = {}) {
  if (typeof uid !== "string" || !uid) return false;
  if (typeof lessonId !== "string" || !lessonId) return false;
  const store = readStore(storage);
  const key = entryKey(uid, lessonId);
  if (!hasOwn(store, key)) return false;
  delete store[key];
  return writeStore(storage, store);
}

// Used on sign-out so one learner's place is never shown to the next person
// using the same device.
export function clearAllLessonPositions({ storage } = {}) {
  if (typeof storage?.removeItem !== "function") return false;
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
