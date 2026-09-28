// This module and the exercise text load only when a learner opens an activity.
import LessonPlayer from "./LessonPlayer.jsx";
import ChallengePlayer from "./ChallengePlayer.jsx";
import ExamPlayer from "./ExamPlayer.jsx";
import { lessonsByOrder, challengesByOrder, examsByOrder } from "../data/lessons.js";

const sources = {
  lesson: [lessonsByOrder, LessonPlayer],
  challenge: [challengesByOrder, ChallengePlayer],
  exam: [examsByOrder, ExamPlayer],
};

export function learningItem(kind, itemId) {
  const [items, Player] = sources[kind] || [];
  const item = items?.find(candidate => candidate.id === itemId);
  if (!item || !Player) throw new Error("Learning content unavailable");
  return { item, Player };
}
