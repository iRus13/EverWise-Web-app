// Everwise - Digital Literacy track
// Phase 1: Foundations (phase1-lessons.js) + Phase 2: Safe Internet Habits (phase2-lessons.js)
// NOTE: Lesson 6 (What is Wi-Fi?) is referenced in the curriculum but was not in
// the source document. Add it here when written.
//
// BLOCK TYPES: learn, multiselect, flashcards, fillblank,
//              scenario, truefalse, choice, builder

import { phase1Lessons } from "./phase1-lessons.js";
import { phase2Lessons } from "./phase2-lessons.js";
import { phase3Lessons, phase3Exam } from "./phase3-lessons.js";
import { phase4Lessons, phase4Exam } from "./phase4-lessons.js";
import { phase5Lessons, phase5Exam } from "./phase5-lessons.js";
import { phase6Lessons, phase6Exam } from "./phase6-lessons.js";
import { phase7Lessons, phase7Exam } from "./phase7-lessons.js";
import { scamPhase1Lessons } from "./scam-phase1-lessons.js";
import { scamPhase2Lessons } from "./scam-phase2-lessons.js";
import { scamPhase3Lessons } from "./scam-phase3-lessons.js";
import { scamPhase4Lessons } from "./scam-phase4-lessons.js";
import { scamPhase5Lessons } from "./scam-phase5-lessons.js";
import { scamPhase6Lessons } from "./scam-phase6-lessons.js";
import { scamPhase7Lessons } from "./scam-phase7-lessons.js";
import { scamPhase8Lessons } from "./scam-phase8-lessons.js";
import { scamPhase9Lessons } from "./scam-phase9-lessons.js";
import { scamPhase10Lessons } from "./scam-phase10-lessons.js";
import { phaseChallenges } from "./phase-challenges.js";
import { labelFinalLessonsForChallenges } from "../utils/courseProgress.js";

// Sorting and word-matching activities were removed from the product. Filter
// them at the curriculum boundary so older lesson files cannot render one.
function withoutRemovedActivities(lesson) {
  return {
    ...lesson,
    blocks: (lesson.blocks || []).filter(
      (block) => block.type !== "sort" && block.type !== "match",
    ),
  };
}

export const lessons = phase1Lessons.map(withoutRemovedActivities);
export default lessons;

// The two tracks, each kept in its own curriculum order.
const literacyTrack = [
  ...lessons,
  ...phase2Lessons,
  ...phase3Lessons,
  ...phase4Lessons,
  ...phase5Lessons,
  ...phase6Lessons,
  ...phase7Lessons,
].map(withoutRemovedActivities).map((l) => ({
  ...l,
  track: l.track || "literacy",
}));

const scamTrack = [
  ...scamPhase1Lessons,
  ...scamPhase2Lessons,
  ...scamPhase3Lessons,
  ...scamPhase4Lessons,
  ...scamPhase5Lessons,
  ...scamPhase6Lessons,
  ...scamPhase7Lessons,
  ...scamPhase8Lessons,
  ...scamPhase9Lessons,
  ...scamPhase10Lessons,
].map(withoutRemovedActivities);

/**
 * Path order is one continuous sequence: Foundations phases 1–7, then
 * Scam-Proof phases 8–17. Within each phase, lessons keep their local `order`.
 */
// Lessons in the order they appear on the path, with a computed `pathOrder`
// that exams and challenges are slotted against.
const sortedLessons = [...literacyTrack, ...scamTrack].sort(
  (a, b) => a.phase - b.phase || a.order - b.order,
);

export const lessonsByOrder = labelFinalLessonsForChallenges(
  sortedLessons,
  phaseChallenges,
).map((lesson, pathOrder) => ({ ...lesson, pathOrder }));

export const allLessons = lessonsByOrder;

/** Where a phase's last lesson sits on the path — exams follow it. */
export function pathOrderForPhase(phase) {
  const inPhase = lessonsByOrder.filter((l) => l.phase === phase);
  return inPhase.length ? inPhase[inPhase.length - 1].pathOrder : -1;
}

// Ungraded phase challenges (after the phase's last lesson, before the exam).
export const challengesByOrder = phaseChallenges
  .filter(Boolean)
  .map(withoutRemovedActivities)
  .sort((a, b) => a.order - b.order);

// Phase exams — only real exam objects (phases without an exam simply omit one).
export const examsByOrder = [phase3Exam, phase4Exam, phase5Exam, phase6Exam, phase7Exam]
  .filter((exam) => exam && exam.id && Array.isArray(exam.questions))
  .sort((a, b) => a.order - b.order);

export { phase3Exam, phase4Exam, phase5Exam, phase6Exam, phase7Exam };
