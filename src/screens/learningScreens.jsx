import { hasOwn } from "../utils/hasOwn.js";
import { lessonsByOrder, challengesByOrder, examsByOrder } from "../data/course-catalog.js";
import { labelFinalLessonsForChallenges } from "../utils/courseProgress.js";

// Explicit import boundaries keep unrelated phases out of an activity download.
// Never import the full curriculum aggregator from this runtime module.
const phases = {
  1: () => import("../data/phase1-lessons.js"),
  2: () => import("../data/phase2-lessons.js"),
  3: () => import("../data/phase3-lessons.js"),
  4: () => import("../data/phase4-lessons.js"),
  5: () => import("../data/phase5-lessons.js"),
  6: () => import("../data/phase6-lessons.js"),
  7: () => import("../data/phase7-lessons.js"),
  8: () => import("../data/scam-phase1-lessons.js"),
  9: () => import("../data/scam-phase2-lessons.js"),
  10: () => import("../data/scam-phase3-lessons.js"),
  11: () => import("../data/scam-phase4-lessons.js"),
  12: () => import("../data/scam-phase5-lessons.js"),
  13: () => import("../data/scam-phase6-lessons.js"),
  14: () => import("../data/scam-phase7-lessons.js"),
  15: () => import("../data/scam-phase8-lessons.js"),
  16: () => import("../data/scam-phase9-lessons.js"),
  17: () => import("../data/scam-phase10-lessons.js"),
};
const players = {
  lesson: () => import("./LessonPlayer.jsx"),
  complete: () => import("./Complete.jsx"),
  challenge: () => import("./ChallengePlayer.jsx"),
  exam: () => import("./ExamPlayer.jsx"),
};
const catalogs = {lesson: lessonsByOrder, complete: lessonsByOrder, challenge: challengesByOrder, exam: examsByOrder};

export async function learningItem(kind, itemId) {
  const metadata = hasOwn(catalogs, kind) && catalogs[kind].find(item => item.id === itemId);
  if (!metadata) throw new Error("Learning content unavailable");

  const [content, {default: Player}] = await Promise.all([
    kind === "challenge" ? import("../data/phase-challenges.js") : phases[metadata.phase](),
    players[kind](),
  ]);
  const source = kind === "exam" ? content[`phase${metadata.phase}Exam`]
    : (kind === "challenge" ? content.phaseChallenges : labelFinalLessonsForChallenges(content.default, challengesByOrder))?.find(item => item.id === itemId);
  if (source?.id !== itemId || typeof Player !== "function") throw new Error("Learning content unavailable");

  // Metadata supplies canonical track/path order. The shared curriculum helper
  // supplies the same final-lesson next steps as the full-course export.
  // Authored exercises, explanations, answers and scoring stay unchanged.
  const {quizCount: _quizCount, questionCount: _questionCount, ...canonical} = metadata;
  const item = {...source, ...canonical};
  if (kind !== "exam") item.blocks = (source.blocks || []).filter(block => block.type !== "sort" && block.type !== "match");
  return {item, Player};
}
